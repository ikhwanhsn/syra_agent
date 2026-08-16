/**
 * Stocks News Lab strategies: price-first archetypes with news as a filter, not the engine.
 * Universe is whatever xStocks have a live mint; gates skip symbols the feed cannot fill.
 */

export const STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS = Object.freeze({
  momentum_score: 1.5,
  trend_score: 1.35,
  volatility_score: 0.9,
  volume_score: 1.0,
  freshness_score: 0.7,
  event_score: 0.6,
  sentiment_score: 0.4,
  spread_score: 0.8,
});

export const STOCKS_STATIC_STRATEGY_COUNT = 15;
export const STOCKS_EVOLVABLE_MIN_ID = 15;
export const STOCKS_EVOLVABLE_MAX_ID = 97;
export const STOCKS_DAILY_SPAWN_COUNT = 3;
export const STOCKS_MAX_STRATEGIES = 78;

/** Liquid names with catalog mints today. Others join when env mints exist. */
export const STOCKS_CORE_UNIVERSE = Object.freeze(["TSLAx", "SPCXx"]);
export const STOCKS_TECH_UNIVERSE = Object.freeze(["TSLAx", "NVDAx", "SPCXx"]);
export const STOCKS_MEGA_UNIVERSE = Object.freeze(["AAPLx", "SPYx", "TSLAx"]);
export const STOCKS_FULL_UNIVERSE = Object.freeze(["TSLAx", "AAPLx", "NVDAx", "SPYx", "SPCXx"]);

export const STOCKS_EXPERIMENT_DEFAULTS = Object.freeze({
  startingBankUsd: 1000,
  maxConcurrentPositions: 3,
  maxPositionPct: 20,
  minTradeNotionalUsd: 25,
  defaultMaxHoldHours: 36,
});

export const STOCKS_EXPERIMENT_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: "Trend Follow Mega",
    minSentiment: -1,
    eventWeight: 0.4,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 72,
    universeFilter: { symbols: [...STOCKS_MEGA_UNIVERSE] },
    signalGate: {
      all: [
        { field: "momentum_score", op: "gte", value: 0.58 },
        { field: "trend_score", op: "gte", value: 0.54 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      trend_score: 1.8,
      momentum_score: 1.6,
    },
    exit: { stopLossPct: -4, takeProfitPct: 7, atrScale: true },
    notes: "Ride confirmed uptrends on mega-caps. News is not the trigger.",
  },
  {
    id: 1,
    name: "Tech Momentum",
    minSentiment: -1,
    eventWeight: 0.5,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 36,
    universeFilter: { symbols: [...STOCKS_TECH_UNIVERSE] },
    signalGate: {
      all: [{ field: "momentum_score", op: "gte", value: 0.6 }],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      momentum_score: 2.0,
      volume_score: 1.3,
    },
    exit: { stopLossPct: -5, takeProfitPct: 9, atrScale: true },
    notes: "High-beta tech continuation after a real price push.",
  },
  {
    id: 2,
    name: "Breakout Volume",
    minSentiment: -1,
    eventWeight: 0.4,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 24,
    universeFilter: { symbols: [...STOCKS_CORE_UNIVERSE] },
    signalGate: {
      all: [
        { field: "momentum_score", op: "gte", value: 0.62 },
        { field: "volume_score", op: "gte", value: 0.45 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      momentum_score: 1.8,
      volume_score: 1.6,
    },
    exit: { stopLossPct: -4, takeProfitPct: 8, atrScale: true },
    notes: "Breakout only when range expansion and volume confirm.",
  },
  {
    id: 3,
    name: "Mean Reversion Fade",
    minSentiment: -1,
    eventWeight: 0.3,
    momentumConfirm: false,
    allowShort: true,
    sideMode: "fade",
    maxHoldHours: 18,
    universeFilter: { symbols: [...STOCKS_CORE_UNIVERSE] },
    signalGate: {
      any: [
        { field: "momentum_score", op: "lte", value: 0.38 },
        { field: "momentum_score", op: "gte", value: 0.72 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      volatility_score: 1.4,
      momentum_score: 1.2,
    },
    exit: { stopLossPct: -3, takeProfitPct: 5, atrScale: true },
    notes: "Fade stretched moves. Shorts allowed. Tight, vol-scaled exits.",
  },
  {
    id: 4,
    name: "News Confirmed Momentum",
    minSentiment: -1,
    eventWeight: 0.9,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 24,
    universeFilter: { symbols: [...STOCKS_FULL_UNIVERSE] },
    signalGate: {
      all: [
        { field: "momentum_score", op: "gte", value: 0.56 },
        { field: "freshness_score", op: "gte", value: 0.35 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      momentum_score: 1.6,
      freshness_score: 1.2,
      event_score: 1.1,
    },
    exit: { stopLossPct: -4, takeProfitPct: 7, atrScale: true },
    notes: "Headline is a filter on a real price move, never the only reason to buy.",
  },
  {
    id: 5,
    name: "Conservative Index Trend",
    minSentiment: -1,
    eventWeight: 0.3,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 96,
    universeFilter: { symbols: ["SPYx", "AAPLx"] },
    signalGate: {
      all: [
        { field: "trend_score", op: "gte", value: 0.55 },
        { field: "volatility_score", op: "gte", value: 0.4 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      trend_score: 1.7,
      spread_score: 1.3,
    },
    exit: { stopLossPct: -3, takeProfitPct: 5, atrScale: true },
    notes: "Slow trend on the most stable names. Tight risk.",
  },
  {
    id: 6,
    name: "High Conviction Trend",
    minSentiment: -1,
    eventWeight: 0.4,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 48,
    universeFilter: { symbols: [...STOCKS_FULL_UNIVERSE] },
    signalGate: {
      all: [
        { field: "momentum_score", op: "gte", value: 0.64 },
        { field: "trend_score", op: "gte", value: 0.58 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      momentum_score: 1.9,
      trend_score: 1.7,
    },
    exit: { stopLossPct: -4.5, takeProfitPct: 10, atrScale: true },
    notes: "Fewer trades, both momentum and trend must agree.",
  },
  {
    id: 7,
    name: "Volatility Breakout",
    minSentiment: -1,
    eventWeight: 0.3,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 20,
    universeFilter: { symbols: [...STOCKS_TECH_UNIVERSE] },
    signalGate: {
      all: [
        { field: "momentum_score", op: "gte", value: 0.6 },
        { field: "volatility_score", op: "lte", value: 0.55 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      momentum_score: 1.7,
      volatility_score: 1.3,
    },
    exit: { stopLossPct: -4, takeProfitPct: 8, atrScale: true },
    notes: "Breakout when realized vol is not already chaotic.",
  },
  {
    id: 8,
    name: "Dip Buy In Uptrend",
    minSentiment: -1,
    eventWeight: 0.4,
    momentumConfirm: false,
    allowShort: false,
    maxHoldHours: 36,
    universeFilter: { symbols: [...STOCKS_CORE_UNIVERSE] },
    signalGate: {
      all: [
        { field: "trend_score", op: "gte", value: 0.54 },
        { field: "momentum_score", op: "lte", value: 0.48 },
        { field: "momentum_score", op: "gte", value: 0.32 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      trend_score: 1.6,
      momentum_score: 1.1,
    },
    exit: { stopLossPct: -3.5, takeProfitPct: 6, atrScale: true },
    notes: "Buy shallow pullbacks only while the higher-timeframe trend is up.",
  },
  {
    id: 9,
    name: "Short the Weak",
    minSentiment: -1,
    eventWeight: 0.5,
    momentumConfirm: false,
    allowShort: true,
    shortOnly: true,
    maxHoldHours: 24,
    universeFilter: { symbols: [...STOCKS_CORE_UNIVERSE] },
    signalGate: {
      all: [
        { field: "momentum_score", op: "lte", value: 0.4 },
        { field: "trend_score", op: "lte", value: 0.46 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      momentum_score: 1.6,
      trend_score: 1.4,
    },
    exit: { stopLossPct: -4, takeProfitPct: 7, atrScale: true },
    notes: "Only shorts. Requires a real downtrend, not a headline.",
  },
  {
    id: 10,
    name: "Tight Risk Scanner",
    minSentiment: -1,
    eventWeight: 0.3,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 16,
    universeFilter: { symbols: [...STOCKS_FULL_UNIVERSE] },
    signalGate: {
      all: [
        { field: "momentum_score", op: "gte", value: 0.57 },
        { field: "spread_score", op: "gte", value: 0.7 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      spread_score: 1.5,
      momentum_score: 1.4,
    },
    exit: { stopLossPct: -2.5, takeProfitPct: 4.5, atrScale: true },
    notes: "Small targets, skip wide-spread names.",
  },
  {
    id: 11,
    name: "Event Plus Price",
    minSentiment: -1,
    eventWeight: 1.2,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 18,
    universeFilter: { symbols: [...STOCKS_TECH_UNIVERSE] },
    signalGate: {
      all: [
        { field: "event_score", op: "gte", value: 0.25 },
        { field: "momentum_score", op: "gte", value: 0.55 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      event_score: 1.4,
      momentum_score: 1.6,
    },
    exit: { stopLossPct: -4, takeProfitPct: 8, atrScale: true },
    notes: "Catalyst only if price already confirms. Event score is decayed, not pegged.",
  },
  {
    id: 12,
    name: "Fresh Headline Trend",
    minSentiment: -1,
    eventWeight: 0.7,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 12,
    universeFilter: { symbols: [...STOCKS_FULL_UNIVERSE] },
    signalGate: {
      all: [
        { field: "freshness_score", op: "gte", value: 0.45 },
        { field: "trend_score", op: "gte", value: 0.52 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      freshness_score: 1.5,
      trend_score: 1.4,
    },
    exit: { stopLossPct: -3.5, takeProfitPct: 6, atrScale: true },
    notes: "Short hold. Fresh headline plus an already-rising tape.",
  },
  {
    id: 13,
    name: "Balanced Price Mix",
    minSentiment: -1,
    eventWeight: 0.5,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 40,
    universeFilter: { symbols: [...STOCKS_FULL_UNIVERSE] },
    signalGate: {
      any: [
        { field: "momentum_score", op: "gte", value: 0.58 },
        { field: "trend_score", op: "gte", value: 0.58 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS },
    exit: { stopLossPct: -4, takeProfitPct: 7, atrScale: true },
    notes: "Default mix of momentum, trend, and spread quality.",
  },
  {
    id: 14,
    name: "Core Tape Rider",
    minSentiment: -1,
    eventWeight: 0.4,
    momentumConfirm: true,
    allowShort: false,
    maxHoldHours: 48,
    universeFilter: { symbols: [...STOCKS_CORE_UNIVERSE] },
    signalGate: {
      all: [{ field: "momentum_score", op: "gte", value: 0.56 }],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      momentum_score: 1.7,
      trend_score: 1.5,
    },
    exit: { stopLossPct: -4, takeProfitPct: 8, atrScale: true },
    notes: "Only names that actually fill today (TSLAx, SPCXx) until other mints are live.",
  },
]);
