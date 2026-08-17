/**
 * Hosted x402 refund coverage.
 * POST /refund/relay  — Syra observes the upstream call (x402 premium when covering a paid attempt)
 * POST /refund/reprobe — attested GET re-probe (x402 premium)
 * GET  /refund/status
 * GET  /refund/claims?wallet=
 */
import express from "express";
import RefundLedger from "../../models/RefundLedger.js";
import { getV2Payment } from "../../utils/getV2Payment.js";
import { getResourceDescription } from "../../config/x402ResourceCatalog.js";
import {
  computeHostedRefundPremiumUsd,
  X402_REFUND_PREMIUM_FLAT_USD,
} from "../../config/x402Pricing.js";
import {
  getRefundResolvedConfig,
  isHostedRefundEnabled,
} from "../../config/refund.js";
import {
  coverHostedCall,
  parseSafeRelayTarget,
} from "../../libs/refund/coverageService.js";
import { isHostedHostnameEligible } from "../../config/refund.js";

const RELAY_TIMEOUT_MS = 25_000;
const RELAY_MAX_BODY_BYTES = 1_048_576;

const HOP_BY_HOP = new Set([
  "host",
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "content-length",
  "payment-signature",
  "x-payment",
]);

function header(req, name) {
  const v = req.get?.(name) || req.headers?.[name] || req.headers?.[name.toLowerCase()];
  if (Array.isArray(v)) return String(v[0] || "").trim();
  return v == null ? "" : String(v).trim();
}

function hasUpstreamPayment(req) {
  return Boolean(
    header(req, "x-refund-upstream-payment") ||
      header(req, "payment-signature") ||
      header(req, "x-payment"),
  );
}

function coveredUsdFromReq(req) {
  const raw = header(req, "x-refund-covered-usd") || req.body?.coveredUsd;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function premiumFromReq(req) {
  return computeHostedRefundPremiumUsd(coveredUsdFromReq(req));
}

function buildUpstreamHeaders(req) {
  const out = {};
  const raw = req.headers || {};
  for (const [k, v] of Object.entries(raw)) {
    const key = String(k).toLowerCase();
    if (HOP_BY_HOP.has(key)) continue;
    if (key.startsWith("x-refund-")) continue;
    if (v == null) continue;
    out[k] = Array.isArray(v) ? v.join(",") : String(v);
  }
  const upstreamPay =
    header(req, "x-refund-upstream-payment") ||
    header(req, "payment-signature") ||
    header(req, "x-payment");
  const payHeader = header(req, "x-refund-upstream-payment-header") || "PAYMENT-SIGNATURE";
  if (upstreamPay) {
    out[payHeader] = upstreamPay;
  }
  return out;
}

function premiumMeta(req, settle) {
  return {
    premiumUsd: Number(req.x402Payment?.priceUsd) || premiumFromReq(req),
    premiumTx:
      (typeof settle?.transaction === "string" && settle.transaction) ||
      header(req, "x-refund-premium-tx") ||
      null,
    payerWallet:
      (typeof settle?.payer === "string" && settle.payer) ||
      header(req, "x-refund-to") ||
      null,
  };
}

function setCoverageHeaders(res, coverage) {
  const skipped = Boolean(coverage?.skipped);
  const refunded = Boolean(coverage?.ok && coverage?.signature);
  res.setHeader(
    "X-Syra-Coverage",
    refunded ? "refunded" : skipped ? "skipped" : coverage?.ok ? "covered" : "none",
  );
  if (coverage?.reason) res.setHeader("X-Syra-Coverage-Reason", String(coverage.reason));
  if (coverage?.signature) res.setHeader("X-Syra-Refund-Tx", String(coverage.signature));
}

async function forwardUpstream({ url, method, headers, body, signal }) {
  const res = await fetch(url, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : body,
    redirect: "manual",
    signal,
  });
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > RELAY_MAX_BODY_BYTES) {
    return {
      status: 502,
      headers: { "content-type": "application/json" },
      body: Buffer.from(JSON.stringify({ success: false, error: "upstream_body_too_large" })),
      truncated: true,
    };
  }
  const passthrough = {};
  res.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === "transfer-encoding" || k === "content-encoding" || k === "content-length") return;
    passthrough[key] = value;
  });
  return { status: res.status, headers: passthrough, body: buf, upstreamRes: res };
}

export async function createRefundCoverageRouter() {
  const router = express.Router();
  const {
    requirePayment,
    settlePaymentAndSetResponse,
  } = await getV2Payment();

  const paymentOpts = {
    price: X402_REFUND_PREMIUM_FLAT_USD,
    getPriceUsd: (req) => premiumFromReq(req),
    description: getResourceDescription("refund/relay"),
    discoverable: true,
    resource: "/refund/relay",
    method: "POST",
  };

  function maybeRequirePremium(req, res, next) {
    if (!isHostedRefundEnabled()) {
      return res.status(503).json({
        success: false,
        error: "hosted_refund_disabled",
        hint: "Set REFUND_HOSTED_ENABLED=true and REFUND_HOSTED_ALLOWLIST",
      });
    }
    if (!hasUpstreamPayment(req)) {
      req._syraRefundProbe = true;
      return next();
    }
    return requirePayment(paymentOpts)(req, res, next);
  }

  router.get("/status", (_req, res) => {
    return res.json({
      success: true,
      data: {
        ...getRefundResolvedConfig(),
        premiumFlatUsd: X402_REFUND_PREMIUM_FLAT_USD,
        source: "syra-refund-hosted",
      },
    });
  });

  router.get("/claims", async (req, res) => {
    try {
      const wallet = typeof req.query.wallet === "string" ? req.query.wallet.trim() : "";
      if (!wallet) {
        return res.status(400).json({ success: false, error: "wallet is required" });
      }
      const limitRaw = Number(req.query.limit ?? 50);
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;
      const refunds = await RefundLedger.find({
        source: "hosted",
        $or: [{ toWallet: wallet }, { payerWallet: wallet }],
      })
        .sort({ settledAt: -1, createdAt: -1 })
        .limit(limit)
        .lean();
      return res.json({
        success: true,
        data: {
          enabled: isHostedRefundEnabled(),
          config: getRefundResolvedConfig(),
          refunds,
          count: refunds.length,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  router.post("/relay", maybeRequirePremium, async (req, res) => {
    const targetRaw = header(req, "x-refund-target") || req.body?.url || req.body?.target;
    const parsed = parseSafeRelayTarget(targetRaw);
    if (!parsed.ok) {
      return res.status(400).json({ success: false, error: parsed.reason });
    }
    if (!isHostedHostnameEligible(parsed.host)) {
      return res.status(403).json({ success: false, error: "host_not_allowlisted" });
    }

    const method = (header(req, "x-refund-method") || req.method || "GET").toUpperCase();
    const allowed = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]);
    if (!allowed.has(method)) {
      return res.status(400).json({ success: false, error: "method_not_allowed" });
    }

    let settle = null;
    if (!req._syraRefundProbe && req.x402Payment) {
      try {
        settle = await settlePaymentAndSetResponse(res, req);
      } catch (e) {
        return res.status(502).json({
          success: false,
          error: "premium_settle_failed",
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS);
    let forwarded;
    try {
      const body =
        method === "GET" || method === "HEAD"
          ? undefined
          : Buffer.isBuffer(req.body)
            ? req.body
            : req.body && typeof req.body === "object" && !req.body.url
              ? JSON.stringify(req.body)
              : typeof req.body === "string"
                ? req.body
                : undefined;
      forwarded = await forwardUpstream({
        url: parsed.url.href,
        method,
        headers: buildUpstreamHeaders(req),
        body,
        signal: controller.signal,
      });
    } catch (e) {
      clearTimeout(timer);
      const msg = e instanceof Error ? e.message : String(e);
      const coverage = await coverHostedCall({
        mode: "relay",
        url: parsed.url.href,
        host: parsed.host,
        httpStatus: null,
        errorMessage: msg,
        reqHeaders: buildUpstreamHeaders(req),
        resHeaders: {},
        toWallet: header(req, "x-refund-to"),
        coveredUsd: coveredUsdFromReq(req),
        chain: header(req, "x-refund-chain"),
        ...premiumMeta(req, settle),
      }).catch((err) => ({ ok: false, skipped: true, reason: err?.message || "cover_failed" }));
      setCoverageHeaders(res, coverage);
      if (req._syraRefundProbe) {
        res.setHeader("X-Syra-Coverage", "probe");
      }
      return res.status(502).json({
        success: false,
        error: "upstream_network_error",
        message: msg,
        coverage,
      });
    }
    clearTimeout(timer);

    const coverage = req._syraRefundProbe
      ? { ok: false, skipped: true, reason: "probe" }
      : await coverHostedCall({
          mode: "relay",
          url: parsed.url.href,
          host: parsed.host,
          httpStatus: forwarded.status,
          reqHeaders: buildUpstreamHeaders(req),
          resHeaders: forwarded.headers,
          toWallet: header(req, "x-refund-to"),
          coveredUsd: coveredUsdFromReq(req),
          chain: header(req, "x-refund-chain"),
          ...premiumMeta(req, settle),
        }).catch((err) => ({ ok: false, skipped: true, reason: err?.message || "cover_failed" }));

    setCoverageHeaders(res, coverage);
    if (req._syraRefundProbe) res.setHeader("X-Syra-Coverage", "probe");

    const upstreamPaymentResponse =
      forwarded.headers["payment-response"] ||
      forwarded.headers["Payment-Response"] ||
      forwarded.headers["x-payment-response"];
    if (upstreamPaymentResponse) {
      res.setHeader("X-Upstream-Payment-Response", String(upstreamPaymentResponse));
    }
    for (const [k, v] of Object.entries(forwarded.headers)) {
      const key = String(k).toLowerCase();
      if (key === "payment-response" || key === "x-payment-response") continue;
      if (!res.getHeader(k)) res.setHeader(k, v);
    }
    return res.status(forwarded.status).send(forwarded.body);
  });

  router.post(
    "/reprobe",
    requirePayment({ ...paymentOpts, resource: "/refund/reprobe" }),
    async (req, res) => {
      if (!isHostedRefundEnabled()) {
        return res.status(503).json({
          success: false,
          error: "hosted_refund_disabled",
        });
      }
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const targetRaw = body.url || header(req, "x-refund-target");
      const parsed = parseSafeRelayTarget(targetRaw);
      if (!parsed.ok) {
        return res.status(400).json({ success: false, error: parsed.reason });
      }
      if (!isHostedHostnameEligible(parsed.host)) {
        return res.status(403).json({ success: false, error: "host_not_allowlisted" });
      }

      let settle = null;
      try {
        settle = await settlePaymentAndSetResponse(res, req);
      } catch (e) {
        return res.status(502).json({
          success: false,
          error: "premium_settle_failed",
          message: e instanceof Error ? e.message : String(e),
        });
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS);
      let httpStatus = null;
      let errorMessage = "";
      let resHeaders = {};
      try {
        const upstream = await fetch(parsed.url.href, {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
        });
        httpStatus = upstream.status;
        upstream.headers.forEach((value, key) => {
          resHeaders[key] = value;
        });
        await upstream.arrayBuffer().catch(() => {});
      } catch (e) {
        errorMessage = e instanceof Error ? e.message : String(e);
      }
      clearTimeout(timer);

      const coverage = await coverHostedCall({
        mode: "reprobe",
        url: parsed.url.href,
        host: parsed.host,
        httpStatus,
        errorMessage,
        reqHeaders: {
          "payment-signature": body.paymentHeader || "",
          "x-payment": body.paymentTx || "",
        },
        resHeaders,
        toWallet: body.refundTo || header(req, "x-refund-to"),
        coveredUsd: Number(body.coveredUsd) || coveredUsdFromReq(req),
        chain: body.chain || header(req, "x-refund-chain"),
        ...premiumMeta(req, settle),
      }).catch((err) => ({ ok: false, skipped: true, reason: err?.message || "cover_failed" }));

      setCoverageHeaders(res, coverage);
      return res.json({
        success: true,
        data: {
          url: parsed.url.href,
          httpStatus,
          coverage,
        },
      });
    },
  );

  return router;
}
