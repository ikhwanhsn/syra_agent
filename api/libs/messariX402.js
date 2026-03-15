/**
 * Messari x402 API library.
 * Messari uses Base Mainnet (EVM / eip155:8453) for x402 payments with USDC.
 * Manual 402 flow: send request → get 402 → parse Payment-Required → sign → retry.
 *
 * Env: CMC_PAYER_PRIVATE_KEY or BASE_PAYER_PRIVATE_KEY (hex EVM private key)
 * Base URL: https://api.messari.io
 * Docs: https://docs.messari.io/api-reference/x402-payments
 */
import https from "node:https";
import { decodePaymentRequiredHeader, encodePaymentSignatureHeader } from "@x402/core/http";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

export const MESSARI_BASE = "https://api.messari.io";

const MESSARI_HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
  "User-Agent": "Syra-API/1.0 (https://syraa.fun; server)",
};

let messariX402Client = null;

/**
 * Fetch 402 response via Node https to reliably read raw Payment-Required header.
 * fetch/undici may not always expose it.
 */
function messari402ViaHttps(url, method = "GET", body = null) {
  const u = new URL(url);
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: { ...MESSARI_HEADERS },
    };
    if (body) opts.headers["Content-Length"] = Buffer.byteLength(body);
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () =>
        resolve({
          statusCode: res.statusCode ?? 0,
          headers: res.headers,
          body: Buffer.concat(chunks).toString("utf8"),
        })
      );
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function normalizePaymentRequired(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (Array.isArray(obj.accepts) && obj.accepts.length > 0) {
    return { ...obj, x402Version: obj.x402Version === 1 ? 1 : 2, accepts: obj.accepts };
  }
  return null;
}

function decodePaymentRequiredHeaderManual(rawHeader) {
  if (!rawHeader || typeof rawHeader !== "string") return null;
  try {
    const json = Buffer.from(rawHeader.trim(), "base64").toString("utf8");
    const obj = JSON.parse(json);
    return normalizePaymentRequired(obj);
  } catch {
    return null;
  }
}

function parsePaymentRequiredFrom402(headerValue, body) {
  const rawHeader =
    typeof headerValue === "string" && headerValue.trim() ? headerValue.trim() : null;
  if (rawHeader) {
    try {
      const decoded = decodePaymentRequiredHeader(rawHeader);
      if (
        decoded &&
        (decoded.x402Version === 1 || decoded.x402Version === 2) &&
        Array.isArray(decoded.accepts) &&
        decoded.accepts.length > 0
      ) {
        return decoded;
      }
    } catch {
      // library decode failed
    }
    const manual = decodePaymentRequiredHeaderManual(rawHeader);
    if (manual) return manual;
  }
  if (body && typeof body === "object") {
    const top = normalizePaymentRequired(body);
    if (top) return top;
    const fromData = normalizePaymentRequired(body.data);
    if (fromData) return fromData;
    const fromPR = normalizePaymentRequired(body.paymentRequired || body.payment_required);
    if (fromPR) return fromPR;
  }
  return null;
}

/**
 * Initialize EVM payer for Messari x402 (Base Mainnet).
 * Reuses BASE_PAYER_PRIVATE_KEY for shared payer across EVM x402 partners.
 */
export async function ensureMessariPayer() {
  if (messariX402Client) return;

  const raw = (
    process.env.CMC_PAYER_PRIVATE_KEY ||
    process.env.BASE_PAYER_PRIVATE_KEY ||
    ""
  ).trim();
  if (!raw) {
    throw new Error(
      "CMC_PAYER_PRIVATE_KEY or BASE_PAYER_PRIVATE_KEY must be set for Messari x402 (Base/EVM). Add a hex private key to .env."
    );
  }

  const hexKey = raw.startsWith("0x") ? raw : `0x${raw}`;
  const account = privateKeyToAccount(/** @type {`0x${string}`} */ (hexKey));
  const scheme = new ExactEvmScheme(account);
  messariX402Client = x402Client.fromConfig({
    schemes: [{ network: "eip155:*", client: scheme }],
  });
}

/**
 * Fetch a Messari x402 endpoint with manual 402 handling.
 * First request is plain; on 402 we parse payment terms, sign, retry with PAYMENT-SIGNATURE.
 * @param {string | URL} input - Full Messari URL
 * @param {RequestInit & { method?: string }} [init]
 * @returns {Promise<Response>}
 */
export async function messariX402Fetch(input, init = {}) {
  await ensureMessariPayer();
  const url = typeof input === "string" ? input : input.toString();
  const method = (init.method || "GET").toUpperCase();

  const first = await globalThis.fetch(url, {
    ...init,
    method,
    headers: { ...MESSARI_HEADERS, ...(init.headers || {}) },
  });
  if (first.status !== 402) return first;

  let paymentRequiredHeader =
    first.headers.get("Payment-Required") ||
    first.headers.get("payment-required") ||
    first.headers.get("PAYMENT-REQUIRED");
  if (!paymentRequiredHeader && typeof first.headers.entries === "function") {
    for (const [name, value] of first.headers.entries()) {
      if (name.toLowerCase() === "payment-required" && value) {
        paymentRequiredHeader = value;
        break;
      }
    }
  }

  let body = null;
  try {
    const text = await first.text();
    if (text) body = JSON.parse(text);
  } catch {
    // ignore
  }

  let paymentRequired = parsePaymentRequiredFrom402(paymentRequiredHeader, body);

  if (!paymentRequired) {
    const bodyStr = method === "POST" && init.body ? String(init.body) : null;
    const raw = await messari402ViaHttps(url, method, bodyStr);
    if (raw.statusCode === 402 && raw.body) {
      let rawBody = null;
      try {
        rawBody = JSON.parse(raw.body);
      } catch {
        // ignore
      }
      const h = raw.headers;
      const rawHV =
        h &&
        typeof h === "object" &&
        (h["payment-required"] ?? h["Payment-Required"] ?? h["PAYMENT-REQUIRED"]);
      const singleHeader = Array.isArray(rawHV) ? rawHV[0] : rawHV;
      paymentRequired = parsePaymentRequiredFrom402(singleHeader ?? null, rawBody ?? body);
      if (rawBody && !body) body = rawBody;
    }
  }

  if (!paymentRequired) {
    const errMsg =
      body && typeof body === "object" && typeof body.error === "string" ? body.error : "";
    let msg =
      "Messari returned 402 but no parseable payment requirements (need Payment-Required header or body with x402Version and accepts[]).";
    if (errMsg) msg += ` Messari message: "${errMsg}".`;
    throw new Error(msg);
  }

  const payload = await messariX402Client.createPaymentPayload(paymentRequired);
  const encoded = encodePaymentSignatureHeader(payload);
  const headers = new Headers(init.headers);
  Object.entries(MESSARI_HEADERS).forEach(([k, v]) => headers.set(k, v));
  headers.set("PAYMENT-SIGNATURE", encoded);
  return globalThis.fetch(url, { ...init, method, headers });
}

/**
 * Build full Messari API URL.
 * @param {string} path - Path relative to MESSARI_BASE (e.g. "metrics/v2/assets/details")
 * @param {Record<string, string | number | boolean | undefined>} [params] - Query params
 * @returns {string}
 */
export function buildMessariUrl(path, params = {}) {
  const base = MESSARI_BASE.replace(/\/$/, "");
  const p = path.replace(/^\//, "");
  const url = new URL(`${base}/${p}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) {
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/** Messari x402 endpoint paths. */
export const MESSARI_ENDPOINTS = {
  aiChat: "ai/v2/chat/completions",
  assets: "metrics/v2/assets",
  assetDetails: "metrics/v2/assets/details",
  assetAth: "metrics/v2/assets/ath",
  assetRoi: "metrics/v2/assets/roi",
  assetMetrics: "metrics/v2/assets/metrics",
  assetTimeseries: (assetId, datasetSlug, granularity) =>
    `metrics/v2/assets/${assetId}/metrics/${datasetSlug}/time-series/${granularity}`,
  signalAssets: "signal/v1/assets",
  mindshareGainers24h: "signal/v1/assets/mindshare-gainers-24h",
  mindshareGainers7d: "signal/v1/assets/mindshare-gainers-7d",
  mindshareLosers24h: "signal/v1/assets/mindshare-losers-24h",
  mindshareLosers7d: "signal/v1/assets/mindshare-losers-7d",
  signalAssetTimeseries: (granularity) => `signal/v1/assets/time-series/${granularity}`,
  newsFeed: "news/v1/news/feed",
  newsSources: "news/v1/news/sources",
  tokenUnlocksAssets: "token-unlocks/v1/assets",
  tokenUnlocksAllocations: "token-unlocks/v1/allocations",
  tokenUnlocksEvents: (assetId) => `token-unlocks/v1/assets/${assetId}/events`,
  tokenUnlocksVesting: (assetId) => `token-unlocks/v1/assets/${assetId}/vesting-schedule`,
  fundingRounds: "funding/v1/rounds",
  fundingInvestors: "funding/v1/rounds/investors",
  fundingProjects: "funding/v1/projects",
  fundingOrganizations: "funding/v1/organizations",
  fundingFunds: "funding/v1/funds",
  fundingMnA: "funding/v1/mergers-and-acquisitions",
  stablecoins: "metrics/v2/stablecoins",
  networks: "metrics/v2/networks",
  xUsers: "signal/v1/x-users",
  xUserTimeseries: (granularity) => `signal/v1/x-users/time-series/${granularity}`,
};
