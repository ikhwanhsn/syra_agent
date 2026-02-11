/**
 * CoinGecko x402 payer using the official Coinbase x402 client (Solana only).
 * See https://docs.cdp.coinbase.com/x402/quickstart-for-buyers
 * and https://docs.coingecko.com/docs/x402
 *
 * Uses @x402/fetch + @x402/svm. CoinGecko returns 402 with x402Version: 2 in the body;
 * @x402/fetch only parses body when x402Version === 1, so we also support a manual 402
 * flow that parses v2 and retries with payment (coinGeckoFetchManual402).
 */
import bs58 from "bs58";
import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client } from "@x402/core/client";
import { decodePaymentRequiredHeader, encodePaymentSignatureHeader } from "@x402/core/http";
import { ExactSvmScheme } from "@x402/svm/exact/client";

/** Lazy-built fetch that pays via Solana (set after first ensurePayer()). */
let fetchWithPayment = null;

/** Stored x402 client for manual 402 handling (v2 body). */
let x402ClientInstance = null;

/**
 * Parse PAYER_KEYPAIR from env. Accepts:
 * - base58 string (e.g. from Solana CLI keygen)
 * - JSON array of 64 numbers (e.g. [1,2,...,64])
 * @returns {Uint8Array} 64-byte keypair
 */
function parseKeypairFromEnv(value) {
  const raw = typeof value === "string" ? value.trim() : String(value).trim();
  if (!raw) return null;

  // JSON array format: [187,200,5,...]
  const trimmed = raw.replace(/\s+/g, "");
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    let arr;
    try {
      arr = JSON.parse(raw);
    } catch {
      return null;
    }
    if (!Array.isArray(arr) || arr.length !== 64) return null;
    if (!arr.every((n) => typeof n === "number" && n >= 0 && n <= 255)) return null;
    return new Uint8Array(arr);
  }

  // base58 format
  try {
    const decoded = bs58.decode(raw);
    if (decoded.length !== 64) return null;
    return new Uint8Array(decoded);
  } catch {
    return null;
  }
}

export async function ensurePayer() {
  const keypairB58 = process.env.PAYER_KEYPAIR;
  if (!keypairB58 || !String(keypairB58).trim()) {
    throw new Error("PAYER_KEYPAIR must be set for CoinGecko x402. Add it to your .env.");
  }
  if (fetchWithPayment) return;

  const keypairBytes = parseKeypairFromEnv(keypairB58);
  if (!keypairBytes || keypairBytes.length !== 64) {
    throw new Error(
      "PAYER_KEYPAIR must be a 64-byte Solana keypair: either base58 string or JSON array of 64 numbers [0-255]."
    );
  }

  const { createKeyPairSignerFromBytes } = await import("@solana/kit");
  const signer = await createKeyPairSignerFromBytes(keypairBytes);

  const scheme = new ExactSvmScheme(signer);
  const config = { schemes: [{ network: "solana:*", client: scheme }] };
  x402ClientInstance = x402Client.fromConfig(config);
  fetchWithPayment = wrapFetchWithPayment(globalThis.fetch, x402ClientInstance);
}

/**
 * Parse PaymentRequired from a 402 response. Accepts PAYMENT-REQUIRED header (base64)
 * or body with x402Version 1 or 2 (CoinGecko sends v2; @x402/fetch only accepts v1 in body).
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
 * Fetch that pays CoinGecko x402 with Solana/USDC. Call ensurePayer() before first use.
 * Uses @x402/fetch wrapper; if CoinGecko returns 402 with v2 body, the wrapper throws.
 * Use coinGeckoFetchManual402 for endpoints that get 402 with v2 body.
 * @param {string | URL} input
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
export async function coinGeckoFetch(input, init) {
  if (!fetchWithPayment) {
    throw new Error("CoinGecko x402: call ensurePayer() before coinGeckoFetch");
  }
  return fetchWithPayment(input, init);
}

/**
 * Fetch CoinGecko with manual 402 handling so we accept x402Version 2 in the body
 * (CoinGecko's format). First request is plain; on 402 we parse, create payment, retry.
 * @param {string | URL} input
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
export async function coinGeckoFetchManual402(input, init) {
  await ensurePayer();
  const url = typeof input === "string" ? input : input.toString();
  const first = await globalThis.fetch(url, init);
  if (first.status !== 402) return first;

  const paymentRequiredHeader = first.headers.get("Payment-Required") || first.headers.get("PAYMENT-REQUIRED");
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
      "CoinGecko returned 402 but no parseable payment requirements (need PAYMENT-REQUIRED header or body with x402Version 1 or 2)."
    );
  }

  const payload = await x402ClientInstance.createPaymentPayload(paymentRequired);
  const encoded = encodePaymentSignatureHeader(payload);
  const headers = new Headers(init?.headers);
  // CoinGecko x402 uses v2; v2 expects PAYMENT-SIGNATURE, v1 uses X-PAYMENT (see docs.coingecko.com/docs/x402).
  const paymentHeaderName = payload?.x402Version === 1 ? "X-PAYMENT" : "PAYMENT-SIGNATURE";
  headers.set(paymentHeaderName, encoded);
  return globalThis.fetch(url, { ...init, headers });
}
