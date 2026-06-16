/**
 * Smoke test for indicator engine (no HTTP server).
 */
import { buildIndicatorResponse, parseIndicatorRequest, runIndicators } from "../libs/indicators/indicatorEngine.js";
import { listIndicatorIds } from "../libs/indicators/registry.js";
import { normalizeEngineRows } from "../libs/indicators/candleSource.js";

const ids = listIndicatorIds();
console.log("indicator count:", ids.length);
if (ids.length < 25) throw new Error(`Expected >=25 indicators, got ${ids.length}`);

// Synthetic candles (no network)
const syntheticRows = Array.from({ length: 120 }, (_, i) => {
  const base = 100 + Math.sin(i / 8) * 5 + i * 0.2;
  return [Date.now() - (120 - i) * 3_600_000, base, base + 2, base - 2, base + 0.5, 1000 + i * 10];
});
const series = normalizeEngineRows(syntheticRows);

const rsiOnly = runIndicators(series, [{ id: "rsi", params: { period: 14 } }], { withSeries: false });
console.log("synthetic RSI:", rsiOnly.rsi?.latest, rsiOnly.rsi?.signal);

const combo = runIndicators(
  series,
  [
    { id: "rsi", params: { period: 14 } },
    { id: "macd", params: {} },
    { id: "bollinger", params: {} },
  ],
  { withSeries: true },
);
console.log("combo keys:", Object.keys(combo));
console.log("RSI series points:", combo.rsi?.series?.length);
console.log("MACD latest:", combo.macd?.latest);

const parsed = parseIndicatorRequest({
  method: "GET",
  query: { symbol: "BTCUSDT", indicators: "rsi,macd", "rsi.period": "21" },
});
if (parsed.indicators.length !== 2) throw new Error("parse failed");
if (Number(parsed.indicators[0].params.period) !== 21) throw new Error("dotted param parse failed");

try {
  const live = await buildIndicatorResponse({
    symbol: "BTCUSDT",
    source: "binance",
    interval: "1h",
    limit: 100,
    series: false,
    indicators: [{ id: "rsi", params: { period: 14 } }],
  });
  console.log("live RSI:", live.indicators.rsi?.latest);
} catch (e) {
  console.log("live fetch skipped (network):", e?.message || e);
}

console.log("OK");
