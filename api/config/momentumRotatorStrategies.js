/**
 * Momentum Rotator — trend-following strategies across liquid Solana majors.
 */
import { EARN_MINTS } from '../libs/jupiterBrokerSwap.js';

export const MOMENTUM_STATIC_STRATEGY_COUNT = 8;
export const MOMENTUM_EVOLVABLE_MIN_ID = 8;
export const MOMENTUM_EVOLVABLE_MAX_ID = 40;
export const MOMENTUM_DAILY_SPAWN_COUNT = 2;
export const MOMENTUM_MAX_STRATEGIES = 24;

export const MOMENTUM_UNIVERSE = Object.freeze([
  { symbol: 'SOL', mint: EARN_MINTS.SOL },
  { symbol: 'cbBTC', mint: EARN_MINTS.CBBTC },
  { symbol: 'JLP', mint: EARN_MINTS.JLP },
]);

export const MOMENTUM_DEFAULTS = Object.freeze({
  startingBankUsd: 1000,
  maxConcurrentPositions: 3,
  maxPositionPct: 35,
  minTradeNotionalUsd: 10,
  defaultMaxHoldHours: 48,
});

export const MOMENTUM_DEFAULT_WEIGHTS = Object.freeze({
  momentum_score: 1.4,
  volatility_score: 0.9,
  volume_score: 1.0,
  trend_score: 1.3,
});

export const MOMENTUM_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: 'Breakout Hunter',
    maxHoldHours: 36,
    universeFilter: { symbols: ['SOL', 'cbBTC', 'JLP'] },
    signalGate: { all: [{ field: 'momentum_score', op: 'gte', value: 0.55 }], minPasses: 1 },
    signalWeights: { ...MOMENTUM_DEFAULT_WEIGHTS, momentum_score: 1.8 },
    exit: { stopLossPct: -4, takeProfitPct: 8, trailingTriggerPct: 4, trailingGivebackPct: 2 },
    notes: 'Enter on strong momentum breakouts',
  },
  {
    id: 1,
    name: 'MA Cross Trend',
    maxHoldHours: 72,
    universeFilter: { symbols: ['SOL', 'cbBTC'] },
    signalGate: { all: [{ field: 'trend_score', op: 'gte', value: 0.5 }], minPasses: 1 },
    signalWeights: { ...MOMENTUM_DEFAULT_WEIGHTS, trend_score: 1.7 },
    exit: { stopLossPct: -5, takeProfitPct: 10 },
    notes: 'Slower trend follow',
  },
  {
    id: 2,
    name: 'Volatility Scaler',
    maxHoldHours: 24,
    universeFilter: { symbols: ['SOL', 'JLP'] },
    signalGate: {
      all: [
        { field: 'momentum_score', op: 'gte', value: 0.45 },
        { field: 'volatility_score', op: 'lte', value: 0.7 },
      ],
      minPasses: 2,
    },
    signalWeights: { ...MOMENTUM_DEFAULT_WEIGHTS, volatility_score: 1.4 },
    exit: { stopLossPct: -3, takeProfitPct: 6 },
    notes: 'Avoid high-vol chop',
  },
  {
    id: 3,
    name: 'JLP Carry Momentum',
    maxHoldHours: 96,
    universeFilter: { symbols: ['JLP'] },
    signalGate: { all: [{ field: 'trend_score', op: 'gte', value: 0.4 }], minPasses: 1 },
    signalWeights: { ...MOMENTUM_DEFAULT_WEIGHTS, volume_score: 1.3 },
    exit: { stopLossPct: -6, takeProfitPct: 12 },
    notes: 'Prefer JLP in mild uptrends',
  },
  {
    id: 4,
    name: 'BTC Relative Strength',
    maxHoldHours: 48,
    universeFilter: { symbols: ['cbBTC'] },
    signalGate: { all: [{ field: 'momentum_score', op: 'gte', value: 0.5 }], minPasses: 1 },
    signalWeights: { ...MOMENTUM_DEFAULT_WEIGHTS, momentum_score: 1.6 },
    exit: { stopLossPct: -4.5, takeProfitPct: 9 },
    notes: 'cbBTC-only RS',
  },
  {
    id: 5,
    name: 'SOL Momentum Core',
    maxHoldHours: 36,
    universeFilter: { symbols: ['SOL'] },
    signalGate: { all: [{ field: 'momentum_score', op: 'gte', value: 0.5 }], minPasses: 1 },
    signalWeights: { ...MOMENTUM_DEFAULT_WEIGHTS },
    exit: { stopLossPct: -4, takeProfitPct: 7 },
    notes: 'SOL spot momentum',
  },
  {
    id: 6,
    name: 'Multi-Asset Basket',
    maxHoldHours: 48,
    universeFilter: { symbols: ['SOL', 'cbBTC', 'JLP'] },
    signalGate: { any: [{ field: 'momentum_score', op: 'gte', value: 0.48 }], minPasses: 1 },
    signalWeights: { ...MOMENTUM_DEFAULT_WEIGHTS },
    exit: { stopLossPct: -5, takeProfitPct: 9, trailingTriggerPct: 5, trailingGivebackPct: 2.5 },
    notes: 'Pick best of universe',
  },
  {
    id: 7,
    name: 'Conservative Trend',
    maxHoldHours: 72,
    universeFilter: { symbols: ['SOL', 'cbBTC'] },
    signalGate: {
      all: [
        { field: 'trend_score', op: 'gte', value: 0.55 },
        { field: 'momentum_score', op: 'gte', value: 0.4 },
      ],
      minPasses: 2,
    },
    signalWeights: { ...MOMENTUM_DEFAULT_WEIGHTS, trend_score: 1.5 },
    exit: { stopLossPct: -3.5, takeProfitPct: 6 },
    notes: 'High conviction only',
  },
]);
