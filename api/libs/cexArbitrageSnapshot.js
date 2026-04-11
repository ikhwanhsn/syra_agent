/**
 * Cross-venue spot price snapshot for arbitrage experiment UI.
 * Uses each CEX public WebSocket ticker streams (push), not OHLC candle close.
 */
import { fetchAllCexRealtimePrices } from "./cexRealtimeTicker.js";

/**
 * Remove USDT venue ticks that disagree wildly with peers (wrong pair, stale echo, etc.).
 * @param {{ ok: true, source: string, price: number }[]} rows
 * @param {number} maxRatio max distance from median (e.g. 12 → keep within [median/12, median*12])
 */
function filterUsdtRowsByMedianConsensus(rows, maxRatio = 12) {
  if (rows.length < 3) return rows;
  const sorted = rows.map((r) => r.price).filter((p) => Number.isFinite(p) && p > 0).sort((a, b) => a - b);
  if (sorted.length < 3) return rows;
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  if (!Number.isFinite(median) || median <= 0) return rows;
  const lo = median / maxRatio;
  const hi = median * maxRatio;
  const filtered = rows.filter((r) => r.price >= lo && r.price <= hi);
  return filtered.length >= 2 ? filtered : rows;
}

/**
 * @param {{ token?: string; bar?: string; limit?: number }} input
 */
export async function fetchCexArbitrageSnapshot(input = {}) {
  const token = String(input.token ?? "bitcoin").trim().toLowerCase() || "bitcoin";

  const { venues, fetchedAt, priceSource } = await fetchAllCexRealtimePrices(token);

  const usdtRows = venues.filter(
    (v) => v.ok === true && v.quoteUnit === "USDT" && typeof v.price === "number",
  );
  let buyAt = null;
  let sellAt = null;
  let grossSpreadPct = null;

  if (usdtRows.length >= 2) {
    const pool = filterUsdtRowsByMedianConsensus(usdtRows, 12);
    const minP = Math.min(...pool.map((r) => r.price));
    const maxP = Math.max(...pool.map((r) => r.price));
    // Same asset across majors should not differ by orders of magnitude; skip absurd spreads.
    if (minP > 0 && maxP / minP <= 50) {
      buyAt = pool.reduce((a, b) => (a.price < b.price ? a : b));
      sellAt = pool.reduce((a, b) => (a.price > b.price ? a : b));
      if (buyAt && sellAt && buyAt.source !== sellAt.source && buyAt.price > 0) {
        grossSpreadPct = ((sellAt.price - buyAt.price) / buyAt.price) * 100;
      }
    }
  }

  return {
    token,
    priceSource,
    fetchedAt,
    venues,
    strategy: {
      scope: "USDT spot pairs only (same-base cross-venue)",
      buyAt,
      sellAt,
      grossSpreadPct,
      note:
        "Prices are the latest push from each venue’s public WebSocket ticker channel (or Crypto.com REST if WS fails). Venues that disagree strongly with the median USDT print are ignored for gross spread (reduces wrong-pair/stale-ticker artifacts). Gross spread only — before fees, slippage, withdrawal, and latency. Not financial advice; many gaps are not actionable.",
    },
  };
}
