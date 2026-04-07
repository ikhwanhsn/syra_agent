/**
 * Sentinel-wrapped payer.fetch for x402 route handlers.
 * Use this so all outbound x402 calls from paid routes (Jupiter, Nansen, etc.) are audited and budget-limited.
 * Audit records use the same storage as SentinelDashboard for local querying.
 * @see https://sentinel.valeocash.com/docs
 * @see https://sentinel.valeocash.com/docs/dashboard/overview
 */
import { payer } from "@faremeter/rides";
import { wrapWithSentinel, standardPolicy } from "@x402sentinel/x402";
import { getSentinelStorage } from "./sentinelStorage.js";

let cachedSentinelPayerFetch = null;

/**
 * Returns a Sentinel-wrapped version of payer.fetch (same signature as fetch).
 * Use for all outbound x402 calls in route handlers (Jupiter, check-status, etc.).
 * NOTE: Do NOT use for Nansen — Nansen returns 402 details in the Payment-Required header,
 * but @faremeter/rides only reads the body. Use getNansenPaymentFetch() instead.
 * Agent id "x402-api" groups these server-side paid calls in Sentinel.
 */
export function getSentinelPayerFetch() {
  if (cachedSentinelPayerFetch) return cachedSentinelPayerFetch;
  cachedSentinelPayerFetch = wrapWithSentinel(payer.fetch.bind(payer), {
    agentId: process.env.SENTINEL_AGENT_ID || "x402-api",
    budget: standardPolicy(),
    audit: { enabled: true, storage: getSentinelStorage() },
  });
  return cachedSentinelPayerFetch;
}

let cachedNansenPaymentFetch = null;

/**
 * Returns a Sentinel-wrapped x402-paying fetch for Nansen API calls.
 * Uses @x402/fetch (reads Payment-Required header) instead of @faremeter/rides (body only).
 * Requires PAYER_KEYPAIR env var (Solana base58 keypair).
 */
export async function getNansenPaymentFetch() {
  if (cachedNansenPaymentFetch) return cachedNansenPaymentFetch;

  const { PAYER_KEYPAIR } = process.env;
  if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

  const bs58 = (await import("bs58")).default;
  const { createKeyPairSignerFromBytes } = await import("@solana/kit");
  const { wrapFetchWithPayment } = await import("@x402/fetch");
  const { x402Client } = await import("@x402/core/client");
  const { ExactSvmScheme } = await import("@x402/svm/exact/client");

  const bytes = bs58.decode(PAYER_KEYPAIR.trim());
  const signer = await createKeyPairSignerFromBytes(bytes);
  const scheme = new ExactSvmScheme(signer);
  const config = { schemes: [{ network: "solana:*", client: scheme }] };
  const client = x402Client.fromConfig(config);
  const paymentFetch = wrapFetchWithPayment(globalThis.fetch, client);

  cachedNansenPaymentFetch = wrapWithSentinel(paymentFetch, {
    agentId: process.env.SENTINEL_AGENT_ID || "x402-api-nansen",
    budget: standardPolicy(),
    audit: { enabled: true, storage: getSentinelStorage() },
  });
  return cachedNansenPaymentFetch;
}

export { payer };
