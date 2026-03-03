/**
 * CoinMarketCap x402 API utilities.
 * CMC x402 uses Base (eip155:8453) and PAYMENT-SIGNATURE (v2).
 * See https://coinmarketcap.com/api/x402/ and https://pro.coinmarketcap.com/api/documentation/v1/#tag/x402-(beta)
 */
import { decodePaymentRequiredHeader, encodePaymentSignatureHeader } from "@x402/core/http";
import { x402Client } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const CMC_X402_BASE = "https://pro-api.coinmarketcap.com/x402";

/** Lazy-built x402 client for CMC (Base/EVM only). */
let cmcX402Client = null;

/**
 * Normalize a possible payment-required payload to { x402Version, accepts }.
 * Handles top-level or nested (data, paymentRequired, payment_required) and missing x402Version (default 2 for CMC).
 */
function normalizePaymentRequired(obj) {
  if (!obj || typeof obj !== "object") return null;
  const hasAccepts = Array.isArray(obj.accepts) && obj.accepts.length > 0;
  const version = obj.x402Version === 1 ? 1 : 2;
  if (hasAccepts) return { ...obj, x402Version: version, accepts: obj.accepts };
  return null;
}

/**
 * Decode Payment-Required header manually (base64 JSON). CMC sends full payment terms here;
 * body may only contain { resource, error } without accepts[].
 * @param {string} rawHeader - Raw header value (base64)
 * @returns {{ x402Version: number; accepts: object[] } | null}
 */
function decodePaymentRequiredHeaderManual(rawHeader) {
  if (!rawHeader || typeof rawHeader !== "string") return null;
  try {
    const json = Buffer.from(rawHeader.trim(), "base64").toString("utf8");
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;
    const version = obj.x402Version === 1 ? 1 : 2;
    if (Array.isArray(obj.accepts) && obj.accepts.length > 0) {
      return { ...obj, x402Version: version, accepts: obj.accepts };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse PaymentRequired from a 402 response (header base64 or body with x402Version 1 or 2).
 * Tries: Payment-Required header via @x402/core, then manual base64 decode, then body top-level / body.data / body.paymentRequired.
 * CMC often sends full payment terms only in the header; body may be { resource, error } only.
 */
function parsePaymentRequiredFrom402(headerValue, body) {
  const rawHeader = (typeof headerValue === "string" && headerValue.trim()) ? headerValue.trim() : null;
  if (rawHeader) {
    try {
      const decoded = decodePaymentRequiredHeader(rawHeader);
      if (decoded && (decoded.x402Version === 1 || decoded.x402Version === 2) && Array.isArray(decoded.accepts) && decoded.accepts.length > 0) {
        return decoded;
      }
    } catch {
      // library decode failed; try manual base64 + JSON
    }
    const manual = decodePaymentRequiredHeaderManual(rawHeader);
    if (manual) return manual;
  }
  if (body && typeof body === "object") {
    const top = normalizePaymentRequired(body);
    if (top) return top;
    const fromData = normalizePaymentRequired(body.data);
    if (fromData) return fromData;
    const fromPaymentRequired = normalizePaymentRequired(body.paymentRequired || body.payment_required);
    if (fromPaymentRequired) return fromPaymentRequired;
  }
  return null;
}

/**
 * Ensure CMC payer is initialized. Requires CMC_PAYER_PRIVATE_KEY (EVM/Base hex private key).
 * CMC only accepts Base (eip155:8453) per their docs.
 */
export async function ensureCmcPayer() {
  if (cmcX402Client) return;

  const raw = (process.env.CMC_PAYER_PRIVATE_KEY || process.env.BASE_PAYER_PRIVATE_KEY || "").trim();
  if (!raw) {
    throw new Error(
      "CMC_PAYER_PRIVATE_KEY or BASE_PAYER_PRIVATE_KEY must be set for CoinMarketCap x402 (Base/EVM). Add a hex private key to .env."
    );
  }

  const hexKey = raw.startsWith("0x") ? raw : `0x${raw}`;
  const account = privateKeyToAccount(/** @type {`0x${string}`} */ (hexKey));
  const scheme = new ExactEvmScheme(account);
  const config = { schemes: [{ network: "eip155:*", client: scheme }] };
  cmcX402Client = x402Client.fromConfig(config);
}

/**
 * Fetch CoinMarketCap x402 endpoint with manual 402 handling (same pattern as coinGeckoFetchManual402).
 * First request is plain; on 402 we parse, create payment with EVM signer, retry with PAYMENT-SIGNATURE.
 *
 * @param {string | URL} input - Full CMC x402 URL (e.g. https://pro-api.coinmarketcap.com/x402/v3/cryptocurrency/quotes/latest?id=1)
 * @param {RequestInit} [init] - Optional fetch init (method, headers, body)
 * @returns {Promise<Response>}
 */
export async function cmcX402Fetch(input, init = {}) {
  await ensureCmcPayer();
  const url = typeof input === "string" ? input : input.toString();
  const first = await globalThis.fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "User-Agent": "Syra-API/1.0 (https://syraa.fun; server)",
      ...(init.headers || {}),
    },
  });
  if (first.status !== 402) return first;

  // Header name is case-insensitive per HTTP; read by name first, then by iterating in case of casing quirks
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
  const paymentRequired = parsePaymentRequiredFrom402(paymentRequiredHeader, body);
  if (!paymentRequired) {
    const bodyKeys = body && typeof body === "object" ? Object.keys(body).join(", ") : "";
    const headerPresent = !!paymentRequiredHeader;
    let msg =
      "CoinMarketCap returned 402 but no parseable payment requirements (need Payment-Required header or body with x402Version 1 or 2 and accepts[]).";
    if (bodyKeys) msg += ` Body keys: ${bodyKeys}.`;
    if (headerPresent) {
      msg += " Payment-Required header was present but could not be decoded.";
    } else {
      msg += " Payment-Required header was missing.";
    }
    msg += " If this is a credit or rate-limit error, ensure your CMC x402 account has credits (see https://coinmarketcap.com/api/x402/).";
    throw new Error(msg);
  }

  const payload = await cmcX402Client.createPaymentPayload(paymentRequired);
  const encoded = encodePaymentSignatureHeader(payload);
  const headers = new Headers(init.headers);
  headers.set("PAYMENT-SIGNATURE", encoded);
  return globalThis.fetch(url, { ...init, headers });
}

/**
 * Build full CMC x402 URL for a given path and query/body params.
 * Path should be relative to CMC_X402_BASE, e.g. "v3/cryptocurrency/quotes/latest".
 *
 * @param {string} path - Path without leading slash (e.g. v3/cryptocurrency/quotes/latest)
 * @param {Record<string, string | number | boolean | undefined>} [params] - Query params for GET; for POST, pass in init.body
 * @returns {string}
 */
export function buildCmcX402Url(path, params = {}) {
  const base = CMC_X402_BASE.replace(/\/$/, "");
  const p = path.replace(/^\//, "");
  const url = new URL(`${base}/${p}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== null) {
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/** x402-enabled CMC endpoints (path relative to CMC_X402_BASE). */
export const CMC_X402_ENDPOINTS = {
  quotesLatest: "v3/cryptocurrency/quotes/latest",
  listingLatest: "v3/cryptocurrency/listing/latest",
  dexPairsQuotesLatest: "v4/dex/pairs/quotes/latest",
  dexSearch: "v1/dex/search",
  mcp: "mcp",
};
