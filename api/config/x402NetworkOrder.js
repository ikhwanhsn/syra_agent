/**
 * Order x402 402 `accepts` networks so mainnet Solana is preferred over devnet testnets.
 * Agent wallets hold mainnet USDC; devnet-first accepts break payment payload creation in dev.
 *
 * @template {{ id?: string; testnet?: boolean; kind?: string }} T
 * @param {readonly T[]} networks
 * @returns {T[]}
 */
export function sortX402AcceptNetworks(networks) {
  const priority = (n) => {
    const id = String(n?.id || "").toLowerCase();
    if (id === "solana-mainnet") return 0;
    if (n?.kind === "solana" && !n?.testnet) return 1;
    if (!n?.testnet) return 2;
    if (id === "solana-devnet") return 20;
    if (n?.testnet) return 21;
    return 10;
  };
  return [...networks].sort((a, b) => priority(a) - priority(b));
}

/** Solana mainnet CAIP-2 genesis (x402 v2). */
export const SOLANA_MAINNET_CAIP2 = "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp";

/**
 * Prefer mainnet Solana when multiple accepts are offered (agent wallets are mainnet-only).
 * Mutates `paymentRequired.accepts` in place when present.
 *
 * @param {{ accepts?: Array<{ network?: string }> } | null | undefined} paymentRequired
 */
export function preferMainnetSolanaAccepts(paymentRequired) {
  const accepts = paymentRequired?.accepts;
  if (!Array.isArray(accepts) || accepts.length < 2) return;
  const mainnetIdx = accepts.findIndex(
    (a) => String(a?.network || "").trim() === SOLANA_MAINNET_CAIP2
  );
  if (mainnetIdx <= 0) return;
  const [mainnet] = accepts.splice(mainnetIdx, 1);
  accepts.unshift(mainnet);
}
