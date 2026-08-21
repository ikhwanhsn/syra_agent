/**
 * Delphi experiment desk — Polymarket smart-money mirror into Solana spot (paper + gated real).
 * Directional strategies: follow top crypto traders' live Polymarket views via Jupiter-priced fills.
 */
import { EARN_MINTS } from "../libs/jupiterBrokerSwap.js";

export const DELPHI_STATIC_STRATEGY_COUNT = 8;
export const DELPHI_EVOLVABLE_MIN_ID = 8;
export const DELPHI_EVOLVABLE_MAX_ID = 40;
export const DELPHI_DAILY_SPAWN_COUNT = 2;
export const DELPHI_MAX_STRATEGIES = 24;

/** Wormhole wrapped ETH on Solana (8 decimals). */
export const DELPHI_ETH_MINT = "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs";

/**
 * Polymarket asset → Jupiter mint. Thin names (XRP/DOGE) are omitted on purpose.
 */
export const DELPHI_ASSET_UNIVERSE = Object.freeze([
  {
    symbol: "SOL",
    mint: EARN_MINTS.SOL,
    pyth: "SOL/USD",
    decimals: 9,
  },
  {
    symbol: "BTC",
    mint: EARN_MINTS.CBBTC,
    pyth: "BTC/USD",
    decimals: 8,
  },
  {
    symbol: "ETH",
    mint: DELPHI_ETH_MINT,
    pyth: "ETH/USD",
    decimals: 8,
  },
]);

export const DELPHI_DEFAULTS = Object.freeze({
  startingBankUsd: 1000,
  maxConcurrentPositions: 3,
  maxPositionPct: 25,
  minTradeNotionalUsd: 15,
  defaultMaxHoldMin: 24 * 60,
});

export const DELPHI_DEFAULT_SIGNAL_WEIGHTS = Object.freeze({
  bias: 1.6,
  consensus: 1.4,
  trader_quality: 1.2,
  sample_size: 0.8,
});

export const DELPHI_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: "Consensus Core",
    minTraderQuality: 0.45,
    minConsensus: 0.6,
    minSampleSize: 3,
    biasThreshold: 0.25,
    sizePctOfBank: 20,
    maxHoldHours: 36,
    universeFilter: { symbols: ["SOL", "BTC", "ETH"] },
    signalWeights: { ...DELPHI_DEFAULT_SIGNAL_WEIGHTS },
    exit: {
      stopLossPct: -5,
      takeProfitPct: 8,
      maxHoldMin: 36 * 60,
      flipOnReversal: true,
    },
    notes: "Follow the crowd of ranked traders when they agree.",
  },
  {
    id: 1,
    name: "Elite Follow",
    minTraderQuality: 0.65,
    minConsensus: 0.5,
    minSampleSize: 2,
    biasThreshold: 0.2,
    sizePctOfBank: 18,
    maxHoldHours: 48,
    universeFilter: { symbols: ["SOL", "BTC", "ETH"] },
    signalWeights: { ...DELPHI_DEFAULT_SIGNAL_WEIGHTS, trader_quality: 1.8, bias: 1.3 },
    exit: {
      stopLossPct: -6,
      takeProfitPct: 10,
      maxHoldMin: 48 * 60,
      flipOnReversal: true,
    },
    notes: "Weight the highest-quality wallets more than raw consensus.",
  },
  {
    id: 2,
    name: "SOL Oracle",
    minTraderQuality: 0.4,
    minConsensus: 0.55,
    minSampleSize: 2,
    biasThreshold: 0.22,
    sizePctOfBank: 25,
    maxHoldHours: 24,
    universeFilter: { symbols: ["SOL"] },
    signalWeights: { ...DELPHI_DEFAULT_SIGNAL_WEIGHTS, bias: 1.8 },
    exit: {
      stopLossPct: -4,
      takeProfitPct: 7,
      maxHoldMin: 24 * 60,
      flipOnReversal: true,
    },
    notes: "SOL-only mirror. Native Jupiter spot.",
  },
  {
    id: 3,
    name: "BTC Mirror",
    minTraderQuality: 0.4,
    minConsensus: 0.55,
    minSampleSize: 2,
    biasThreshold: 0.22,
    sizePctOfBank: 22,
    maxHoldHours: 36,
    universeFilter: { symbols: ["BTC"] },
    signalWeights: { ...DELPHI_DEFAULT_SIGNAL_WEIGHTS, consensus: 1.7 },
    exit: {
      stopLossPct: -5,
      takeProfitPct: 9,
      maxHoldMin: 36 * 60,
      flipOnReversal: true,
    },
    notes: "cbBTC via Jupiter. Polymarket BTC markets are the densest book.",
  },
  {
    id: 4,
    name: "ETH Mirror",
    minTraderQuality: 0.4,
    minConsensus: 0.55,
    minSampleSize: 2,
    biasThreshold: 0.22,
    sizePctOfBank: 20,
    maxHoldHours: 36,
    universeFilter: { symbols: ["ETH"] },
    signalWeights: { ...DELPHI_DEFAULT_SIGNAL_WEIGHTS },
    exit: {
      stopLossPct: -5,
      takeProfitPct: 9,
      maxHoldMin: 36 * 60,
      flipOnReversal: true,
    },
    notes: "Wormhole ETH on Solana. Skip if Jupiter quote is dead.",
  },
  {
    id: 5,
    name: "High Conviction",
    minTraderQuality: 0.55,
    minConsensus: 0.75,
    minSampleSize: 4,
    biasThreshold: 0.4,
    sizePctOfBank: 15,
    maxHoldHours: 48,
    universeFilter: { symbols: ["SOL", "BTC", "ETH"] },
    signalWeights: { ...DELPHI_DEFAULT_SIGNAL_WEIGHTS, consensus: 1.9, bias: 1.7 },
    exit: {
      stopLossPct: -4,
      takeProfitPct: 6,
      maxHoldMin: 48 * 60,
      flipOnReversal: true,
    },
    notes: "Trade less. Require a loud, high-quality crowd.",
  },
  {
    id: 6,
    name: "Fast Flip",
    minTraderQuality: 0.35,
    minConsensus: 0.5,
    minSampleSize: 2,
    biasThreshold: 0.18,
    sizePctOfBank: 12,
    maxHoldHours: 12,
    universeFilter: { symbols: ["SOL", "BTC"] },
    signalWeights: { ...DELPHI_DEFAULT_SIGNAL_WEIGHTS, bias: 1.9, sample_size: 0.5 },
    exit: {
      stopLossPct: -3,
      takeProfitPct: 5,
      maxHoldMin: 12 * 60,
      flipOnReversal: true,
    },
    notes: "Shorter holds. Exit as soon as the crowd reverses.",
  },
  {
    id: 7,
    name: "Patient Elite",
    minTraderQuality: 0.6,
    minConsensus: 0.55,
    minSampleSize: 3,
    biasThreshold: 0.28,
    sizePctOfBank: 22,
    maxHoldHours: 72,
    universeFilter: { symbols: ["SOL", "BTC", "ETH"] },
    signalWeights: { ...DELPHI_DEFAULT_SIGNAL_WEIGHTS, trader_quality: 1.7 },
    exit: {
      stopLossPct: -7,
      takeProfitPct: 12,
      maxHoldMin: 72 * 60,
      flipOnReversal: false,
    },
    notes: "Wider stops. Do not flatten on a one-tick crowd flip.",
  },
]);

export function getDelphiAsset(symbol) {
  const key = String(symbol || "").toUpperCase();
  return DELPHI_ASSET_UNIVERSE.find((a) => a.symbol === key) || null;
}
