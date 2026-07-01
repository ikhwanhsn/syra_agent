/**
 * Stocks news experiment strategies — paper trading xStocks via Jupiter price feeds.
 * Deterministic news sentiment + event scoring drives entry gates.
 */

export const STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS = Object.freeze({
  sentiment_score: 1.4,
  event_score: 1.25,
  freshness_score: 1.1,
  momentum_score: 1.15,
  volume_score: 0.9,
  spread_score: 0.85,
});

export const STOCKS_STATIC_STRATEGY_COUNT = 15;
export const STOCKS_EVOLVABLE_MIN_ID = 15;
export const STOCKS_EVOLVABLE_MAX_ID = 97;
export const STOCKS_DAILY_SPAWN_COUNT = 3;
export const STOCKS_MAX_STRATEGIES = 78;

export const STOCKS_EXPERIMENT_DEFAULTS = Object.freeze({
  startingBankUsd: 1000,
  maxConcurrentPositions: 3,
  maxPositionPct: 100,
  minTradeNotionalUsd: 1,
  defaultMaxHoldHours: 48,
});

export const STOCKS_EXPERIMENT_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: "Conservative News Follower",
    minSentiment: 0.15,
    eventWeight: 0.8,
    momentumConfirm: true,
    maxHoldHours: 72,
    universeFilter: { symbols: ["TSLAx", "AAPLx", "NVDAx", "SPYx"] },
    signalGate: {
      all: [{ field: "sentiment_score", op: "gte", value: 0.1 }],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      sentiment_score: 1.6,
      momentum_score: 1.3,
    },
    exit: { stopLossPct: -5, takeProfitPct: 8 },
    notes: "Only trades on positive news with momentum confirmation.",
  },
  {
    id: 1,
    name: "Event Catalyst Hunter",
    minSentiment: 0,
    eventWeight: 1.8,
    momentumConfirm: false,
    maxHoldHours: 24,
    universeFilter: { symbols: ["TSLAx", "NVDAx", "AAPLx", "SPCXx"] },
    signalGate: {
      any: [{ field: "event_score", op: "gte", value: 0.5 }],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      event_score: 2.0,
      freshness_score: 1.4,
    },
    exit: { stopLossPct: -6, takeProfitPct: 12 },
    notes: "Fast rotation on earnings, IPO, and catalyst headlines.",
  },
  {
    id: 2,
    name: "Sentiment Momentum",
    minSentiment: 0.25,
    eventWeight: 0.6,
    momentumConfirm: true,
    maxHoldHours: 48,
    universeFilter: { symbols: ["TSLAx", "NVDAx", "SPYx"] },
    signalGate: {
      all: [
        { field: "sentiment_score", op: "gte", value: 0.2 },
        { field: "momentum_score", op: "gte", value: 0.4 },
      ],
      minPasses: 2,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      sentiment_score: 1.5,
      momentum_score: 1.6,
    },
    exit: { stopLossPct: -4, takeProfitPct: 10 },
    notes: "Requires both bullish news and positive price momentum.",
  },
  {
    id: 3,
    name: "Contrarian Dip Buyer",
    minSentiment: -0.3,
    eventWeight: 0.5,
    momentumConfirm: false,
    maxHoldHours: 96,
    universeFilter: { symbols: ["TSLAx", "AAPLx", "SPYx", "NVDAx"] },
    signalGate: {
      all: [{ field: "sentiment_score", op: "lte", value: -0.15 }],
      any: [{ field: "momentum_score", op: "lte", value: 0.35 }],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      sentiment_score: 1.2,
      momentum_score: 1.4,
    },
    exit: { stopLossPct: -8, takeProfitPct: 6 },
    notes: "Buys on negative news when price is oversold.",
  },
  {
    id: 4,
    name: "Mega-Cap Stability",
    minSentiment: 0.05,
    eventWeight: 0.4,
    momentumConfirm: false,
    maxHoldHours: 120,
    universeFilter: { symbols: ["AAPLx", "SPYx"] },
    signalGate: {
      any: [{ field: "sentiment_score", op: "gte", value: 0 }],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      sentiment_score: 1.3,
      spread_score: 1.2,
    },
    exit: { stopLossPct: -3, takeProfitPct: 5 },
    notes: "Low-volatility mega-cap focus with tight risk controls.",
  },
  {
    id: 5,
    name: "Tech Growth Aggressor",
    minSentiment: 0.1,
    eventWeight: 1.2,
    momentumConfirm: true,
    maxHoldHours: 36,
    universeFilter: { symbols: ["TSLAx", "NVDAx", "SPCXx"] },
    signalGate: {
      any: [
        { field: "event_score", op: "gte", value: 0.35 },
        { field: "sentiment_score", op: "gte", value: 0.25 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      event_score: 1.5,
      momentum_score: 1.5,
    },
    exit: { stopLossPct: -7, takeProfitPct: 15 },
    notes: "High-beta tech names on strong news catalysts.",
  },
  {
    id: 6,
    name: "Fresh Headline Sniper",
    minSentiment: 0,
    eventWeight: 1.0,
    momentumConfirm: false,
    maxHoldHours: 12,
    universeFilter: { symbols: ["TSLAx", "NVDAx", "AAPLx", "SPCXx", "SPYx"] },
    signalGate: {
      all: [{ field: "freshness_score", op: "gte", value: 0.6 }],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      freshness_score: 2.0,
      event_score: 1.3,
    },
    exit: { stopLossPct: -4, takeProfitPct: 6 },
    notes: "Ultra-short hold on breaking news within the last hour.",
  },
  {
    id: 7,
    name: "Index Tracker",
    minSentiment: 0,
    eventWeight: 0.3,
    momentumConfirm: false,
    maxHoldHours: 168,
    universeFilter: { symbols: ["SPYx"] },
    signalGate: {
      any: [{ field: "sentiment_score", op: "gte", value: -0.1 }],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      sentiment_score: 1.0,
      momentum_score: 1.2,
    },
    exit: { stopLossPct: -2.5, takeProfitPct: 4 },
    notes: "SP500 xStock only — macro news driven.",
  },
  {
    id: 8,
    name: "SpaceX IPO Specialist",
    minSentiment: 0.05,
    eventWeight: 1.5,
    momentumConfirm: false,
    maxHoldHours: 48,
    universeFilter: { symbols: ["SPCXx"] },
    signalGate: {
      any: [
        { field: "event_score", op: "gte", value: 0.3 },
        { field: "sentiment_score", op: "gte", value: 0.1 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      event_score: 1.8,
      freshness_score: 1.3,
    },
    exit: { stopLossPct: -6, takeProfitPct: 10 },
    notes: "Dedicated SPCXx agent for SpaceX IPO narrative.",
  },
  {
    id: 9,
    name: "Multi-Signal Balanced",
    minSentiment: 0.08,
    eventWeight: 0.9,
    momentumConfirm: true,
    maxHoldHours: 60,
    universeFilter: { symbols: ["TSLAx", "AAPLx", "NVDAx", "SPYx", "SPCXx"] },
    signalGate: {
      any: [
        { field: "sentiment_score", op: "gte", value: 0.15 },
        { field: "event_score", op: "gte", value: 0.4 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS },
    exit: { stopLossPct: -5, takeProfitPct: 9 },
    notes: "Balanced weighting across all signal dimensions.",
  },
  {
    id: 10,
    name: "High Conviction Only",
    minSentiment: 0.35,
    eventWeight: 1.0,
    momentumConfirm: true,
    maxHoldHours: 48,
    universeFilter: { symbols: ["TSLAx", "NVDAx", "AAPLx"] },
    signalGate: {
      all: [
        { field: "sentiment_score", op: "gte", value: 0.3 },
        { field: "momentum_score", op: "gte", value: 0.5 },
      ],
      minPasses: 2,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      sentiment_score: 1.8,
    },
    exit: { stopLossPct: -4, takeProfitPct: 12 },
    notes: "Fewer trades, higher conviction entries only.",
  },
  {
    id: 11,
    name: "Volume Breakout",
    minSentiment: 0,
    eventWeight: 0.7,
    momentumConfirm: true,
    maxHoldHours: 24,
    universeFilter: { symbols: ["TSLAx", "NVDAx", "SPCXx"] },
    signalGate: {
      all: [{ field: "momentum_score", op: "gte", value: 0.55 }],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      momentum_score: 1.8,
      volume_score: 1.4,
    },
    exit: { stopLossPct: -5, takeProfitPct: 11 },
    notes: "Price momentum breakout with news tailwind.",
  },
  {
    id: 12,
    name: "Defensive News Hedge",
    minSentiment: -0.1,
    eventWeight: 0.5,
    momentumConfirm: false,
    maxHoldHours: 96,
    universeFilter: { symbols: ["SPYx", "AAPLx"] },
    signalGate: {
      any: [{ field: "sentiment_score", op: "gte", value: -0.05 }],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      spread_score: 1.3,
      sentiment_score: 0.9,
    },
    exit: { stopLossPct: -2, takeProfitPct: 4 },
    notes: "Conservative defensive posture on stable names.",
  },
  {
    id: 13,
    name: "Earnings Season",
    minSentiment: 0,
    eventWeight: 2.0,
    momentumConfirm: false,
    maxHoldHours: 18,
    universeFilter: { symbols: ["TSLAx", "NVDAx", "AAPLx"] },
    signalGate: {
      all: [{ field: "event_score", op: "gte", value: 0.55 }],
      minPasses: 1,
    },
    signalWeights: {
      ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      event_score: 2.2,
      freshness_score: 1.5,
    },
    exit: { stopLossPct: -5, takeProfitPct: 14 },
    notes: "Targets earnings, dividend, and corporate event headlines.",
  },
  {
    id: 14,
    name: "Broad Universe Scanner",
    minSentiment: 0.05,
    eventWeight: 0.8,
    momentumConfirm: false,
    maxHoldHours: 48,
    universeFilter: { symbols: ["TSLAx", "AAPLx", "NVDAx", "SPYx", "SPCXx"] },
    signalGate: {
      any: [
        { field: "sentiment_score", op: "gte", value: 0.1 },
        { field: "event_score", op: "gte", value: 0.35 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...STOCKS_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS },
    exit: { stopLossPct: -5, takeProfitPct: 8 },
    notes: "Scans full xStocks universe for any actionable signal.",
  },
]);
