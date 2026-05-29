/**
 * ShadowFeed Partner Bridge — HMAC request authentication.
 * When valid, signed requests bypass x402 payment (ShadowFeed settles STX upstream).
 *
 * @see https://docs.shadowfeed.app/providers/hmac-integration
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const TIMESTAMP_WINDOW_SEC = 300;
const PARTNER_HEADER = "shadowfeed";

/** @type {Map<string, number>} nonce → expiresAt (unix sec) */
const seenNonces = new Map();

function header(req, name) {
  const key = String(name).toLowerCase();
  const raw = req.headers[key];
  if (typeof raw === "string") return raw.trim();
  if (Array.isArray(raw)) return String(raw[0] ?? "").trim();
  return "";
}

function sweepExpiredNonces(nowSec) {
  for (const [nonce, expiresAt] of seenNonces) {
    if (expiresAt <= nowSec) seenNonces.delete(nonce);
  }
}

function rememberNonce(nonce, nowSec) {
  sweepExpiredNonces(nowSec);
  if (seenNonces.has(nonce)) return false;
  seenNonces.set(nonce, nowSec + TIMESTAMP_WINDOW_SEC);
  return true;
}

function constantTimeHexEqual(actual, expected) {
  if (typeof actual !== "string" || typeof expected !== "string") return false;
  const a = actual.toLowerCase();
  const b = expected.toLowerCase();
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
  } catch {
    return false;
  }
}

/**
 * Canonical path ShadowFeed signs: registered source_path (no query string).
 * Express `req.path` is mount-relative; use originalUrl for the full route path.
 */
export function getShadowfeedCanonicalPath(req) {
  const fromOriginal = String(req.originalUrl || "").split("?")[0];
  if (fromOriginal) return fromOriginal;
  const base = String(req.baseUrl || "");
  const path = String(req.path || "/");
  if (base && path.startsWith("/")) return `${base}${path}`;
  if (base) return `${base}/${path}`;
  return path || "/";
}

function sha256Hex(body) {
  if (!body || body.length === 0) return "";
  return createHash("sha256").update(body).digest("hex");
}

function getRequestBodyBytes(req) {
  const method = String(req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD") return Buffer.alloc(0);
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === "string") return Buffer.from(req.rawBody, "utf8");
  return Buffer.alloc(0);
}

/**
 * @param {import('express').Request} req
 * @param {string} secret
 * @param {{ canonicalPath?: string }} [options]
 */
export function verifyShadowfeedHmac(req, secret, options = {}) {
  if (!secret) return false;

  const ts = Number.parseInt(header(req, "X-Sf-Timestamp"), 10);
  const nonce = header(req, "X-Sf-Nonce");
  const sig = header(req, "X-Sf-Signature");
  if (!Number.isFinite(ts) || ts <= 0 || !nonce || !sig) return false;

  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - ts) > TIMESTAMP_WINDOW_SEC) return false;
  if (!rememberNonce(nonce, nowSec)) return false;

  const bodyBytes = getRequestBodyBytes(req);
  const bodyHash = sha256Hex(bodyBytes);
  const canonicalPath = options.canonicalPath ?? getShadowfeedCanonicalPath(req);
  const canonical = [
    String(req.method || "GET").toUpperCase(),
    canonicalPath,
    String(ts),
    nonce,
    bodyHash,
  ].join("\n");

  const expected = createHmac("sha256", secret).update(canonical, "utf8").digest("hex");
  return constantTimeHexEqual(sig, expected);
}

export function isShadowfeedPartnerRequest(req) {
  return req?.skipX402 === true || req?.x402Payment?.kind === "shadowfeed-partner";
}

/**
 * Mark request as ShadowFeed-authenticated (used by x402 middleware after global verifier).
 */
export function markShadowfeedPartnerBypass(req) {
  req.skipX402 = true;
  req.x402Payment = { kind: "shadowfeed-partner" };
}

/**
 * Express middleware — mount before x402 payment middleware on paid routes, or globally
 * for all x402 routes (see index.js).
 *
 * Only requests with X-Sf-Partner: shadowfeed are verified; others pass through unchanged.
 */
export function shadowfeedPartnerMiddleware() {
  const secret = process.env.SHADOWFEED_PARTNER_SECRET?.trim() || "";

  return (req, res, next) => {
    if (header(req, "X-Sf-Partner") !== PARTNER_HEADER) {
      return next();
    }

    if (!secret) {
      return res.status(503).json({
        error: "ShadowFeed partner auth is not configured",
        message: "Set SHADOWFEED_PARTNER_SECRET on the API server",
      });
    }

    if (!verifyShadowfeedHmac(req, secret)) {
      return res.status(401).json({ error: "invalid HMAC signature" });
    }

    markShadowfeedPartnerBypass(req);
    return next();
  };
}
