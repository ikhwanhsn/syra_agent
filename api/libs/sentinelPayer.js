/**
 * Sentinel-wrapped payer.fetch for x402 route handlers.
 * Use this so all outbound x402 calls from paid routes (Jupiter, Nansen, etc.) are audited and budget-limited.
 * @see https://sentinel.valeocash.com/docs
 */
import { payer } from "@faremeter/rides";
import { wrapWithSentinel, standardPolicy } from "@x402sentinel/x402";

let cachedSentinelPayerFetch = null;

/**
 * Returns a Sentinel-wrapped version of payer.fetch (same signature as fetch).
 * Use for all outbound x402 calls in route handlers (Jupiter, Nansen, check-status, etc.).
 * Agent id "x402-api" groups these server-side paid calls in Sentinel.
 */
export function getSentinelPayerFetch() {
  if (cachedSentinelPayerFetch) return cachedSentinelPayerFetch;
  cachedSentinelPayerFetch = wrapWithSentinel(payer.fetch.bind(payer), {
    agentId: process.env.SENTINEL_AGENT_ID || "x402-api",
    budget: standardPolicy(),
  });
  return cachedSentinelPayerFetch;
}

export { payer };
