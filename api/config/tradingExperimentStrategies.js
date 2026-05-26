/**
 * Binance spot OHLC + CryptoAnalysisEngine variants for trading experiment lab.
 * Primary suite = 15 algorithm-style agents; secondary = 15 scalper agents (multi_resource list empty).
 *
 * lookAheadBars: max forward candles to check for TP/SL after signal anchor.
 *
 * experimentGate (optional): minConfidence, minRiskReward, minAdx, requireTrendMomentumAlign.
 * indicatorFilter (optional): extra BUY filters — rsiBand, macd, emaStack, priceVsMa, adxDiStack.
 */
import { TRADING_EXPERIMENT_STRATEGIES_MULTI_TOKEN } from "./tradingExperimentMultiToken.js";

export { TRADING_EXPERIMENT_STRATEGIES_MULTI_TOKEN } from "./tradingExperimentMultiToken.js";

export const EXPERIMENT_SUITE_PRIMARY = "primary";
export const EXPERIMENT_SUITE_SECONDARY = "secondary";
/** Binance-only multi-timeframe BTC (1m–1d); same engine as primary; isolated ledger. */
export const EXPERIMENT_SUITE_MULTI_RESOURCE = "multi_resource";
/** Wallet-owned custom strategies; isolated ledger + runs reference {@link UserCustomStrategy}. */
export const EXPERIMENT_SUITE_USER_CUSTOM = "user_custom";
/** Scans many tokens per cycle and opens the best spot-long setup (isolated ledger). */
export const EXPERIMENT_SUITE_MULTI_TOKEN = "multi_token";

/** High-conviction trend-following templates (target ≥20% annual via 2.5R wins + 20% equity sizing). */
const TREND_HIGH = Object.freeze({
  experimentGate: {
    minConfidence: "HIGH",
    minRiskReward: 2,
    minAdx: 22,
    requireTrendMomentumAlign: true,
  },
  indicatorFilter: { adxDiStack: "BULL", emaStack: "GOLDEN" },
});

const TREND_MED = Object.freeze({
  experimentGate: {
    minConfidence: "MEDIUM",
    minRiskReward: 2,
    minAdx: 18,
    requireTrendMomentumAlign: true,
  },
  indicatorFilter: { macd: "BULL_HIST" },
});

export const TRADING_EXPERIMENT_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: "BTC trend rider 4h",
    token: "bitcoin",
    bar: "4h",
    limit: 220,
    lookAheadBars: 42,
    ...TREND_HIGH,
  },
  {
    id: 1,
    name: "ETH trend rider 4h",
    token: "ethereum",
    bar: "4h",
    limit: 200,
    lookAheadBars: 40,
    ...TREND_HIGH,
  },
  {
    id: 2,
    name: "SOL swing 1h",
    token: "solana",
    bar: "1h",
    limit: 240,
    lookAheadBars: 56,
    ...TREND_MED,
  },
  {
    id: 3,
    name: "BTC momentum 1h",
    token: "bitcoin",
    bar: "1h",
    limit: 220,
    lookAheadBars: 52,
    experimentGate: { minConfidence: "HIGH", minRiskReward: 2, requireTrendMomentumAlign: true },
    indicatorFilter: { rsiBand: { min: 45, max: 68 }, macd: "BULL_HIST" },
  },
  {
    id: 4,
    name: "ETH balanced 2h",
    token: "ethereum",
    bar: "2h",
    limit: 200,
    lookAheadBars: 44,
    ...TREND_MED,
  },
  {
    id: 5,
    name: "BNB core 1h",
    token: "bnb",
    bar: "1h",
    limit: 200,
    lookAheadBars: 50,
    experimentGate: { minConfidence: "MEDIUM", minRiskReward: 2, minAdx: 20 },
    indicatorFilter: { priceVsMa: "ABOVE_SMA20" },
  },
  {
    id: 6,
    name: "BTC sniper 30m",
    token: "bitcoin",
    bar: "30m",
    limit: 280,
    lookAheadBars: 90,
    experimentGate: { minConfidence: "HIGH", minRiskReward: 2.2, minAdx: 24 },
    indicatorFilter: { adxDiStack: "BULL" },
  },
  {
    id: 7,
    name: "SOL scout 4h",
    token: "solana",
    bar: "4h",
    limit: 200,
    lookAheadBars: 32,
    ...TREND_HIGH,
  },
  {
    id: 8,
    name: "XRP swing 1h",
    token: "xrp",
    bar: "1h",
    limit: 200,
    lookAheadBars: 48,
    ...TREND_MED,
  },
  {
    id: 9,
    name: "LINK trend 4h",
    token: "chainlink",
    bar: "4h",
    limit: 200,
    lookAheadBars: 36,
    ...TREND_MED,
  },
  {
    id: 10,
    name: "BTC deep 1h",
    token: "bitcoin",
    bar: "1h",
    limit: 300,
    lookAheadBars: 60,
    experimentGate: { minConfidence: "HIGH", minRiskReward: 2, requireTrendMomentumAlign: true },
  },
  {
    id: 11,
    name: "ETH sniper 30m",
    token: "ethereum",
    bar: "30m",
    limit: 260,
    lookAheadBars: 84,
    experimentGate: { minConfidence: "HIGH", minRiskReward: 2, minAdx: 22 },
    indicatorFilter: { macd: "BULL_CROSS" },
  },
  {
    id: 12,
    name: "AVAX swing 2h",
    token: "avalanche",
    bar: "2h",
    limit: 200,
    lookAheadBars: 42,
    ...TREND_MED,
  },
  {
    id: 13,
    name: "BTC daily macro",
    token: "bitcoin",
    bar: "1d",
    limit: 180,
    lookAheadBars: 28,
    experimentGate: { minConfidence: "MEDIUM", minRiskReward: 2, minAdx: 16 },
    indicatorFilter: { emaStack: "GOLDEN" },
  },
  {
    id: 14,
    name: "ETH+SOL dual 1h",
    token: "ethereum",
    bar: "1h",
    limit: 240,
    lookAheadBars: 54,
    experimentGate: { minConfidence: "HIGH", minRiskReward: 2.5, requireTrendMomentumAlign: true },
    indicatorFilter: { adxValueBand: { min: 20 }, macd: "BULL_HIST" },
  },
]);

/** Scalper lane: higher timeframe bias + quality gates (fewer, higher-R trades). */
export const TRADING_EXPERIMENT_STRATEGIES_SECONDARY = Object.freeze([
  {
    id: 0,
    name: "Scalp BTC 15m trend",
    token: "bitcoin",
    bar: "15m",
    limit: 280,
    lookAheadBars: 120,
    experimentGate: { minConfidence: "MEDIUM", minRiskReward: 2, minAdx: 20 },
    indicatorFilter: { macd: "BULL_HIST" },
  },
  {
    id: 1,
    name: "Scalp ETH 15m trend",
    token: "ethereum",
    bar: "15m",
    limit: 280,
    lookAheadBars: 120,
    experimentGate: { minConfidence: "MEDIUM", minRiskReward: 2, minAdx: 20 },
    indicatorFilter: { adxDiStack: "BULL" },
  },
  {
    id: 2,
    name: "Scalp SOL 15m",
    token: "solana",
    bar: "15m",
    limit: 260,
    lookAheadBars: 140,
    experimentGate: { minConfidence: "HIGH", minRiskReward: 2.2 },
    indicatorFilter: { rsiBand: { min: 42, max: 62 }, macd: "BULL_HIST" },
  },
  {
    id: 3,
    name: "Scalp BNB 5m",
    token: "bnb",
    bar: "5m",
    limit: 300,
    lookAheadBars: 130,
    experimentGate: { minConfidence: "MEDIUM", minRiskReward: 2 },
  },
  {
    id: 4,
    name: "Scalp XRP 15m",
    token: "xrp",
    bar: "15m",
    limit: 240,
    lookAheadBars: 110,
    experimentGate: { minConfidence: "MEDIUM", minRiskReward: 2, minAdx: 18 },
  },
  {
    id: 5,
    name: "Scalp BTC 30m",
    token: "bitcoin",
    bar: "30m",
    limit: 260,
    lookAheadBars: 96,
    experimentGate: { minConfidence: "HIGH", minRiskReward: 2, requireTrendMomentumAlign: true },
  },
  {
    id: 6,
    name: "Scalp ETH 30m",
    token: "ethereum",
    bar: "30m",
    limit: 260,
    lookAheadBars: 96,
    experimentGate: { minConfidence: "HIGH", minRiskReward: 2 },
    indicatorFilter: { macd: "BULL_CROSS" },
  },
  {
    id: 7,
    name: "Scalp DOGE 15m",
    token: "dogecoin",
    bar: "15m",
    limit: 260,
    lookAheadBars: 150,
    experimentGate: { minConfidence: "MEDIUM", minRiskReward: 2 },
    indicatorFilter: { rsiBand: { max: 48 }, macd: "BULL_HIST" },
  },
  {
    id: 8,
    name: "Scalp SOL 5m",
    token: "solana",
    bar: "5m",
    limit: 300,
    lookAheadBars: 140,
    experimentGate: { minConfidence: "MEDIUM", minRiskReward: 2.2, minAdx: 22 },
  },
  {
    id: 9,
    name: "Scalp ADA 15m",
    token: "cardano",
    bar: "15m",
    limit: 240,
    lookAheadBars: 128,
    experimentGate: { minConfidence: "MEDIUM", minRiskReward: 2 },
  },
  {
    id: 10,
    name: "Scalp LINK 15m momo",
    token: "chainlink",
    bar: "15m",
    limit: 240,
    lookAheadBars: 100,
    experimentGate: { minConfidence: "HIGH", minRiskReward: 2 },
    indicatorFilter: { macd: "BULL_HIST", adxDiStack: "BULL" },
  },
  {
    id: 11,
    name: "Scalp AVAX 30m",
    token: "avalanche",
    bar: "30m",
    limit: 240,
    lookAheadBars: 88,
    experimentGate: { minConfidence: "MEDIUM", minRiskReward: 2, minAdx: 20 },
  },
  {
    id: 12,
    name: "Scalp BTC 5m sniper",
    token: "bitcoin",
    bar: "5m",
    limit: 320,
    lookAheadBars: 160,
    experimentGate: { minConfidence: "HIGH", minRiskReward: 2.5, minAdx: 24 },
    indicatorFilter: { macd: "BULL_HIST" },
  },
  {
    id: 13,
    name: "Scalp ETH 15m momo",
    token: "ethereum",
    bar: "15m",
    limit: 220,
    lookAheadBars: 88,
    experimentGate: { minConfidence: "HIGH", minRiskReward: 2, requireTrendMomentumAlign: true },
    indicatorFilter: { rsiBand: { max: 42 }, macd: "BULL_HIST" },
  },
  {
    id: 14,
    name: "Scalp BNB 15m",
    token: "bnb",
    bar: "15m",
    limit: 240,
    lookAheadBars: 96,
    experimentGate: { minConfidence: "MEDIUM", minRiskReward: 2, minAdx: 18 },
    indicatorFilter: { emaStack: "GOLDEN" },
  },
]);

/** Multi-timeframe suite disabled — public lab is 15 algorithm + 15 scalper agents only. */
export const TRADING_EXPERIMENT_STRATEGIES_MULTI_RESOURCE = Object.freeze([]);

/**
 * @param {string | undefined | null} input
 * @returns {typeof EXPERIMENT_SUITE_PRIMARY | typeof EXPERIMENT_SUITE_SECONDARY | typeof EXPERIMENT_SUITE_MULTI_RESOURCE | typeof EXPERIMENT_SUITE_MULTI_TOKEN}
 */
export function normalizeSuite(input) {
  const x = String(input ?? EXPERIMENT_SUITE_PRIMARY)
    .trim()
    .toLowerCase();
  if (
    x === EXPERIMENT_SUITE_MULTI_TOKEN ||
    x === "multi-token" ||
    x === "multitoken" ||
    x === "opportunity" ||
    x === "opportunities" ||
    x === "scout"
  ) {
    return EXPERIMENT_SUITE_MULTI_TOKEN;
  }
  if (
    x === EXPERIMENT_SUITE_MULTI_RESOURCE ||
    x === "3" ||
    x === "c" ||
    x === "multi" ||
    x === "multiresource" ||
    x === "all_cex" ||
    x === "all-resources" ||
    x === "resources"
  ) {
    return EXPERIMENT_SUITE_MULTI_RESOURCE;
  }
  if (
    x === EXPERIMENT_SUITE_SECONDARY ||
    x === "2" ||
    x === "b" ||
    x === "experiment-2" ||
    x === "second"
  ) {
    return EXPERIMENT_SUITE_SECONDARY;
  }
  return EXPERIMENT_SUITE_PRIMARY;
}

/**
 * @param {string | undefined | null} suite
 */
export function getStrategiesForSuite(suite) {
  const s = normalizeSuite(suite);
  if (s === EXPERIMENT_SUITE_SECONDARY) return TRADING_EXPERIMENT_STRATEGIES_SECONDARY;
  if (s === EXPERIMENT_SUITE_MULTI_RESOURCE) return TRADING_EXPERIMENT_STRATEGIES_MULTI_RESOURCE;
  if (s === EXPERIMENT_SUITE_MULTI_TOKEN) return TRADING_EXPERIMENT_STRATEGIES_MULTI_TOKEN;
  return TRADING_EXPERIMENT_STRATEGIES;
}

export const EXPERIMENT_SUITES_META = Object.freeze([
  {
    id: EXPERIMENT_SUITE_PRIMARY,
    title: "Algorithm agents",
    description:
      "Trend-following agents (4h/1h) with min 2:1 R:R, ADX + momentum alignment, and ~20% equity per trade. Agents below $900 equity (–10%) are culled daily; 15 new agents spawn per day (max 1000 per ledger).",
  },
  {
    id: EXPERIMENT_SUITE_SECONDARY,
    title: "Scalper agents",
    description:
      "15m–30m scalpers with quality gates (min 2:1 R:R, ADX filters). Isolated ledger; same –10% equity cull and daily spawn rules as the primary roster.",
  },
  {
    id: EXPERIMENT_SUITE_MULTI_TOKEN,
    title: "Opportunity hunters",
    description:
      "Multi-token scouts with composite scoring, min 2:1 R:R, and dynamic position sizing. Agents below $900 equity are culled daily; 15 new scouts spawn per day (max 1000 per ledger).",
  },
]);
