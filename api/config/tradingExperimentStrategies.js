/**
 * Ten Binance spot OHLC + CryptoAnalysisEngine variants for trading experiment lab.
 * Each row is one "agent"; cron/run-cycle evaluates all.
 *
 * lookAheadBars: max forward candles to check for TP/SL after signal anchor.
 */
export const EXPERIMENT_SUITE_PRIMARY = "primary";
export const EXPERIMENT_SUITE_SECONDARY = "secondary";
/** All /signal CEX sources × multiple bars; per-venue OHLC + same engine; isolated ledger. */
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
]);

/** Second isolated experiment: own win rate ledger; same Binance + engine + hourly/10s mechanics. */
export const TRADING_EXPERIMENT_STRATEGIES_SECONDARY = Object.freeze([
  { id: 0, name: "BTC tight 1h", token: "bitcoin", bar: "1h", limit: 150, lookAheadBars: 36 },
  { id: 1, name: "ETH 15m pulse", token: "ethereum", bar: "15m", limit: 200, lookAheadBars: 120 },
  { id: 2, name: "SOL 30m", token: "solana", bar: "30m", limit: 200, lookAheadBars: 72 },
  { id: 3, name: "XRP 1h", token: "xrp", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 4, name: "DOGE 1h", token: "dogecoin", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 5, name: "BTC 4h swing", token: "bitcoin", bar: "4h", limit: 200, lookAheadBars: 18 },
  { id: 6, name: "ETH 1h deep", token: "ethereum", bar: "1h", limit: 280, lookAheadBars: 48 },
  { id: 7, name: "ADA 1h", token: "cardano", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 8, name: "LINK 1h", token: "chainlink", bar: "1h", limit: 200, lookAheadBars: 48 },
  { id: 9, name: "AVAX 1h", token: "avalanche", bar: "1h", limit: 200, lookAheadBars: 48 },
]);

const MULTI_RESOURCE_CEX_SOURCES = Object.freeze([
  "binance",
  "coinbase",
  "okx",
  "bybit",
  "kraken",
  "bitget",
  "kucoin",
  "upbit",
  "cryptocom",
]);

const MULTI_RESOURCE_BARS = Object.freeze(["1m", "15m", "1h", "4h", "1d"]);

function buildMultiResourceStrategies() {
  /** @type {object[]} */
  const out = [];
  let id = 0;
  for (const source of MULTI_RESOURCE_CEX_SOURCES) {
    for (const bar of MULTI_RESOURCE_BARS) {
      const limit =
        bar === "1m" ? 400 : bar === "15m" ? 320 : bar === "1h" ? 220 : bar === "4h" ? 200 : 180;
      const lookAheadBars =
        bar === "1m"
          ? 720
          : bar === "15m"
            ? 384
            : bar === "1h"
              ? 168
              : bar === "4h"
                ? 120
                : 90;
      out.push({
        id: id++,
        name: `${source} BTC ${bar}`,
        token: "bitcoin",
        bar,
        limit,
        lookAheadBars,
        source,
      });
    }
  }
  return Object.freeze(out);
}

export const TRADING_EXPERIMENT_STRATEGIES_MULTI_RESOURCE = buildMultiResourceStrategies();

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
    title: "Experiment 1 — original",
    description: "BTC/ETH/SOL-focused matrix (default).",
  },
  {
    id: EXPERIMENT_SUITE_SECONDARY,
    title: "Experiment 2 — parallel",
    description: "Separate agents & stats; alts + alternate bars. Same hourly signal + 10s 1m validation.",
  },
  {
    id: EXPERIMENT_SUITE_MULTI_RESOURCE,
    title: "Experiment 3 — all CEX × timeframes",
    description:
      "Every /signal spot source (binance, coinbase, okx, ...) x bars 1m, 15m, 1h, 4h, 1d on BTC. Hourly samples + 10s TP/SL on each venue's 1m data.",
  },
]);
