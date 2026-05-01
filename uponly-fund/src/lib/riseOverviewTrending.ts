import type { RiseMarketRow } from "./riseDashboardTypes";

/**
 * Heuristic “trending” rank when RISE does not expose a dedicated trending sort.
 * Prioritizes 24h volume and participation; incorporates move and mcap without defaulting to age order.
 */
export function riseTrendingCompositeScore(row: RiseMarketRow): number {
  const vol = row.volume24hUsd ?? 0;
  const mcap = row.marketCapUsd ?? 0;
  const pct = row.priceChange24hPct;
  const holders = row.holders ?? 0;

  const move = Math.abs(typeof pct === "number" && Number.isFinite(pct) ? pct : 0);
  const volL = Math.log1p(Math.max(0, vol));
  const mcapL = Math.log1p(Math.max(0, mcap));
  const hL = Math.log1p(Math.max(0, holders));

  let score = volL * 100 + mcapL * 12 + hL * 25 + (move / 100) * volL * 40;

  if (vol <= 0 && mcap > 0) {
    score = mcapL * 22 + hL * 18 + move * 1.5;
  }

  return score;
}
