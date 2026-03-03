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
 * Parse PaymentRequired from a 402 response (header base64 or body with x402Version 1 or 2).
 */
function parsePaymentRequiredFrom402(headerValue, body) {
  if (headerValue && typeof headerValue === "string" && headerValue.trim()) {
    return decodePaymentRequiredHeader(headerValue.trim());
  }
  if (body && typeof body === "object" && (body.x402Version === 1 || body.x402Version === 2)) {
    return body;
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

  const paymentRequiredHeader =
    first.headers.get("Payment-Required") || first.headers.get("payment-required");
  let body = null;
  try {
    const text = await first.text();
    if (text) body = JSON.parse(text);
  } catch {
    // ignore
  }
  const paymentRequired = parsePaymentRequiredFrom402(paymentRequiredHeader, body);
  if (!paymentRequired) {
    throw new Error(
      "CoinMarketCap returned 402 but no parseable payment requirements (need Payment-Required header or body with x402Version 1 or 2)."
    );
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
