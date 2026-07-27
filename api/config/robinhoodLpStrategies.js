/**
 * Robinhood Chain LP experiment strategies — paper sim on Uniswap concentrated liquidity.
 * Forked from Solana Meteora roster; USD bank, no mirror/real agent strategy.
 */
import {
  LP_AGENT_DAILY_SPAWN_COUNT,
  LP_AGENT_EVOLVABLE_MAX_ID,
  LP_AGENT_EVOLVABLE_MIN_ID,
  LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
  LP_AGENT_EXPERIMENT_STRATEGIES,
  LP_AGENT_MAX_STRATEGIES,
  LP_AGENT_STATIC_STRATEGY_COUNT,
  LP_REAL_MIRROR_STRATEGY_ID,
} from "./lpAgentExperimentStrategies.js";

export {
  LP_AGENT_DAILY_SPAWN_COUNT,
  LP_AGENT_EVOLVABLE_MAX_ID,
  LP_AGENT_EVOLVABLE_MIN_ID,
  LP_AGENT_MAX_STRATEGIES,
  LP_AGENT_STATIC_STRATEGY_COUNT,
  LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS,
};

/** Paper sim bank in USD (Robinhood Chain uses ETH gas, not SOL). */
export const ROBINHOOD_LP_EXPERIMENT_DEFAULTS = Object.freeze({
  startingBankUsd: 2000,
  maxPositionUsd: 200,
  maxConcurrentPositions: 10,
  maxRunAgeHours: 36,
  winThresholdPct: 0.5,
  minCandidateCount: 24,
  /** Fixed L2 tx cost estimates (USD) per open/close — far below Solana Meteora costs. */
  openFeeUsd: 0.025,
  closeFeeUsd: 0.018,
  /** Sidecar swap slippage budget when single-sided LP needs token leg (1%). */
  sidecarSlippageBps: 100,
});

export const ROBINHOOD_LP_STRATEGIES = Object.freeze(
  LP_AGENT_EXPERIMENT_STRATEGIES.filter((s) => s.id !== LP_REAL_MIRROR_STRATEGY_ID).map((s) => ({
    ...s,
    screeningOverrides: {
      ...(s.screeningOverrides || {}),
      // Robinhood memecoin pools often have lower TVL floors than Solana blue chips.
      minTvlUsd: Math.min(s.screeningOverrides?.minTvlUsd ?? 220_000, 180_000),
    },
    notes: s.notes
      ? `${s.notes} · Robinhood Chain Uniswap sim`
      : "Robinhood Chain Uniswap concentrated-liquidity sim",
  })),
);

export function getRobinhoodLpStrategies() {
  return ROBINHOOD_LP_STRATEGIES;
}

export function getRobinhoodLpStrategyById(strategyId) {
  const id = Number(strategyId);
  if (!Number.isInteger(id)) return null;
  return ROBINHOOD_LP_STRATEGIES.find((s) => s.id === id) ?? null;
}

export function getRobinhoodDefaultSignalWeights() {
  return { ...LP_AGENT_EXPERIMENT_DEFAULT_SIGNAL_WEIGHTS };
}
