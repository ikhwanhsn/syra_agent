import { firstNonEmptyEnv } from "./parseKeypair.js";

export const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

export type X402PreferredNetwork = "solana" | "algorand" | "base" | string;

export function getPreferredX402Network(): X402PreferredNetwork {
  return firstNonEmptyEnv("X402_PREFERRED_NETWORK", "SYRA_X402_PREFERRED_NETWORK").toLowerCase() || "solana";
}

export function shouldUseAlgorandX402(): boolean {
  const pref = getPreferredX402Network();
  return pref === "algorand" || pref === "algorand-testnet";
}

export function shouldUseBaseX402(): boolean {
  return getPreferredX402Network() === "base";
}

export function preferMainnetSolanaAccepts(
  paymentRequired: { accepts?: Array<{ network?: string }> } | null | undefined,
): void {
  const accepts = paymentRequired?.accepts;
  if (!Array.isArray(accepts) || accepts.length < 2) return;
  const mainnetIdx = accepts.findIndex((a) => String(a?.network || "").trim() === SOLANA_MAINNET_CAIP2);
  if (mainnetIdx <= 0) return;
  const [mainnet] = accepts.splice(mainnetIdx, 1);
  accepts.unshift(mainnet);
}
