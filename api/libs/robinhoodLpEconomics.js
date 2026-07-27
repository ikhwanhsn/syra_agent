/**
 * Robinhood Chain LP sim economics — USD tx costs on cheap L2 gas.
 */
import { ROBINHOOD_LP_EXPERIMENT_DEFAULTS } from "../config/robinhoodLpStrategies.js";
import { strategyLikelyNeedsSidecarSwap } from "./lpEconomicsModel.js";

export function computeRobinhoodSimOpenCostUsd(depositUsd, { needsSidecarSwap = false } = {}) {
  const dep = Number(depositUsd) || 0;
  const slippage = needsSidecarSwap
    ? (dep * ROBINHOOD_LP_EXPERIMENT_DEFAULTS.sidecarSlippageBps) / 10_000
    : 0;
  return ROBINHOOD_LP_EXPERIMENT_DEFAULTS.openFeeUsd + slippage;
}

export function computeRobinhoodSimCloseCostUsd() {
  return ROBINHOOD_LP_EXPERIMENT_DEFAULTS.closeFeeUsd;
}

export function computeRobinhoodSimTransactionCostsUsd(depositUsd, { needsSidecarSwap = false } = {}) {
  return {
    openFeeUsd: computeRobinhoodSimOpenCostUsd(depositUsd, { needsSidecarSwap }),
    closeFeeUsd: computeRobinhoodSimCloseCostUsd(),
  };
}

export function robinhoodStrategyNeedsSidecarSwap(binsBelow, binsAbove) {
  return strategyLikelyNeedsSidecarSwap(binsBelow, binsAbove);
}
