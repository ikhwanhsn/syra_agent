import { fetchSolanaHolderSkew } from "./solanaContext.js";

/**
 * Holder + timing context for arena submissions (extend with more sources later).
 *
 * @typedef {{
 *   top10HolderPct: number | null;
 *   top1HolderPct: number | null;
 *   supplyUi: number | null;
 *   holderSkewScore: number;
 *   rpcOk: boolean;
 *   rpcError: string | null;
 *   rpcLatencyMs: number;
 *   buildMs: number;
 * }} MarketContext
 */

/**
 * Single fused pass: Solana holder concentration (optional RPC) for arena-style skew.
 * Set `ARENA_SOLANA_RPC_URL` or `SOLANA_RPC_URL` (e.g. Helius) for on-chain holder data.
 *
 * @param {{
 *   mint: string;
 *   priceAtRelease?: number | null;
 *   pair: unknown;
 * }} input
 * @returns {Promise<MarketContext>}
 */
export async function buildMarketContext(input) {
  const { mint, pair } = input;
  const rpcUrl = (process.env.ARENA_SOLANA_RPC_URL || process.env.SOLANA_RPC_URL || "").trim();
  const t0 = Date.now();

  let top10HolderPct = /** @type {number | null} */ (null);
  let top1HolderPct = /** @type {number | null} */ (null);
  let supplyUi = /** @type {number | null} */ (null);
  let rpcOk = false;
  let rpcError = /** @type {string | null} */ (null);

  if (rpcUrl) {
    const h = await fetchSolanaHolderSkew(mint, rpcUrl);
    rpcOk = h.ok;
    if (!h.ok && h.error) rpcError = h.error;
    top10HolderPct = h.top10Pct;
    top1HolderPct = h.top1Pct;
    supplyUi = h.supplyUi;
  }

  const rpcLatencyMs = Date.now() - t0;

  // Negative skew = concentrated / fragile for continuation (closer to top-agent "top10 / whale" signals).
  let holderSkewScore = 0;
  if (top10HolderPct != null && Number.isFinite(top10HolderPct)) {
    holderSkewScore -= Math.tanh(Math.max(0, top10HolderPct - 0.2) * 4.2) * 0.38;
  }
  if (top1HolderPct != null && top1HolderPct > 0.11) {
    holderSkewScore -= Math.tanh((top1HolderPct - 0.11) * 12) * 0.12;
  }

  const buildMs = Date.now() - t0;

  return {
    top10HolderPct,
    top1HolderPct,
    supplyUi,
    holderSkewScore,
    rpcOk,
    rpcError,
    rpcLatencyMs,
    buildMs,
  };
}
