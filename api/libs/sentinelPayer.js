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
 * Use for all outbound x402 calls in route handlers (Jupiter, Nansen, check-status, etc.).
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

export { payer };
