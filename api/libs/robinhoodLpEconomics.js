/**
 * Robinhood Chain LP sim economics — USD tx costs on cheap L2 gas.
 */
import { ROBINHOOD_LP_EXPERIMENT_DEFAULTS } from "../config/robinhoodLpStrategies.js";
import { binsToTickRange } from "../config/robinhoodChain.js";
import { strategyLikelyNeedsSidecarSwap } from "./lpEconomicsModel.js";

/** Uniswap v3: tick is in range when tickLower <= tick < tickUpper. */
function isTickInRange(currentTick, tickLower, tickUpper) {
  return currentTick >= tickLower && currentTick < tickUpper;
}

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Paper-sim fee haircut for Robinhood Uniswap v3.
 * Do not reuse Solana Meteora's LP_SIM_FEE_CALIBRATION_MULT=0.22 default —
 * that calibration was against Meteora closes and makes RH fee income vanish.
 *
 * Default 0.65 is intentionally conservative vs prior 0.9: concentrated-liquidity
 * fee share is overstated by the shared DLMM-style multiplier. Paper PnL remains
 * untrusted for Earn unlock until calibrated against live Uniswap fee growth.
 * Override with ROBINHOOD_LP_SIM_FEE_CALIBRATION_MULT (0–1.5].
 */
export function getRobinhoodLpSimFeeCalibrationMult() {
  const raw = Number(process.env.ROBINHOOD_LP_SIM_FEE_CALIBRATION_MULT);
  if (Number.isFinite(raw) && raw > 0 && raw <= 1.5) return raw;
  return 0.65;
}

/** Tick spacing stored as binStep on RH paper runs (Uniswap fee-tier spacing). */
export function getRobinhoodSimTickSpacing(runOrPool) {
  return Math.max(1, Math.floor(toNum(runOrPool?.binStep, 60)));
}

/**
 * Whether a RH paper position is still in its Uniswap tick range.
 * Sim stores activeBinId as a price-derived tick; binsBelow/Above are strategy
 * "bin" counts that must be multiplied by tickSpacing (see binsToTickRange).
 */
export function isRobinhoodSimPositionInRange(run, detail) {
  const openTick = toNum(run?.activeBinAtOpen);
  const nowTick = toNum(detail?.activeBinId, openTick);
  const range = binsToTickRange({
    currentTick: openTick,
    tickSpacing: getRobinhoodSimTickSpacing(run),
    binsBelow: run?.binsBelow,
    binsAbove: run?.binsAbove,
  });
  return isTickInRange(nowTick, range.tickLower, range.tickUpper);
}

/**
 * OOR exit for RH paper — same hold/wait floors as shared shouldCloseByOor,
 * but range check uses Uniswap tick geometry instead of Meteora bin ids.
 */
export function shouldCloseRobinhoodSimByOor(run, detail, exitRules, hoursElapsed) {
  if (isRobinhoodSimPositionInRange(run, detail)) return false;
  const minHoldMin = toNum(exitRules?.minHoldMin, 45);
  if (hoursElapsed * 60 < minHoldMin) return false;
  return hoursElapsed * 60 >= toNum(exitRules?.oorWaitMin, 12);
}

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
