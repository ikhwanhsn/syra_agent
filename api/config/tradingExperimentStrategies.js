/**
 * Binance spot OHLC + CryptoAnalysisEngine variants for trading experiment lab.
 * Primary suite = 15 algorithm-style agents; secondary = 15 scalper agents (multi_resource list empty).
 *
 * lookAheadBars: max forward candles to check for TP/SL after signal anchor.
 *
 * experimentGate (optional): only persist BUY when engine confidence meets minConfidence
 * (LOW ≤ MEDIUM ≤ HIGH). Omit for legacy “any BUY with valid levels” behavior.
 *
 * indicatorFilter (optional): extra BUY filters using engine technicalIndicators — rsiBand,
 * macd mode, emaStack (golden/death cross), priceVsMa vs SMA20/SMA50.
 */
export const EXPERIMENT_SUITE_PRIMARY = "primary";
export const EXPERIMENT_SUITE_SECONDARY = "secondary";
/** Binance-only multi-timeframe BTC (1m–1d); same engine as primary; isolated ledger. */
export const EXPERIMENT_SUITE_MULTI_RESOURCE = "multi_resource";
/** Wallet-owned custom strategies; isolated ledger + runs reference {@link UserCustomStrategy}. */
export const EXPERIMENT_SUITE_USER_CUSTOM = "user_custom";

export const TRADING_EXPERIMENT_STRATEGIES = Object.freeze([
  { id: 0, name: "BTC swing 1h", token: "bitcoin", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 1, name: "BTC trend 4h", token: "bitcoin", bar: "4h", limit: 200, lookAheadBars: 24 },
  { id: 2, name: "BTC scalp 15m", token: "bitcoin", bar: "15m", limit: 200, lookAheadBars: 96 },
  { id: 3, name: "ETH swing 1h", token: "ethereum", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 4, name: "SOL swing 1h", token: "solana", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 5, name: "BTC compact 1h", token: "bitcoin", bar: "1h", limit: 100, lookAheadBars: 48 },
  { id: 6, name: "BTC deep 1h", token: "bitcoin", bar: "1h", limit: 300, lookAheadBars: 48 },
  { id: 7, name: "BTC 30m", token: "bitcoin", bar: "30m", limit: 200, lookAheadBars: 72 },
  { id: 8, name: "ETH 4h", token: "ethereum", bar: "4h", limit: 200, lookAheadBars: 24 },
  { id: 9, name: "SOL 4h", token: "solana", bar: "4h", limit: 200, lookAheadBars: 24 },
  // Smart batch v2: distinct assets × bars × windows × confidence gates (compare win rates).
  {
    id: 10,
    name: "BTC sniper 1h",
    token: "bitcoin",
    bar: "1h",
    limit: 220,
    lookAheadBars: 36,
    experimentGate: { minConfidence: "HIGH" },
  },
  {
    id: 11,
    name: "ETH balanced 4h",
    token: "ethereum",
    bar: "4h",
    limit: 200,
    lookAheadBars: 48,
    experimentGate: { minConfidence: "MEDIUM" },
  },
  {
    id: 12,
    name: "SOL scout 15m",
    token: "solana",
    bar: "15m",
    limit: 240,
    lookAheadBars: 160,
    experimentGate: { minConfidence: "LOW" },
  },
  {
    id: 13,
    name: "BTC deep 30m",
    token: "bitcoin",
    bar: "30m",
    limit: 280,
    lookAheadBars: 80,
    experimentGate: { minConfidence: "HIGH" },
  },
  {
    id: 14,
    name: "BNB core 1h",
    token: "bnb",
    bar: "1h",
    limit: 200,
    lookAheadBars: 52,
    experimentGate: { minConfidence: "MEDIUM" },
  },
]);

/** Scalper lane: 15 short-timeframe agents (1m–15m); isolated ledger; daily evolution culls –10% equity agents and spawns new ones. */
export const TRADING_EXPERIMENT_STRATEGIES_SECONDARY = Object.freeze([
  {
    id: 0,
    name: "Scalp BTC 1m",
    token: "bitcoin",
    bar: "1m",
    limit: 360,
    lookAheadBars: 180,
    experimentGate: { minConfidence: "LOW" },
  },
  {
    id: 1,
    name: "Scalp ETH 1m",
    token: "ethereum",
    bar: "1m",
    limit: 360,
    lookAheadBars: 180,
    experimentGate: { minConfidence: "LOW" },
  },
  {
    id: 2,
    name: "Scalp SOL 1m",
    token: "solana",
    bar: "1m",
    limit: 360,
    lookAheadBars: 200,
    experimentGate: { minConfidence: "LOW" },
  },
  {
    id: 3,
    name: "Scalp BNB 3m",
    token: "bnb",
    bar: "3m",
    limit: 300,
    lookAheadBars: 100,
    experimentGate: { minConfidence: "MEDIUM" },
  },
  {
    id: 4,
    name: "Scalp XRP 3m",
    token: "xrp",
    bar: "3m",
    limit: 300,
    lookAheadBars: 110,
    experimentGate: { minConfidence: "LOW" },
  },
  { id: 5, name: "Scalp BTC 5m", token: "bitcoin", bar: "5m", limit: 280, lookAheadBars: 120 },
  {
    id: 6,
    name: "Scalp ETH 5m",
    token: "ethereum",
    bar: "5m",
    limit: 280,
    lookAheadBars: 120,
    experimentGate: { minConfidence: "LOW" },
  },
  {
    id: 7,
    name: "Scalp DOGE 5m",
    token: "dogecoin",
    bar: "5m",
    limit: 280,
    lookAheadBars: 144,
    experimentGate: { minConfidence: "LOW" },
  },
  { id: 8, name: "Scalp SOL 5m", token: "solana", bar: "5m", limit: 280, lookAheadBars: 120 },
  {
    id: 9,
    name: "Scalp ADA 5m",
    token: "cardano",
    bar: "5m",
    limit: 280,
    lookAheadBars: 128,
    experimentGate: { minConfidence: "LOW" },
  },
  {
    id: 10,
    name: "Scalp LINK 15m",
    token: "chainlink",
    bar: "15m",
    limit: 240,
    lookAheadBars: 96,
    experimentGate: { minConfidence: "LOW" },
  },
  {
    id: 11,
    name: "Scalp AVAX 15m",
    token: "avalanche",
    bar: "15m",
    limit: 240,
    lookAheadBars: 88,
    experimentGate: { minConfidence: "MEDIUM" },
  },
  {
    id: 12,
    name: "Scalp SHIB 15m",
    token: "shib",
    bar: "15m",
    limit: 260,
    lookAheadBars: 160,
    experimentGate: { minConfidence: "LOW" },
  },
  {
    id: 13,
    name: "Scalp BTC 15m momo",
    token: "bitcoin",
    bar: "15m",
    limit: 220,
    lookAheadBars: 72,
    indicatorFilter: { macd: "BULL_HIST" },
  },
  {
    id: 14,
    name: "Scalp ETH 15m momo",
    token: "ethereum",
    bar: "15m",
    limit: 220,
    lookAheadBars: 72,
    indicatorFilter: { rsiBand: { max: 42 }, macd: "BULL_HIST" },
  },
]);

/** Multi-timeframe suite disabled — public lab is 15 algorithm + 15 scalper agents only. */
export const TRADING_EXPERIMENT_STRATEGIES_MULTI_RESOURCE = Object.freeze([]);

/**
 * @param {string | undefined | null} input
 * @returns {typeof EXPERIMENT_SUITE_PRIMARY | typeof EXPERIMENT_SUITE_SECONDARY | typeof EXPERIMENT_SUITE_MULTI_RESOURCE}
 */
export function normalizeSuite(input) {
  const x = String(input ?? EXPERIMENT_SUITE_PRIMARY)
    .trim()
    .toLowerCase();
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
  return TRADING_EXPERIMENT_STRATEGIES;
}

export const EXPERIMENT_SUITES_META = Object.freeze([
  {
    id: EXPERIMENT_SUITE_PRIMARY,
    title: "Algorithm agents",
    description:
      "Binance spot agents: 15 core slots (ids 0–14) plus up to 985 spawned variants. Agents below $900 equity (–10%) are culled daily; 15 new agents spawn per day (max 1000 per ledger).",
  },
  {
    id: EXPERIMENT_SUITE_SECONDARY,
    title: "Scalper agents",
    description:
      "Short-bar agents (1m–15m) for higher trade frequency. Isolated ledger; same –10% equity cull and daily spawn rules as the primary roster.",
  },
]);
