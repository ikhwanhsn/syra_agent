/**
 * x402 payment network preference (Solana default; Algorand for Global x402 Challenge).
 */

/** @returns {'solana'|'algorand'|'base'|string} */
export function getPreferredX402Network() {
  return String(process.env.X402_PREFERRED_NETWORK || "solana")
    .trim()
    .toLowerCase();
}

export function shouldUseAlgorandX402() {
  return getPreferredX402Network() === "algorand";
}

export function shouldUseBaseX402() {
  return getPreferredX402Network() === "base";
}

export function shouldUseSolanaX402() {
  const pref = getPreferredX402Network();
  return pref === "solana" || pref === "" || pref === "default";
}
