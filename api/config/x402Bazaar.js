/**
 * x402 Bazaar discovery (Ampersend marketplace, CDP Bazaar, x402scan).
 * @see https://docs.x402.org/extensions/bazaar
 * @see https://docs.ampersend.ai/platform/marketplace
 */

function env(name) {
  return String(process.env[name] || "").trim();
}

/** Base mainnet CAIP-2 — Ampersend production marketplace filter. */
export const AMPERSEND_MARKETPLACE_NETWORK = "eip155:8453";

/**
 * Master switch for Bazaar discovery metadata on 402 responses and settle payloads.
 * Default ON. Set X402_BAZAAR_ENABLED=false to disable.
 */
export function isX402BazaarEnabled() {
  const flag = env("X402_BAZAAR_ENABLED").toLowerCase();
  if (flag === "false" || flag === "0") return false;
  if (flag === "true" || flag === "1") return true;
  return true;
}

/**
 * Whether a settled network qualifies for Ampersend marketplace visibility (Base mainnet).
 * @param {string | undefined} caip2
 */
export function isAmpersendDiscoveryNetwork(caip2) {
  return String(caip2 || "").trim() === AMPERSEND_MARKETPLACE_NETWORK;
}
