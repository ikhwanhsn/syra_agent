/**
 * Meridian experiment desk — Meteora DLMM liquidity strategies (paper + gated real).
 * Separate from the LP agent lab: its own roster, evolution range, and profitable seed.
 *
 * Base rows live here; evolution overwrites specific strategyId slots via MeridianStrategyOverride.
 * Reuses LP scoring/economics helpers — do NOT rebuild DLMM math.
 */
import { LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS } from "./lpAgentExperimentStrategies.js";

/** Static roster: ids 0–11. Dynamic evo agents use ids 12–97 via overrides (+ mirror 98). */
export const MERIDIAN_STATIC_STRATEGY_COUNT = 12;
export const MERIDIAN_EVOLVABLE_MIN_ID = 12;
export const MERIDIAN_EVOLVABLE_MAX_ID = 97;
/** New evo agents spawned per evolution tick (mutated from sim leaders). */
export const MERIDIAN_DAILY_SPAWN_COUNT = 4;
export const MERIDIAN_MAX_STRATEGIES = 60;
/** Pinned mirror strategy that follows the live real Meridian agent (excluded from evolution). */
export const MERIDIAN_REAL_MIRROR_STRATEGY_ID = 98;

/** Copy of the LP desk's default signal weights — Meridian shares the same signal space. */
export const MERIDIAN_DEFAULT_SIGNAL_WEIGHTS = Object.freeze({
  ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
});

export const MERIDIAN_DEFAULTS = Object.freeze({
  startingBankSol: 10,
  maxPositionSol: 1,
  maxConcurrentPositions: 8,
  maxRunAgeHours: 36,
  winThresholdPct: 0.5,
  positionSizePct: 0.35,
  gasReserve: 0.2,
  deployAmountSol: 0.5,
  /** @deprecated Legacy bps fields — tx costs use lpEconomicsModel.computeSimTransactionCostsSol */
  openFeeBps: 12,
  /** @deprecated Legacy bps fields — tx costs use lpEconomicsModel.computeSimTransactionCostsSol */
  closeFeeBps: 12,
});

/**
 * Meridian screening base (from the desk's user-config profitable defaults).
 * The reused LP scoring reads a subset of these keys (minOrganic, minFeeTvlRatio,
 * minVolume24hUsd, minHolderCount, minTvlUsd, maxTvlUsd, maxRiskScore, …). The remaining
 * Meridian-native keys (mcap, bin step, holder-quality) are carried into snapshots and used
 * by Meridian's own pre-screen in meridianService.
 */
export const MERIDIAN_SCREENING_BASE = Object.freeze({
  minFeeTvlRatio: 0.05,
  minTvlUsd: 10_000,
  maxTvlUsd: 150_000,
  minVolume24hUsd: 500,
  minOrganic: 60,
  minHolders: 500,
  /** Alias so the reused LP screening (passesScreeningOverrides) also enforces holder floor. */
  minHolderCount: 500,
  minMcap: 150_000,
  maxMcap: 10_000_000,
  minBinStep: 80,
  maxBinStep: 125,
  minTokenFeesSol: 30,
  maxBotHoldersPct: 30,
  maxTop10Pct: 60,
});

export const MERIDIAN_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: "Meridian Bid-Ask Core",
    lpShape: "bid_ask",
    binsBelow: 69,
    binsAbove: 0,
    // PRIMARY PROFITABLE SETUP — single-sided bid-ask fee farm on thin high-velocity pools.
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE },
    signalGate: {
      any: [
        { field: "fee_tvl_ratio", op: "gte", value: 0.5 },
        { field: "volume", op: "gte", value: 0.5 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, fee_velocity: 1.6, fee_tvl_ratio: 1.7 },
    exit: {
      stopLossPct: -15,
      takeProfitPct: 5,
      oorWaitMin: 30,
      trailingTriggerPct: 3,
      trailingDropPct: 1.5,
      minHoldMin: 30,
    },
    notes: "Primary profitable seed: single-sided bid-ask fee farm on thin, high-velocity pools.",
  },
  {
    id: 1,
    name: "Meridian Spot Wide",
    lpShape: "spot",
    binsBelow: 40,
    binsAbove: 40,
    screeningOverrides: {
      ...MERIDIAN_SCREENING_BASE,
      minFeeTvlRatio: 0.055,
      minOrganic: 64,
      minVolume24hUsd: 2_000,
    },
    signalGate: {
      any: [{ field: "fee_tvl_ratio", op: "gte", value: 0.45 }],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, fee_tvl_ratio: 1.5, safety_score: 1.6 },
    exit: {
      stopLossPct: -12,
      takeProfitPct: 6,
      oorWaitMin: 35,
      trailingTriggerPct: 3.5,
      trailingDropPct: 1.6,
      minHoldMin: 30,
    },
    notes: "Wide two-sided spot fee farmer; tighter screening than core.",
  },
  {
    id: 2,
    name: "Meridian Curve Center",
    lpShape: "curve",
    binsBelow: 38,
    binsAbove: 38,
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE, minOrganic: 64, minHolderCount: 700 },
    signalGate: {
      any: [
        { field: "organic_score", op: "gte", value: 0.6 },
        { field: "holder_count", op: "gte", value: 0.5 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, organic_score: 1.3, holder_count: 1.2 },
    exit: {
      stopLossPct: -12,
      takeProfitPct: 7,
      oorWaitMin: 40,
      trailingTriggerPct: 3.5,
      trailingDropPct: 1.6,
      minHoldMin: 35,
    },
    notes: "Center-heavy curve on established pools; stays in range to compound fees.",
  },
  {
    id: 3,
    name: "Meridian Bid-Ask Tight",
    lpShape: "bid_ask",
    binsBelow: 45,
    binsAbove: 5,
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE, minFeeTvlRatio: 0.055 },
    signalGate: {
      any: [{ field: "fee_tvl_ratio", op: "gte", value: 0.55 }],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, fee_tvl_ratio: 1.6, fee_velocity: 1.4 },
    exit: {
      stopLossPct: -14,
      takeProfitPct: 4,
      oorWaitMin: 25,
      trailingTriggerPct: 2.5,
      trailingDropPct: 1.3,
      minHoldMin: 20,
    },
    notes: "Tighter bid-ask with faster take-profit for quick fee capture.",
  },
  {
    id: 4,
    name: "Meridian Spot Fee Farm",
    lpShape: "spot",
    binsBelow: 42,
    binsAbove: 42,
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE, minFeeTvlRatio: 0.06, minVolume24hUsd: 3_000 },
    signalGate: {
      all: [{ field: "fee_tvl_ratio", op: "gte", value: 0.55 }],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, fee_tvl_ratio: 1.55, volume: 1.2 },
    exit: {
      stopLossPct: -12,
      takeProfitPct: 6,
      oorWaitMin: 40,
      trailingTriggerPct: 3.5,
      trailingDropPct: 1.6,
      minHoldMin: 35,
    },
    notes: "Sustainable high fee/TVL spot pools; wide range to compound fees.",
  },
  {
    id: 5,
    name: "Meridian Aggressive Sniper",
    lpShape: "bid_ask",
    binsBelow: 60,
    binsAbove: 10,
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE, minVolume24hUsd: 5_000 },
    signalGate: {
      any: [
        { field: "volume", op: "gte", value: 0.6 },
        { field: "freshness_score", op: "gte", value: 0.55 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, volume: 1.4, freshness_score: 1.4 },
    exit: {
      stopLossPct: -12,
      takeProfitPct: 10,
      oorWaitMin: 20,
      trailingTriggerPct: 5,
      trailingDropPct: 2.5,
      minHoldMin: 15,
    },
    notes: "Fast rotation sniper; higher take-profit, quicker OOR cut.",
  },
  {
    id: 6,
    name: "Meridian Conservative Organic",
    lpShape: "spot",
    binsBelow: 50,
    binsAbove: 50,
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE, minOrganic: 70, minHolderCount: 800 },
    signalGate: {
      any: [{ field: "organic_score", op: "gte", value: 0.65 }],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, organic_score: 1.35, safety_score: 1.7 },
    exit: {
      stopLossPct: -10,
      takeProfitPct: 6,
      oorWaitMin: 45,
      trailingTriggerPct: 3.5,
      trailingDropPct: 1.6,
      minHoldMin: 40,
    },
    notes: "High-organic, wide two-sided spot; defensive fee compounding.",
  },
  {
    id: 7,
    name: "Meridian Single-Sided Bid",
    lpShape: "bid_ask",
    binsBelow: 90,
    binsAbove: 0,
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE, minFeeTvlRatio: 0.055 },
    signalGate: {
      any: [
        { field: "volume", op: "gte", value: 0.55 },
        { field: "fee_tvl_ratio", op: "gte", value: 0.5 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, volume: 1.3, fee_velocity: 1.4 },
    exit: {
      stopLossPct: -18,
      takeProfitPct: 12,
      oorWaitMin: 20,
      trailingTriggerPct: 6,
      trailingDropPct: 3,
      minHoldMin: 15,
    },
    notes: "Deep single-sided bid accumulation; token-side reseed style.",
  },
  {
    id: 8,
    name: "Meridian Trailing Hunter",
    lpShape: "bid_ask",
    binsBelow: 55,
    binsAbove: 8,
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE },
    signalGate: {
      any: [{ field: "fee_tvl_ratio", op: "gte", value: 0.5 }],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, fee_velocity: 1.5 },
    exit: {
      stopLossPct: -14,
      takeProfitPct: 8,
      oorWaitMin: 25,
      trailingTriggerPct: 2.5,
      trailingDropPct: 1.0,
      minHoldMin: 20,
    },
    notes: "Tight trailing stop to lock incremental fee gains.",
  },
  {
    id: 9,
    name: "Meridian Mid Cap Spot",
    lpShape: "spot",
    binsBelow: 35,
    binsAbove: 35,
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE, minMcap: 500_000, maxMcap: 5_000_000 },
    signalGate: {
      any: [{ field: "organic_score", op: "gte", value: 0.6 }],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, safety_score: 1.6 },
    exit: {
      stopLossPct: -12,
      takeProfitPct: 6,
      oorWaitMin: 35,
      trailingTriggerPct: 3.5,
      trailingDropPct: 1.6,
      minHoldMin: 30,
    },
    notes: "Mid-cap band spot; narrower range on more liquid names.",
  },
  {
    id: 10,
    name: "Meridian High Velocity",
    lpShape: "bid_ask",
    binsBelow: 50,
    binsAbove: 10,
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE, minVolume24hUsd: 50_000 },
    signalGate: {
      any: [
        { field: "volume", op: "gte", value: 0.62 },
        { field: "fee_velocity", op: "gte", value: 0.55 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, volume: 1.45, fee_velocity: 1.55 },
    exit: {
      stopLossPct: -15,
      takeProfitPct: 9,
      oorWaitMin: 20,
      trailingTriggerPct: 4,
      trailingDropPct: 2,
      minHoldMin: 15,
    },
    notes: "High 24h volume pools; captures fee bursts on flow spikes.",
  },
  {
    id: 11,
    name: "Meridian Safe Compound",
    lpShape: "spot",
    binsBelow: 45,
    binsAbove: 45,
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE, minOrganic: 68, maxRiskScore: 0.45 },
    signalGate: {
      any: [{ field: "organic_score", op: "gte", value: 0.62 }],
      minPasses: 1,
    },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS, safety_score: 1.75, risk_reward: 2.05 },
    exit: {
      stopLossPct: -10,
      takeProfitPct: 5,
      oorWaitMin: 45,
      trailingTriggerPct: 3,
      trailingDropPct: 1.5,
      minHoldMin: 40,
    },
    notes: "Lowest risk band; wide range, tight stop, steady fee compounding.",
  },
  {
    id: MERIDIAN_REAL_MIRROR_STRATEGY_ID,
    name: "Meridian Real Mirror",
    lpShape: "bid_ask",
    binsBelow: 60,
    binsAbove: 0,
    screeningOverrides: { ...MERIDIAN_SCREENING_BASE, minOrganic: 55, minFeeTvlRatio: 0.045 },
    signalGate: { minPasses: 0 },
    signalWeights: { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS },
    exit: {
      stopLossPct: -15,
      takeProfitPct: 5,
      oorWaitMin: 30,
      trailingTriggerPct: 3,
      trailingDropPct: 1.5,
      minHoldMin: 30,
    },
    notes:
      "Pinned mirror of the live Meridian real agent: follows the sim PnL leader on the real pool screen. Not evolvable.",
  },
]);

export function getMeridianDefaultSignalWeights() {
  return { ...MERIDIAN_DEFAULT_SIGNAL_WEIGHTS };
}

export function getMeridianStrategies() {
  return MERIDIAN_STRATEGIES;
}

export function getMeridianStrategyById(strategyId) {
  const id = Number(strategyId);
  if (!Number.isInteger(id)) return null;
  return MERIDIAN_STRATEGIES.find((s) => s.id === id) ?? null;
}
