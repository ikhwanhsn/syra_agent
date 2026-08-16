/**
 * AyeLabs experiment desk — GMGN V/L radar screening + Meteora DLMM paper/real.
 * Strategy gates ported from ayehuasca/gmgn-vl-radar (Solana trending V/L board).
 *
 * Conservative fee-farming: two-sided ranges, 8h holds, EV gate before open.
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

/**
 * Hold window used when projecting expected fees for the paper open EV gate.
 * 8h cannot cover calibrated round-trip costs even on 20%/day fee pools; 12h matches the LP desk.
 */
export const AYE_LABS_EV_HOLD_HOURS = 12;
/**
 * Expected *calibrated* fees must cover round-trip costs by this multiple before open.
 * 1.0 is paper break-even after the 0.22 fee haircut. Uncalibrated 2x (real LP desk) still
 * loses on paper because resolve applies the haircut.
 */
export const AYE_LABS_MIN_FEE_TO_COST_RATIO = 1.0;

/** LP desk signal weights plus radar metrics. Fee velocity / fee-TVL outrank raw V/L chase. */
export const AYE_LABS_DEFAULT_SIGNAL_WEIGHTS = Object.freeze({
  ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
  fee_velocity: 1.85,
  fee_tvl_ratio: 1.7,
  safety_score: 1.45,
  volume: 1.2,
  vl_ratio: 0.85,
  flow_ratio: 1.05,
  swap_speed: 1.0,
});

export const AYE_LABS_DEFAULTS = Object.freeze({
  startingBankSol: 10,
  maxPositionSol: 1,
  maxConcurrentPositions: 3,
  /** Fee-farm hold: long enough for calibrated fees to cover round-trip costs. */
  maxRunAgeHours: 12,
  winThresholdPct: 0.5,
  positionSizePct: 0.35,
  gasReserve: 0.2,
  deployAmountSol: 0.5,
  openFeeBps: 12,
  closeFeeBps: 12,
});

/**
 * Solana GMGN V/L radar gates (from gmgn-vl-radar TREND_CMD / filter-query.json).
 * Liquidity $5k, smart degen 2. Creator close is NOT required.
 */
export const AYE_LABS_SCREENING_BASE = Object.freeze({
  minLiquidityUsd: 5_000,
  /** Alias for LP screening helpers that read TVL floors. */
  minTvlUsd: 5_000,
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
  /** Authored as Meteora percent points (0.05 = 0.05%/day) for LP screening helpers. */
  minFeeTvlRatio: 0.05,
  minVolume24hUsd: 5_000,
  minOrganic: 50,
});

/** Shared 12-hour fee-farm exit. Adaptive rules still raise TP vs SL. */
const AYE_LABS_EXIT_FEE = Object.freeze({
  stopLossPct: -10,
  takeProfitPct: 6,
  oorWaitMin: 30,
  trailingTriggerPct: 4,
  trailingDropPct: 2,
  minHoldMin: 30,
  maxHoldMin: 720,
});

export const AYE_LABS_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: "AyeLabs Fee Core",
    lpShape: "spot",
    binsBelow: 40,
    binsAbove: 40,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE },
    signalGate: {
      any: [
        { field: "vl_ratio", op: "gte", value: 0.8 },
        { field: "volume", op: "gte", value: 0.5 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS,
      fee_velocity: 1.95,
      fee_tvl_ratio: 1.8,
    },
    exit: { ...AYE_LABS_EXIT_FEE },
    notes: "Primary fee farm: two-sided spot, 12h hold, rank by fee velocity not raw V/L.",
  },
  {
    id: 1,
    name: "AyeLabs FLOW Spike",
    lpShape: "spot",
    binsBelow: 38,
    binsAbove: 38,
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
      swap_speed: 1.4,
      flow_ratio: 1.35,
      fee_velocity: 1.7,
    },
    exit: { ...AYE_LABS_EXIT_FEE, takeProfitPct: 8 },
    notes: "Bullish FLOW spike on a two-sided range: S×≥1.3, FLOW≥1.2, buy-led 5m direction.",
  },
  {
    id: 2,
    name: "AyeLabs Balanced Bid-Ask",
    lpShape: "bid_ask",
    binsBelow: 35,
    binsAbove: 35,
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
    signalWeights: {
      ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS,
      flow_ratio: 1.15,
      volume: 1.25,
      safety_score: 1.5,
    },
    exit: { ...AYE_LABS_EXIT_FEE, stopLossPct: -12, takeProfitPct: 7 },
    notes: "Busy swaps + bearish FLOW on a two-sided bid-ask (no single-sided IL trap).",
  },
  {
    id: 3,
    name: "AyeLabs Spot Wide V/L",
    lpShape: "spot",
    binsBelow: 40,
    binsAbove: 40,
    screeningOverrides: {
      ...AYE_LABS_SCREENING_BASE,
      minLiquidityUsd: 8_000,
      minTvlUsd: 8_000,
    },
    signalGate: {
      any: [{ field: "vl_ratio", op: "gte", value: 1.0 }],
      minPasses: 1,
    },
    signalWeights: {
      ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS,
      safety_score: 1.55,
      fee_tvl_ratio: 1.65,
    },
    exit: { ...AYE_LABS_EXIT_FEE, stopLossPct: -9, takeProfitPct: 5 },
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
    signalWeights: {
      ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS,
      holder_count: 1.2,
      fee_velocity: 1.6,
    },
    exit: { ...AYE_LABS_EXIT_FEE },
    notes: "Center-heavy curve on V/L board names with more holders.",
  },
  {
    id: 5,
    name: "AyeLabs Explosive S×",
    lpShape: "spot",
    binsBelow: 36,
    binsAbove: 36,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE },
    signalGate: {
      all: [
        { field: "swap_speed", op: "gte", value: 2.0 },
        { field: "flow_bullish", op: "eq", value: true },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS,
      swap_speed: 1.5,
      flow_ratio: 1.3,
      fee_velocity: 1.75,
    },
    exit: { ...AYE_LABS_EXIT_FEE, takeProfitPct: 9, stopLossPct: -9 },
    notes: "Explosive swap acceleration (S×≥2) with bullish FLOW, two-sided spot.",
  },
  {
    id: 6,
    name: "AyeLabs Hot FLOW",
    lpShape: "spot",
    binsBelow: 38,
    binsAbove: 38,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE },
    signalGate: {
      all: [
        { field: "flow_ratio", op: "gte", value: 1.2 },
        { field: "vl_ratio", op: "gte", value: 1.0 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS,
      flow_ratio: 1.4,
      fee_velocity: 1.7,
    },
    exit: { ...AYE_LABS_EXIT_FEE, takeProfitPct: 7 },
    notes: "Hot FLOW (≥1.2) plus solid V/L on a two-sided 12h hold.",
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
    signalWeights: {
      ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS,
      organic_score: 1.3,
      safety_score: 1.7,
    },
    exit: { ...AYE_LABS_EXIT_FEE, stopLossPct: -8, takeProfitPct: 5 },
    notes: "Defensive V/L board: higher organic + liquidity floors.",
  },
  {
    id: 8,
    name: "AyeLabs Trailing Hunter",
    lpShape: "spot",
    binsBelow: 40,
    binsAbove: 40,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE },
    signalGate: {
      any: [{ field: "vl_ratio", op: "gte", value: 1.0 }],
      minPasses: 1,
    },
    signalWeights: {
      ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS,
      fee_velocity: 1.65,
      fee_tvl_ratio: 1.55,
    },
    exit: {
      ...AYE_LABS_EXIT_FEE,
      trailingTriggerPct: 2.5,
      trailingDropPct: 1.0,
      takeProfitPct: 7,
    },
    notes: "Tight trailing stop on fee-rich V/L names; two-sided spot.",
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
    signalWeights: {
      ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS,
      safety_score: 1.55,
      fee_tvl_ratio: 1.55,
    },
    exit: { ...AYE_LABS_EXIT_FEE },
    notes: "Mid-cap band on the V/L board.",
  },
  {
    id: 10,
    name: "AyeLabs High Velocity",
    lpShape: "spot",
    binsBelow: 38,
    binsAbove: 38,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE, minSwaps: 1_000 },
    signalGate: {
      any: [
        { field: "vl_ratio", op: "gte", value: 1.5 },
        { field: "swap_speed", op: "gte", value: 1.3 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS,
      fee_velocity: 1.8,
      swap_speed: 1.35,
    },
    exit: { ...AYE_LABS_EXIT_FEE, takeProfitPct: 8 },
    notes: "High V/L or accelerating swaps; two-sided range, 12h fee capture.",
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
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS, safety_score: 1.8, risk_reward: 2.05 },
    exit: { ...AYE_LABS_EXIT_FEE, stopLossPct: -8, takeProfitPct: 4 },
    notes: "Lowest risk V/L band; two-sided spot, 12h compound.",
  },
  {
    id: AYE_LABS_REAL_MIRROR_STRATEGY_ID,
    name: "AyeLabs Real Mirror",
    lpShape: "spot",
    binsBelow: 40,
    binsAbove: 40,
    screeningOverrides: { ...AYE_LABS_SCREENING_BASE },
    signalGate: { minPasses: 0 },
    signalWeights: { ...AYE_LABS_DEFAULT_SIGNAL_WEIGHTS },
    exit: { ...AYE_LABS_EXIT_FEE },
    notes:
      "Pinned mirror of the AyeLabs sim PnL leader (positive-net only). Not evolvable.",
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
