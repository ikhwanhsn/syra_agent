/** Bitget Vibe Trader hackathon sessions; runs link via bitgetVibeSessionId. */
export const EXPERIMENT_SUITE_BITGET_VIBE = "bitget_vibe";

/** BTC onchain quant lab — spot cbBTC via Jupiter (paper sim + real). */
export const EXPERIMENT_SUITE_BTC_ONCHAIN = "btc_onchain";

export const BTC_QUANT_TOKEN = "bitcoin";
export const BTC_QUANT_STATIC_STRATEGY_COUNT = 15;
export const BTC_QUANT_MAX_CONCURRENT_POSITIONS = 1;

/** cbBTC (Coinbase Wrapped BTC) on Solana mainnet — 8 decimals. */
export const CBBTC_MINT = "cbbtcf3aa214zXHbiAZQwf4122FBYbraNdFqgw4iMij";
export const CBBTC_DECIMALS = 8;
export const BTC_QUANT_QUOTE_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const BTC_QUANT_QUOTE_DECIMALS = 6;

export const BTC_QUANT_EXPERIMENT_DEFAULTS = Object.freeze({
  maxConcurrentPositions: BTC_QUANT_MAX_CONCURRENT_POSITIONS,
  maxRunAgeHours: 72,
  winThresholdPct: 0.5,
});

/**
 * BTC quant strategy roster — each agent trades spot-long cbBTC signals from onchain Solana DEX data,
 * executed as cbBTC via Jupiter when real mode is enabled.
 *
 * @typedef {object} BtcQuantStrategy
 * @property {number} id
 * @property {string} name
 * @property {string} bar
 * @property {string} dataSource
 * @property {object} signalGate
 * @property {object} [signalWeights]
 * @property {object} exit
 * @property {string} [notes]
 */

/** @type {readonly BtcQuantStrategy[]} */
export const BTC_QUANT_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: "Momentum RSI Breakout",
    bar: "1h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [
        { field: "rsi", op: "gte", value: 45 },
        { field: "momentumClearSignal", op: "eq", value: "BUY" },
      ],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 48, trailingTriggerPct: 2 },
    notes: "Trend-following with RSI confirmation on 1h Solana DEX candles.",
  },
  {
    id: 1,
    name: "Mean Reversion Dip",
    bar: "4h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [
        { field: "rsi", op: "lte", value: 38 },
        { field: "bbPositionPct", op: "lte", value: 25 },
      ],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 24, trailingTriggerPct: 1.5 },
    notes: "Buy oversold dips on 4h cbBTC/USDC with Bollinger support.",
  },
  {
    id: 2,
    name: "ADX Trend Rider",
    bar: "1h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [
        { field: "clearSignal", op: "eq", value: "BUY" },
        { field: "adxValue", op: "gte", value: 22 },
      ],
      any: [{ field: "trendClearSignal", op: "eq", value: "BUY" }],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 36, trailingTriggerPct: 2.5 },
    notes: "Strong-trend entries when ADX confirms directional move.",
  },
  {
    id: 3,
    name: "MACD Histogram Cross",
    bar: "1h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [{ field: "macd_histogram", op: "gt", value: 0 }],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 48, trailingTriggerPct: 2 },
    notes: "1h MACD histogram positive on BUY signal (onchain OHLCV).",
  },
  {
    id: 4,
    name: "Multi-TF Confluence",
    bar: "4h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [
        { field: "clearSignal", op: "eq", value: "BUY" },
        { field: "trendClearSignal", op: "eq", value: "BUY" },
        { field: "momentumClearSignal", op: "eq", value: "BUY" },
      ],
      minPasses: 0,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 18, trailingTriggerPct: 3 },
    notes: "High-conviction when trend + momentum align on 4h.",
  },
  {
    id: 5,
    name: "VWAP Reclaim",
    bar: "1h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [
        { field: "price_above_vwap", op: "eq", value: true },
        { field: "rsi", op: "gte", value: 50 },
      ],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 36, trailingTriggerPct: 2 },
    notes: "Coinbase 1h — price reclaiming VWAP with momentum (onchain proxy).",
  },
  {
    id: 6,
    name: "Low Volatility Squeeze",
    bar: "4h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [
        { field: "bbWidthPct", op: "lte", value: 4 },
        { field: "atrPercent", op: "lte", value: 2.5 },
      ],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 30, trailingTriggerPct: 2 },
    notes: "Breakout from compression — tight Bollinger + low ATR.",
  },
  {
    id: 7,
    name: "MFI Volume Pressure",
    bar: "1h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [
        { field: "mfiValue", op: "gte", value: 55 },
        { field: "mfiSignal", op: "eq", value: "BUY" },
      ],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 48, trailingTriggerPct: 2 },
    notes: "Money Flow Index confirms buying pressure on 1h DEX feed.",
  },
  {
    id: 8,
    name: "EMA Golden Cross",
    bar: "4h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [{ field: "ema12_above_ema26", op: "eq", value: true }],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 24, trailingTriggerPct: 2.5 },
    notes: "EMA12 above EMA26 on 4h with engine BUY signal.",
  },
  {
    id: 9,
    name: "Support Bounce",
    bar: "1h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [
        { field: "near_support", op: "eq", value: true },
        { field: "rsi", op: "lte", value: 42 },
      ],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 36, trailingTriggerPct: 1.8 },
    notes: "Bounce off support zone on 1h onchain candles.",
  },
  {
    id: 10,
    name: "Bybit Momentum Scout",
    bar: "1h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [{ field: "priceChange24hPct", op: "gte", value: 1 }],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 48, trailingTriggerPct: 2 },
    notes: "Positive 24h momentum filter on onchain cbBTC feed.",
  },
  {
    id: 11,
    name: "Conservative High Confidence",
    bar: "4h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [
        { field: "clearSignal", op: "eq", value: "BUY" },
        { field: "confidence", op: "eq", value: "HIGH" },
      ],
      minPasses: 0,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 20, trailingTriggerPct: 2 },
    notes: "Only HIGH-confidence engine signals on 4h.",
  },
  {
    id: 12,
    name: "Bitget Fast Scalp",
    bar: "15m",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [
        { field: "rsi", op: "gte", value: 40 },
        { field: "rsi", op: "lte", value: 65 },
      ],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 96, trailingTriggerPct: 1 },
    notes: "Shorter timeframe scalp on 15m Solana DEX candles.",
  },
  {
    id: 13,
    name: "Resistance Breakout",
    bar: "1h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [{ field: "near_resistance_break", op: "eq", value: true }],
      minPasses: 1,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 42, trailingTriggerPct: 2.5 },
    notes: "Break above resistance on 1h cbBTC/USDC.",
  },
  {
    id: 14,
    name: "Balanced Quant Core",
    bar: "1h",
    dataSource: "onchain_birdeye",
    signalGate: {
      all: [{ field: "clearSignal", op: "eq", value: "BUY" }],
      any: [
        { field: "rsi", op: "gte", value: 35 },
        { field: "rsi", op: "lte", value: 68 },
        { field: "trendClearSignal", op: "eq", value: "BUY" },
      ],
      minPasses: 2,
    },
    exit: { tpFromSignal: true, slFromSignal: true, maxBars: 48, trailingTriggerPct: 2 },
    notes: "Balanced multi-filter baseline agent for cohort benchmarking.",
  },
]);

/**
 * @param {number} id
 * @returns {BtcQuantStrategy | null}
 */
export function resolveBtcQuantStrategyById(id) {
  const n = Number(id);
  if (!Number.isInteger(n)) return null;
  return BTC_QUANT_STRATEGIES.find((s) => s.id === n) ?? null;
}
