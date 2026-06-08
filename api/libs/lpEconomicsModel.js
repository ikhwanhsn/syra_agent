/**
 * Shared LP economics model — single source of truth for paper sim and real Meteora agents.
 * Keeps bin geometry, hold/OOR floors, fee/IL math, and tx-cost estimates aligned.
 */

/** Meteora DLMM legacy Position accounts encode at most 70 bins. */
export const MAX_METEORA_POSITION_BINS = 70;

/** Real LP: minimum minutes in-range before OOR exit is allowed (collect fees first). */
export const REAL_MIN_HOLD_MINUTES = 45;

/** Real LP: floor on strategy oorWaitMin — avoids 15–20m churn seen in production. */
export const REAL_MIN_OOR_WAIT_MIN = 90;

/** Real LP: minimum bins each side after overrides (wider = fewer OOR exits). */
export const REAL_MIN_BINS_PER_SIDE = 22;

/** Claim accumulated swap fees before close when above this SOL threshold. */
export const REAL_CLAIM_FEES_BEFORE_CLOSE_SOL = 0.000_05;

/** Realistic on-chain tx costs for paper sim (priority + rent + optional sidecar slippage). */
export const LP_SIM_TX_COST = Object.freeze({
  openBaseSol: 0.004,
  closeBaseSol: 0.003,
  /** Matches LP_AGENT_REAL_SLIPPAGE_BPS default (100 = 1%). */
  sidecarSlippageBps: 100,
});

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function computePriceDriftPct(entry, current) {
  if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(current) || current <= 0) return 0;
  return (current / entry - 1) * 100;
}

export function computeFeeYieldPct(feeTvlRatio, hoursElapsed) {
  const f = toNum(feeTvlRatio, 0);
  if (f <= 0 || hoursElapsed <= 0) return 0;
  return f * (hoursElapsed / 24) * 100;
}

export function isPositionOutOfRange(activeAtOpen, activeNow, binsBelow, binsAbove) {
  const delta = toNum(activeNow, activeAtOpen) - toNum(activeAtOpen, activeNow);
  const overBelow = Math.abs(Math.min(0, delta)) > toNum(binsBelow);
  const overAbove = Math.max(0, delta) > toNum(binsAbove);
  return overBelow || overAbove;
}

/**
 * LP economics: fees accrue in-range; OOR exits realize impermanent loss from price drift.
 */
export function computeLpNetPnlPct(priceDriftPct, feeYieldPct, inRange) {
  if (inRange) {
    return priceDriftPct * 0.15 + feeYieldPct;
  }
  const ilPenalty = -Math.abs(priceDriftPct) * 0.55 - Math.max(0, -priceDriftPct) * 0.2;
  return ilPenalty + feeYieldPct * 0.35;
}

/** Widen bin range for on-chain positions — sim strategies can be too tight for mainnet volatility. */
export function applyRealBinOverrides(binsBelow, binsAbove) {
  return {
    binsBelow: Math.max(toNum(binsBelow, 0), REAL_MIN_BINS_PER_SIDE),
    binsAbove: Math.max(toNum(binsAbove, 0), REAL_MIN_BINS_PER_SIDE),
  };
}

export function mergeRealExitRules(strategyExit = {}) {
  return {
    ...strategyExit,
    minHoldMin: Math.max(toNum(strategyExit.minHoldMin, 0), REAL_MIN_HOLD_MINUTES),
    oorWaitMin: Math.max(toNum(strategyExit.oorWaitMin, 30), REAL_MIN_OOR_WAIT_MIN),
    claimFeesAtSol: REAL_CLAIM_FEES_BEFORE_CLOSE_SOL,
  };
}

/**
 * Clamp a (binsBelow, binsAbove) pair so the resulting position width fits Meteora's limit.
 */
export function clampPositionBinRange(binsBelow, binsAbove, maxWidth = MAX_METEORA_POSITION_BINS) {
  const rawBelow = Math.max(0, Math.floor(toNum(binsBelow, 0)));
  const rawAbove = Math.max(0, Math.floor(toNum(binsAbove, 0)));
  const maxSides = Math.max(0, maxWidth - 1);
  const total = rawBelow + rawAbove;

  if (total <= maxSides) {
    return { binsBelow: rawBelow, binsAbove: rawAbove, clamped: false };
  }

  if (total === 0) {
    return { binsBelow: 0, binsAbove: 0, clamped: false };
  }

  let scaledBelow = Math.floor((rawBelow * maxSides) / total);
  let scaledAbove = Math.floor((rawAbove * maxSides) / total);
  let slack = maxSides - (scaledBelow + scaledAbove);

  while (slack > 0) {
    if (rawBelow >= rawAbove) {
      scaledBelow += 1;
    } else {
      scaledAbove += 1;
    }
    slack -= 1;
  }

  return { binsBelow: scaledBelow, binsAbove: scaledAbove, clamped: true };
}

/** Apply real bin floors + Meteora width clamp (same geometry as on-chain open). */
export function resolveEffectiveBins(strategyBinsBelow, strategyBinsAbove) {
  const realBins = applyRealBinOverrides(strategyBinsBelow, strategyBinsAbove);
  return clampPositionBinRange(realBins.binsBelow, realBins.binsAbove);
}

export function shouldCloseByOor(position, detail, exitRules, hoursElapsed) {
  const activeNow = toNum(detail.activeBinId, position.activeBinAtOpen);
  const activeAtOpen = toNum(position.activeBinAtOpen, activeNow);
  if (!isPositionOutOfRange(activeAtOpen, activeNow, position.binsBelow, position.binsAbove)) {
    return false;
  }
  const minHoldMin = toNum(exitRules?.minHoldMin, REAL_MIN_HOLD_MINUTES);
  if (hoursElapsed * 60 < minHoldMin) return false;
  return hoursElapsed * 60 >= toNum(exitRules?.oorWaitMin, REAL_MIN_OOR_WAIT_MIN);
}

/** Single-sided LP shapes often require a Jupiter sidecar swap before open. */
export function strategyLikelyNeedsSidecarSwap(binsBelow, binsAbove) {
  return toNum(binsBelow) === 0 || toNum(binsAbove) === 0;
}

export function computeSimOpenCostSol(depositSol, { needsSidecarSwap = false } = {}) {
  const slippage = needsSidecarSwap
    ? (toNum(depositSol) * LP_SIM_TX_COST.sidecarSlippageBps) / 10_000
    : 0;
  return LP_SIM_TX_COST.openBaseSol + slippage;
}

export function computeSimCloseCostSol() {
  return LP_SIM_TX_COST.closeBaseSol;
}

export function computeSimTransactionCostsSol(depositSol, { needsSidecarSwap = false } = {}) {
  return {
    openFeeSol: computeSimOpenCostSol(depositSol, { needsSidecarSwap }),
    closeFeeSol: computeSimCloseCostSol(),
  };
}
