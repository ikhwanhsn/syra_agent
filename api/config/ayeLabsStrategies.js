/**
 * AyeLabs experiment desk — GMGN V/L radar screening + Meteora DLMM paper/real.
 * Strategy gates ported from ayehuasca/gmgn-vl-radar (Solana trending V/L board).
 *
 * Base rows live here; evolution overwrites specific strategyId slots via AyeLabsStrategyOverride.
 * Reuses LP scoring/economics helpers — do NOT rebuild DLMM math.
 */
import { LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS } from "./lpAgentExperimentStrategies.js";

/** Static roster: ids 0–11. Dynamic evo agents use ids 12–97 via overrides (+ mirror 98). */
export const AYE_LABS_STATIC_STRATEGY_COUNT = 12;
export const AYE_LABS_EVOLVABLE_MIN_ID = 12;
export const AYE_LABS_EVOLVABLE_MAX_ID = 97;
/** New evo agents spawned per evolution tick (mutated from sim leaders). */
export const AYE_LABS_DAILY_SPAWN_COUNT = 4;
export const AYE_LABS_MAX_STRATEGIES = 60;
/** Pinned mirror strategy that follows the live real AyeLabs agent (excluded from evolution). */
export const AYE_LABS_REAL_MIRROR_STRATEGY_ID = 98;

/** LP desk signal weights plus radar metrics used by AyeLabs gates. */
export const AYE_LABS_DEFAULT_SIGNAL_WEIGHTS = Object.freeze({
  ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
  vl_ratio: 1.5,
  flow_ratio: 1.3,
  swap_speed: 1.2,
  volume: 1.1,
});

export const AYE_LABS_DEFAULTS = Object.freeze({
  startingBankSol: 10,
  maxPositionSol: 1,
  maxConcurrentPositions: 8,
  /** Radar operating rule: max hold 1 hour. */
  maxRunAgeHours: 1,
  winThresholdPct: 0.5,
  positionSizePct: 0.35,
  gasReserve: 0.2,
  deployAmountSol: 0.5,
  openFeeBps: 12,
  closeFeeBps: 12,
});

/**
 * Solana GMGN V/L radar gates (from gmgn-vl-radar TREND_CMD / filter-query.json).
 * Liquidity $2500, smart degen 2. Creator close is NOT required.
 */
export const AYE_LABS_SCREENING_BASE = Object.freeze({
  minLiquidityUsd: 2_500,
  /** Alias for LP screening helpers that read TVL floors. */
  minTvlUsd: 2_500,
  maxTvlUsd: 5_000_000,
  minHolders: 200,
  minHolderCount: 200,
  minAgeMinutes: 30,
  minGasFee: 20,
  minSmartDegen: 2,
  minSwaps: 500,
  minMcap: 100_000,
  maxMcap: 50_000_000,
  requireSocial: true,
  excludeWashTrading: true,
  requireCreatorClose: false,
  candidateLimit: 100,
  boardLimit: 10,
  interval: "1h",
  chain: "sol",
  /** Soft LP fee/organic floors so Meteora pools remain tradable when matched. */
  minFeeTvlRatio: 0.03,
  minVolume24hUsd: 500,
  minOrganic: 40,
});

/** Shared 1-hour rotation exit (radar RULE: MAX HOLD 1 HOUR). */
const AYE_LABS_EXIT_1H = Object.freeze({
  stopLossPct: -12,
  takeProfitPct: 8,
  oorWaitMin: 15,
  trailingTriggerPct: 4,
  trailingDropPct: 2,
  minHoldMin: 5,
  maxHoldMin: 60,
});

export const AYE_LABS_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: "AyeLabs V/L Core",
    lpShape: "bid_ask",
    binsBelow: 69,
    binsAbove: 0,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE },
    signalGate: {
      any: [
        { field: "vl_ratio", op: "gte", value: 0.8 },
        { field: "volume", op: "gte", value: 0.5 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, vl_ratio: 1.8, fee_velocity: 1.4 },
    exit: { ...AYE_LABS_EXIT_1H },
    notes: "Primary V/L rotator: rank by 1h volume/liquidity, single-sided bid-ask, max hold 1h.",
  },
  {
    id: 1,
    name: "AyeLabs FLOW Spike",
    lpShape: "bid_ask",
    binsBelow: 50,
    binsAbove: 10,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE, minSwaps: 500 },
    signalGate: {
      all: [
        { field: "swap_speed", op: "gte", value: 1.3 },
        { field: "flow_ratio", op: "gte", value: 1.2 },
        { field: "flow_bullish", op: "eq", value: true },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS,
      swap_speed: 1.7,
      flow_ratio: 1.6,
      vl_ratio: 1.4,
    },
    exit: { ...AYE_LABS_EXIT_1H, takeProfitPct: 12, minHoldMin: 3 },
    notes: "Bullish FLOW spike: S×≥1.3, FLOW≥1.2, buy-led 5m direction.",
  },
  {
    id: 2,
    name: "AyeLabs Bearish Bid-Ask",
    lpShape: "bid_ask",
    binsBelow: 80,
    binsAbove: 0,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE },
    signalGate: {
      all: [
        { field: "flow_bearish", op: "eq", value: true },
        { field: "swaps_5m", op: "gte", value: 50 },
      ],
      any: [
        { field: "flow_ratio", op: "lte", value: 0.8 },
        { field: "flow_ratio", op: "gte", value: 1.2 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, flow_ratio: 1.2, volume: 1.3 },
    exit: { ...AYE_LABS_EXIT_1H, stopLossPct: -15, takeProfitPct: 6 },
    notes: "Busy swaps + bearish FLOW: single-sided bid below price for downward rotation.",
  },
  {
    id: 3,
    name: "AyeLabs Spot Wide V/L",
    lpShape: "spot",
    binsBelow: 40,
    binsAbove: 40,
    screeningOverrides: {
      ...AYE_LABS_SCREENING_BASE,
      minLiquidityUsd: 5_000,
      minTvlUsd: 5_000,
    },
    signalGate: {
      any: [{ field: "vl_ratio", op: "gte", value: 1.0 }],
      minPasses: 1,
    },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, vl_ratio: 1.5, safety_score: 1.4 },
    exit: { ...AYE_LABS_EXIT_1H, stopLossPct: -10, takeProfitPct: 5 },
    notes: "Wider two-sided spot on higher-liq V/L names.",
  },
  {
    id: 4,
    name: "AyeLabs Curve Center",
    lpShape: "curve",
    binsBelow: 38,
    binsAbove: 38,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE, minHolderCount: 300 },
    signalGate: {
      any: [
        { field: "vl_ratio", op: "gte", value: 0.9 },
        { field: "holder_count", op: "gte", value: 0.45 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, vl_ratio: 1.3, holder_count: 1.2 },
    exit: { ...AYE_LABS_EXIT_1H },
    notes: "Center-heavy curve on V/L board names with more holders.",
  },
  {
    id: 5,
    name: "AyeLabs Explosive S×",
    lpShape: "bid_ask",
    binsBelow: 55,
    binsAbove: 8,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE },
    signalGate: {
      all: [
        { field: "swap_speed", op: "gte", value: 2.0 },
        { field: "flow_bullish", op: "eq", value: true },
      ],
      minPasses: 1,
    },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, swap_speed: 1.9, flow_ratio: 1.5 },
    exit: { ...AYE_LABS_EXIT_1H, takeProfitPct: 15, minHoldMin: 2, stopLossPct: -10 },
    notes: "Explosive swap acceleration (S×≥2) with bullish FLOW confirmation.",
  },
  {
    id: 6,
    name: "AyeLabs Hot FLOW",
    lpShape: "bid_ask",
    binsBelow: 60,
    binsAbove: 5,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE },
    signalGate: {
      all: [
        { field: "flow_ratio", op: "gte", value: 1.2 },
        { field: "vl_ratio", op: "gte", value: 1.0 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, flow_ratio: 1.7, vl_ratio: 1.5 },
    exit: { ...AYE_LABS_EXIT_1H, takeProfitPct: 10 },
    notes: "Hot FLOW (≥1.2) plus solid V/L; rotate within the hour.",
  },
  {
    id: 7,
    name: "AyeLabs Conservative Organic",
    lpShape: "spot",
    binsBelow: 45,
    binsAbove: 45,
    screeningOverrides: {
      ...AYE_LABS_SCREENING_BASE,
      minOrganic: 60,
      minHolderCount: 400,
      minLiquidityUsd: 8_000,
      minTvlUsd: 8_000,
    },
    signalGate: {
      any: [
        { field: "organic_score", op: "gte", value: 0.55 },
        { field: "vl_ratio", op: "gte", value: 0.7 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, organic_score: 1.3, safety_score: 1.6 },
    exit: { ...AYE_LABS_EXIT_1H, stopLossPct: -8, takeProfitPct: 5 },
    notes: "Defensive V/L board: higher organic + liquidity floors.",
  },
  {
    id: 8,
    name: "AyeLabs Trailing Hunter",
    lpShape: "bid_ask",
    binsBelow: 55,
    binsAbove: 8,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE },
    signalGate: {
      any: [{ field: "vl_ratio", op: "gte", value: 1.0 }],
      minPasses: 1,
    },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, vl_ratio: 1.5, fee_velocity: 1.3 },
    exit: {
      ...AYE_LABS_EXIT_1H,
      trailingTriggerPct: 2.5,
      trailingDropPct: 1.0,
      takeProfitPct: 9,
    },
    notes: "Tight trailing stop on V/L leaders for quick fee/rotation locks.",
  },
  {
    id: 9,
    name: "AyeLabs Mid Cap Spot",
    lpShape: "spot",
    binsBelow: 35,
    binsAbove: 35,
    screeningOverrides: {
      ...AYE_LABS_SCREENING_BASE,
      minMcap: 250_000,
      maxMcap: 5_000_000,
    },
    signalGate: {
      any: [{ field: "vl_ratio", op: "gte", value: 0.9 }],
      minPasses: 1,
    },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, vl_ratio: 1.4, safety_score: 1.5 },
    exit: { ...AYE_LABS_EXIT_1H },
    notes: "Mid-cap band on the V/L board.",
  },
  {
    id: 10,
    name: "AyeLabs High Velocity",
    lpShape: "bid_ask",
    binsBelow: 50,
    binsAbove: 10,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE, minSwaps: 1_000 },
    signalGate: {
      any: [
        { field: "vl_ratio", op: "gte", value: 1.5 },
        { field: "swap_speed", op: "gte", value: 1.3 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, vl_ratio: 1.7, swap_speed: 1.5 },
    exit: { ...AYE_LABS_EXIT_1H, takeProfitPct: 11, minHoldMin: 3 },
    notes: "High V/L or accelerating swaps; capture short fee bursts.",
  },
  {
    id: 11,
    name: "AyeLabs Safe Compound",
    lpShape: "spot",
    binsBelow: 45,
    binsAbove: 45,
    screeningOverrides: {
      ...AYE_LABS_SCREENING_BASE,
      minOrganic: 65,
      minLiquidityUsd: 10_000,
      minTvlUsd: 10_000,
      maxRiskScore: 0.45,
    },
    signalGate: {
      any: [
        { field: "organic_score", op: "gte", value: 0.6 },
        { field: "vl_ratio", op: "gte", value: 0.6 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, safety_score: 1.75, risk_reward: 2.05 },
    exit: { ...AYE_LABS_EXIT_1H, stopLossPct: -8, takeProfitPct: 4 },
    notes: "Lowest risk V/L band; still rotates within 1 hour.",
  },
  {
    id: AYE_LABS_REAL_MIRROR_STRATEGY_ID,
    name: "AyeLabs Real Mirror",
    lpShape: "bid_ask",
    binsBelow: 60,
    binsAbove: 0,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE },
    signalGate: { minPasses: 0 },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS },
    exit: { ...AYE_LABS_EXIT_1H },
    notes:
      "Pinned mirror of the live AyeLabs real agent: follows the sim PnL leader. Not evolvable.",
  },
]);

export function getAyeLabsDefaultSignalWeights() {
  return { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS };
}

export function getAyeLabsStrategies() {
  return AYE_LABS_STRATEGIES;
}

export function getAyeLabsStrategyById(strategyId) {
  const id = Number(strategyId);
  if (!Number.isInteger(id)) return null;
  return AYE_LABS_STRATEGIES.find((s) => s.id === id) ?? null;
}
