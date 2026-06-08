/**
 * LP agent experiment strategies (Meridian-inspired) for dry-run simulation only.
 * No wallet execution, no on-chain transactions.
 */

export const LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS = Object.freeze({
  organic_score: 1.15,
  fee_tvl_ratio: 1.2,
  volume: 1.1,
  holder_count: 1.05,
  smart_wallets_present: 1.15,
  narrative_quality: 1.0,
  study_win_rate: 1.1,
  hive_consensus: 0.95,
  volatility: 0.9,
  /** High volume relative to TVL — proxy for fresh / hot pools */
  freshness_score: 1.0,
});

/** Static roster: ids 0–19 (+ mirror 98). Dynamic evo agents use ids 20–97 via overrides. */
export const LP_AGENT_STATIC_STRATEGY_COUNT = 20;
export const LP_AGENT_EVOLVABLE_MIN_ID = 20;
export const LP_AGENT_EVOLVABLE_MAX_ID = 97;
/** New evo agents spawned per daily tick (mutated from sim leaders). */
export const LP_AGENT_DAILY_SPAWN_COUNT = 3;
export const LP_AGENT_MAX_STRATEGIES = 78;

export const LP_AGENT_EXPERIMENT_DEFAULTS = Object.freeze({
  /** @deprecated use maxPositionSol — kept for one-off scripts */
  depositSol: 1,
  maxRunAgeHours: 36,
  winThresholdPct: 0.5,
  minCandidateCount: 24,
  /** Simulated bank (SOL) per agent at cohort start */
  startingBankSol: 10,
  /** Max notional SOL per LP position (simulation) */
  maxPositionSol: 1,
  /** Max concurrent positions per agent (10 × 1 SOL = full deployment) */
  maxConcurrentPositions: 10,
  /** @deprecated Legacy bps fields — tx costs now use lpEconomicsModel.computeSimTransactionCostsSol */
  openFeeBps: 12,
  /** @deprecated Legacy bps fields — tx costs now use lpEconomicsModel.computeSimTransactionCostsSol */
  closeFeeBps: 12,
});

export const LP_AGENT_EXPERIMENT_STRATEGIES = Object.freeze([
  {
    id: 0,
    name: "Conservative Spot + Smart Money",
    lpShape: "spot",
    binsBelow: 30,
    binsAbove: 30,
    screeningOverrides: { minOrganic: 70, minFeeTvlRatio: 0.06, minVolume24hUsd: 75_000 },
    signalGate: {
      all: [{ field: "smart_wallets_present", op: "eq", value: true }],
      any: [
        { field: "study_win_rate", op: "gte", value: 0.5 },
        { field: "narrative_quality", op: "gte", value: 7 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, smart_wallets_present: 1.35 },
    exit: { stopLossPct: -8, takeProfitPct: 8, oorWaitMin: 30 },
    notes: "Lower volatility profile; only enters when smart money confirms.",
  },
  {
    id: 1,
    name: "Bid-Ask Aggressive Sniper",
    lpShape: "bid_ask",
    binsBelow: 60,
    binsAbove: 10,
    screeningOverrides: { minFeeTvlRatio: 0.055, minVolume24hUsd: 120_000, minOrganic: 62 },
    signalGate: {
      any: [
        { field: "volume", op: "gte", value: 0.65 },
        { field: "fee_tvl_ratio", op: "gte", value: 0.6 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, volume: 1.3, fee_tvl_ratio: 1.35 },
    exit: { stopLossPct: -12, takeProfitPct: 10, oorWaitMin: 45, minHoldMin: 30, trailingTriggerPct: 6 },
    notes: "Fast rotation strategy that prioritizes velocity + fees.",
  },
  {
    id: 2,
    name: "Curve Center Heavy",
    lpShape: "curve",
    binsBelow: 25,
    binsAbove: 25,
    screeningOverrides: { minOrganic: 66, minHolderCount: 850, minFeeTvlRatio: 0.05 },
    signalGate: {
      any: [
        { field: "organic_score", op: "gte", value: 0.65 },
        { field: "holder_count", op: "gte", value: 0.6 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, organic_score: 1.3, holder_count: 1.2 },
    exit: { stopLossPct: -9, takeProfitPct: 9, oorWaitMin: 25 },
    notes: "Balanced center liquidity for stable trend continuation.",
  },
  {
    id: 3,
    name: "Single-Sided Reseed",
    lpShape: "bid_ask",
    binsBelow: 90,
    binsAbove: 0,
    screeningOverrides: { minVolume24hUsd: 90_000, minOrganic: 63, minFeeTvlRatio: 0.055 },
    signalGate: {
      all: [{ field: "narrative_quality", op: "gte", value: 6 }],
      any: [{ field: "volume", op: "gte", value: 0.55 }],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, narrative_quality: 1.25, volume: 1.2 },
    exit: { stopLossPct: -18, takeProfitPct: 14, oorWaitMin: 20, reseedMaxCount: 3 },
    notes: "Token-side accumulation style with controlled reseed count.",
  },
  {
    id: 4,
    name: "Fee Compounding Stable",
    lpShape: "spot",
    binsBelow: 32,
    binsAbove: 32,
    screeningOverrides: { minFeeTvlRatio: 0.08, minVolume24hUsd: 180_000, minOrganic: 64 },
    signalGate: {
      all: [
        { field: "fee_tvl_ratio", op: "gte", value: 0.75 },
        { field: "volume", op: "gte", value: 0.6 },
      ],
      minPasses: 2,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, fee_tvl_ratio: 1.45, volume: 1.25 },
    exit: { stopLossPct: -10, takeProfitPct: 11, oorWaitMin: 30, claimFeesAtSol: 5 },
    notes: "High-fee pools with compounding-style periodic fee claiming simulation.",
  },
  {
    id: 5,
    name: "Multi-Layer Composite",
    lpShape: "mixed",
    binsBelow: 45,
    binsAbove: 20,
    screeningOverrides: { minFeeTvlRatio: 0.055, minOrganic: 65, minStudyWinRate: 0.52 },
    signalGate: {
      all: [{ field: "study_win_rate", op: "gte", value: 0.55 }],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, study_win_rate: 1.4, organic_score: 1.2 },
    exit: { stopLossPct: -11, takeProfitPct: 12, oorWaitMin: 25, trailingTriggerPct: 5 },
    notes: "Composite distribution with study-driven candidate preference.",
  },
  {
    id: 6,
    name: "Partial Harvest TP",
    lpShape: "spot",
    binsBelow: 34,
    binsAbove: 34,
    screeningOverrides: { minFeeTvlRatio: 0.052, minOrganic: 62, minVolume24hUsd: 100_000 },
    signalGate: {
      any: [
        { field: "narrative_quality", op: "gte", value: 7 },
        { field: "study_win_rate", op: "gte", value: 0.53 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, narrative_quality: 1.2, study_win_rate: 1.2 },
    exit: {
      stopLossPct: -10,
      takeProfitPct: 10,
      oorWaitMin: 30,
      partialHarvestPct: 50,
      trailingTriggerPct: 4,
    },
    notes: "Locks partial gains then trails remaining exposure.",
  },
  {
    id: 7,
    name: "Custom Ratio Bullish",
    lpShape: "spot",
    binsBelow: 55,
    binsAbove: 18,
    screeningOverrides: { minOrganic: 68, minFeeTvlRatio: 0.057, minVolume24hUsd: 110_000 },
    signalGate: {
      all: [{ field: "smart_wallets_present", op: "eq", value: true }],
      any: [{ field: "narrative_quality", op: "gte", value: 7 }],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, smart_wallets_present: 1.3, narrative_quality: 1.2 },
    exit: { stopLossPct: -9, takeProfitPct: 11, oorWaitMin: 20, directionalBias: "bullish_75_25" },
    notes: "Directional bullish skew with smart money confirmation.",
  },
  {
    id: 8,
    name: "Custom Ratio Bearish DCA",
    lpShape: "spot",
    binsBelow: 20,
    binsAbove: 60,
    screeningOverrides: { minFeeTvlRatio: 0.05, minVolume24hUsd: 80_000, maxPriceVsAthPct: 80 },
    signalGate: {
      any: [
        { field: "narrative_quality", op: "lte", value: 5 },
        { field: "volatility", op: "gte", value: 0.58 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, volatility: 1.2, fee_tvl_ratio: 1.15 },
    exit: { stopLossPct: -8, takeProfitPct: 9, oorWaitMin: 35, directionalBias: "bearish_25_75" },
    notes: "Defensive DCA-style profile for overheated pools pulling back.",
  },
  {
    id: 9,
    name: "Hive Consensus",
    lpShape: "spot",
    binsBelow: 30,
    binsAbove: 30,
    screeningOverrides: { minOrganic: 67, minFeeTvlRatio: 0.06, minVolume24hUsd: 105_000 },
    signalGate: {
      any: [
        { field: "smart_wallets_present", op: "eq", value: true },
        { field: "narrative_quality", op: "gte", value: 7 },
        { field: "study_win_rate", op: "gte", value: 0.55 },
      ],
      minPasses: 2,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, hive_consensus: 1.35, study_win_rate: 1.2 },
    exit: { stopLossPct: -9, takeProfitPct: 10, oorWaitMin: 28, trailingTriggerPct: 4.5 },
    notes: "Requires multi-signal agreement before opening a simulation position.",
  },
  {
    id: 10,
    name: "Wide Range Spot + Volume",
    lpShape: "spot",
    binsBelow: 42,
    binsAbove: 42,
    screeningOverrides: { minOrganic: 62, minFeeTvlRatio: 0.052, minVolume24hUsd: 95_000 },
    signalGate: {
      any: [{ field: "volume", op: "gte", value: 0.58 }, { field: "fee_tvl_ratio", op: "gte", value: 0.45 }],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, volume: 1.25, fee_tvl_ratio: 1.18 },
    exit: { stopLossPct: -10, takeProfitPct: 9, oorWaitMin: 35 },
    notes: "Wider bins for choppier pairs; prioritizes flow.",
  },
  {
    id: 11,
    name: "Tight Bid-Ask Fee Hunter",
    lpShape: "bid_ask",
    binsBelow: 38,
    binsAbove: 38,
    screeningOverrides: { minFeeTvlRatio: 0.065, minVolume24hUsd: 130_000, minOrganic: 64 },
    signalGate: {
      all: [{ field: "fee_tvl_ratio", op: "gte", value: 0.5 }],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, fee_tvl_ratio: 1.45, organic_score: 1.12 },
    exit: { stopLossPct: -11, takeProfitPct: 11, oorWaitMin: 40, minHoldMin: 30, trailingTriggerPct: 5 },
    notes: "Concentrated fee capture on high fee/TVL pools.",
  },
  {
    id: 12,
    name: "Curve + Study Alignment",
    lpShape: "curve",
    binsBelow: 22,
    binsAbove: 22,
    screeningOverrides: { minOrganic: 65, minFeeTvlRatio: 0.05, minStudyWinRate: 0.5 },
    signalGate: {
      any: [
        { field: "study_win_rate", op: "gte", value: 0.52 },
        { field: "hive_consensus", op: "gte", value: 0.45 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, study_win_rate: 1.28, hive_consensus: 1.15 },
    exit: { stopLossPct: -9, takeProfitPct: 10, oorWaitMin: 26 },
    notes: "Center curve when backtest-style signals align.",
  },
  {
    id: 13,
    name: "Narrative Momentum Spot",
    lpShape: "spot",
    binsBelow: 36,
    binsAbove: 28,
    screeningOverrides: { minVolume24hUsd: 115_000, minOrganic: 63, minFeeTvlRatio: 0.053 },
    signalGate: {
      all: [{ field: "narrative_quality", op: "gte", value: 6.5 }],
      any: [{ field: "volume", op: "gte", value: 0.52 }],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, narrative_quality: 1.32, volume: 1.15 },
    exit: { stopLossPct: -12, takeProfitPct: 12, oorWaitMin: 22 },
    notes: "Themes + volume; slightly skewed range below.",
  },
  {
    id: 14,
    name: "Mixed Layer Defensive",
    lpShape: "mixed",
    binsBelow: 40,
    binsAbove: 35,
    screeningOverrides: { minOrganic: 66, minFeeTvlRatio: 0.056, minVolume24hUsd: 100_000 },
    signalGate: {
      any: [
        { field: "smart_wallets_present", op: "eq", value: true },
        { field: "organic_score", op: "gte", value: 0.62 },
      ],
      minPasses: 1,
    },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS, smart_wallets_present: 1.22, organic_score: 1.2 },
    exit: { stopLossPct: -8, takeProfitPct: 8, oorWaitMin: 32, trailingTriggerPct: 3.5 },
    notes: "Composite shape with quality and smart-wallet tilt.",
  },
  {
    id: 15,
    name: "Fresh Token Volume Sniper",
    lpShape: "bid_ask",
    binsBelow: 72,
    binsAbove: 8,
    screeningOverrides: {
      minOrganic: 48,
      minFeeTvlRatio: 0.04,
      minVolume24hUsd: 180_000,
      maxTvlUsd: 420_000,
      minVolTvlRatio: 1.4,
    },
    signalGate: {
      any: [
        { field: "volume", op: "gte", value: 0.62 },
        { field: "freshness_score", op: "gte", value: 0.55 },
        { field: "volatility", op: "gte", value: 0.48 },
      ],
      minPasses: 2,
    },
    signalWeights: {
      ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      volume: 1.45,
      freshness_score: 1.4,
      volatility: 1.25,
      organic_score: 0.75,
    },
    exit: { stopLossPct: -20, takeProfitPct: 14, oorWaitMin: 12, minHoldMin: 10, trailingTriggerPct: 7 },
    notes: "Aggressive: young/hot pools with high 24h volume vs TVL. High risk, fast rotation.",
  },
  {
    id: 16,
    name: "Meme Launch Hunter",
    lpShape: "bid_ask",
    binsBelow: 85,
    binsAbove: 0,
    screeningOverrides: {
      minOrganic: 45,
      minFeeTvlRatio: 0.035,
      minVolume24hUsd: 220_000,
      maxTvlUsd: 280_000,
      minVolTvlRatio: 2.2,
    },
    signalGate: {
      any: [
        { field: "freshness_score", op: "gte", value: 0.65 },
        { field: "fee_tvl_ratio", op: "gte", value: 0.45 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      freshness_score: 1.55,
      volume: 1.35,
      fee_tvl_ratio: 1.3,
      organic_score: 0.65,
      study_win_rate: 0.85,
    },
    exit: { stopLossPct: -22, takeProfitPct: 16, oorWaitMin: 10, minHoldMin: 8, reseedMaxCount: 2 },
    notes: "Single-sided degen entry on new meme pairs with extreme volume velocity.",
  },
  {
    id: 17,
    name: "High Volatility YOLO Spot",
    lpShape: "spot",
    binsBelow: 48,
    binsAbove: 48,
    screeningOverrides: {
      minOrganic: 50,
      minFeeTvlRatio: 0.042,
      minVolume24hUsd: 160_000,
      maxTvlUsd: 500_000,
      minVolatilityScore: 0.55,
    },
    signalGate: {
      all: [{ field: "volatility", op: "gte", value: 0.52 }],
      any: [{ field: "volume", op: "gte", value: 0.58 }, { field: "freshness_score", op: "gte", value: 0.5 }],
      minPasses: 1,
    },
    signalWeights: {
      ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      volatility: 1.45,
      volume: 1.28,
      freshness_score: 1.15,
      organic_score: 0.8,
    },
    exit: { stopLossPct: -20, takeProfitPct: 15, oorWaitMin: 15, minHoldMin: 12, trailingTriggerPct: 8 },
    notes: "Wide spot on choppy new tokens; accepts IL for fee bursts.",
  },
  {
    id: 18,
    name: "Fee Velocity Ape",
    lpShape: "bid_ask",
    binsBelow: 55,
    binsAbove: 18,
    screeningOverrides: {
      minOrganic: 52,
      minFeeTvlRatio: 0.07,
      minVolume24hUsd: 250_000,
      maxTvlUsd: 650_000,
      minVolTvlRatio: 1.1,
    },
    signalGate: {
      all: [
        { field: "fee_tvl_ratio", op: "gte", value: 0.55 },
        { field: "volume", op: "gte", value: 0.55 },
      ],
      minPasses: 2,
    },
    signalWeights: {
      ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      fee_tvl_ratio: 1.5,
      volume: 1.38,
      freshness_score: 1.2,
      volatility: 1.1,
    },
    exit: { stopLossPct: -18, takeProfitPct: 13, oorWaitMin: 14, minHoldMin: 10, trailingTriggerPct: 6 },
    notes: "Apes into high fee/TVL + volume spikes on newer listings.",
  },
  {
    id: 19,
    name: "New Pool Degen Curve",
    lpShape: "curve",
    binsBelow: 18,
    binsAbove: 18,
    screeningOverrides: {
      minOrganic: 46,
      minFeeTvlRatio: 0.038,
      minVolume24hUsd: 200_000,
      maxTvlUsd: 350_000,
      minVolTvlRatio: 1.8,
    },
    signalGate: {
      any: [
        { field: "freshness_score", op: "gte", value: 0.6 },
        { field: "volume", op: "gte", value: 0.68 },
      ],
      minPasses: 1,
    },
    signalWeights: {
      ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
      freshness_score: 1.48,
      volume: 1.32,
      fee_tvl_ratio: 1.22,
      organic_score: 0.7,
      holder_count: 0.85,
    },
    exit: { stopLossPct: -21, takeProfitPct: 17, oorWaitMin: 11, minHoldMin: 9 },
    notes: "Tight curve on small TVL pools with outsized 24h flow — highest sim risk tier.",
  },
  {
    id: 98,
    name: "Real mirror (sim)",
    lpShape: "spot",
    binsBelow: 30,
    binsAbove: 30,
    screeningOverrides: { minOrganic: 60, minFeeTvlRatio: 0.035, minVolume24hUsd: 60_000 },
    signalGate: { minPasses: 0 },
    signalWeights: { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS },
    exit: { stopLossPct: -8, takeProfitPct: 8, oorWaitMin: 45 },
    notes:
      "Dry-run mirror of the live LP agent: follows the sim PnL leader, real pool screen, SOL pairs only. No wallet balance gate.",
  },
]);

/** Sim agent that mirrors on-chain LP selection (excluded from leader ranking). */
export const LP_REAL_MIRROR_STRATEGY_ID = 98;

export function getDefaultSignalWeights() {
  return { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS };
}

export function getLpAgentExperimentStrategies() {
  return LP_AGENT_EXPERIMENT_STRATEGIES;
}

export function getLpAgentStrategyById(strategyId) {
  const id = Number(strategyId);
  if (!Number.isInteger(id)) return null;
  return LP_AGENT_EXPERIMENT_STRATEGIES.find((s) => s.id === id) ?? null;
}
