/**
 * Cross-venue spot price snapshot for arbitrage experiment UI.
 * Uses each CEX public WebSocket ticker streams (push), not OHLC candle close.
 */
import { fetchAllCexRealtimePrices } from "./cexRealtimeTicker.js";

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
    buyAt = usdtRows.reduce((a, b) => (a.price < b.price ? a : b));
    sellAt = usdtRows.reduce((a, b) => (a.price > b.price ? a : b));
    if (buyAt && sellAt && buyAt.source !== sellAt.source && buyAt.price > 0) {
      grossSpreadPct = ((sellAt.price - buyAt.price) / buyAt.price) * 100;
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
        "Prices are the latest push from each venue’s public WebSocket ticker channel (or Crypto.com REST if WS fails). Gross spread only — before fees, slippage, withdrawal, and latency. Not financial advice; many gaps are not actionable.",
    },
  };
}
