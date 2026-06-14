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
export const REAL_MIN_BINS_PER_SIDE = 28;

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

function clamp01(n) {
  return Math.max(0, Math.min(1, Number(n) || 0));
}

/** Minimum expected-fee : IL-budget ratio for sim pool eligibility. */
export const LP_MIN_SIM_RISK_REWARD_RATIO = 0.38;

/** Extreme-risk pools need a higher reward hurdle. */
export const LP_MIN_EXTREME_RISK_REWARD_RATIO = 0.72;

/** Real LP: stricter expected-fee : IL-budget hurdle than sim — real chain costs and slippage. */
export const LP_MIN_REAL_RISK_REWARD_RATIO = 0.55;

/** Real LP: hard price stop multiplier vs strategy stop — caps catastrophic IL even when fees offset the soft stop. */
export const LP_REAL_HARD_STOP_MULT = 1.4;

/** Real LP: expected fees over the projected hold must exceed round-trip chain costs by this factor before open. */
export const LP_REAL_MIN_FEE_TO_COST_RATIO = 1.6;

export function computePriceDriftPct(entry, current) {
  if (!Number.isFinite(entry) || entry <= 0 || !Number.isFinite(current) || current <= 0) return 0;
  return (current / entry - 1) * 100;
}

/** @param {number} feeTvlRatio Daily fee/TVL as decimal ratio (fees_24h / TVL), e.g. 0.00448 = 0.448%/day */
export function computeFeeYieldPct(feeTvlRatio, hoursElapsed) {
  const f = toNum(feeTvlRatio, 0);
  if (f <= 0 || hoursElapsed <= 0) return 0;
  return f * (hoursElapsed / 24) * 100;
}

/**
 * DLMM active-bin share boost — narrow positions on hot, thin pools earn above pool-average fee/TVL.
 * @param {{ volTvlRatio?: number, tvlUsd?: number, binsBelow?: number, binsAbove?: number, inRange?: boolean }} params
 */
export function computeDlmmFeeShareMultiplier({
  volTvlRatio = 0,
  tvlUsd = 0,
  binsBelow = 30,
  binsAbove = 30,
  inRange = true,
} = {}) {
  if (!inRange) return 0.25;
  const width = Math.max(1, toNum(binsBelow) + toNum(binsAbove) + 1);
  const narrowBoost = Math.min(3.5, Math.max(1, 42 / width));
  const hotBoost = Math.min(2.8, 1 + Math.log1p(Math.max(0, toNum(volTvlRatio))) * 0.38);
  const tvl = toNum(tvlUsd);
  const smallPoolBoost =
    tvl > 0 && tvl < 280_000 ? Math.min(2.2, 1 + 110_000 / Math.max(tvl, 18_000)) : 1;
  return narrowBoost * hotBoost * smallPoolBoost;
}

/**
 * Pool IL / churn risk proxy (0–1). Higher = more impermanent-loss exposure.
 * @param {{ tvlUsd?: number, volume24hUsd?: number, feeTvlRatio?: number, volatilityScore?: number, binsBelow?: number, binsAbove?: number }} params
 */
export function computePoolRiskScore(params = {}) {
  const tvl = toNum(params.tvlUsd);
  const vol = toNum(params.volume24hUsd);
  const feeTvl = toNum(params.feeTvlRatio);
  const volTvl = tvl > 0 ? vol / tvl : vol > 0 ? 8 : 0;
  const volScore = clamp01(toNum(params.volatilityScore, 0.45));

  const thinTvlRisk = clamp01(1 - (tvl - 12_000) / 380_000);
  const churnRisk = clamp01(volTvl / 14);
  const feeSpikeRisk = clamp01(feeTvl / 0.07);
  const binsBelow = toNum(params.binsBelow, 30);
  const binsAbove = toNum(params.binsAbove, 30);
  const singleSidedRisk = binsBelow === 0 || binsAbove === 0 ? 0.22 : 0;
  const narrowRangeRisk = binsBelow + binsAbove < 36 ? 0.12 : 0;

  return clamp01(
    thinTvlRisk * 0.26 +
      churnRisk * 0.3 +
      feeSpikeRisk * 0.2 +
      volScore * 0.14 +
      singleSidedRisk +
      narrowRangeRisk,
  );
}

export function classifyPoolRiskTier(riskScore) {
  const r = clamp01(riskScore);
  if (r < 0.32) return "low";
  if (r < 0.52) return "medium";
  if (r < 0.72) return "high";
  return "extreme";
}

/**
 * Risk/reward profile for LP pool selection and adaptive exits.
 * @param {{ tvlUsd?: number, volume24hUsd?: number, feeTvlRatio?: number, volatilityScore?: number, binsBelow?: number, binsAbove?: number, holdHours?: number }} params
 */
export function computeLpRiskRewardProfile(params = {}) {
  const holdHours = Math.max(0.5, toNum(params.holdHours, 4));
  const riskScore = computePoolRiskScore(params);
  const tier = classifyPoolRiskTier(riskScore);
  const feeTvl = toNum(params.feeTvlRatio);
  const tvl = toNum(params.tvlUsd);
  const vol = toNum(params.volume24hUsd);
  const volTvl = tvl > 0 ? vol / tvl : 0;

  const feeShareMult = computeDlmmFeeShareMultiplier({
    volTvlRatio: volTvl,
    tvlUsd: tvl,
    binsBelow: params.binsBelow,
    binsAbove: params.binsAbove,
    inRange: true,
  });
  const adjustedMult = applyRiskAdjustedFeeMultiplier(feeShareMult, riskScore);
  const expectedFeePct = computeFeeYieldPct(feeTvl, holdHours) * adjustedMult;
  const ilBudgetPct =
    (0.75 + riskScore * 4.2 + Math.log1p(Math.max(0, volTvl)) * 0.58) * (holdHours / 24);
  const ratio = expectedFeePct / Math.max(ilBudgetPct, 0.12);

  return {
    riskScore,
    tier,
    expectedFeePct,
    ilBudgetPct,
    ratio,
    feeShareMult: adjustedMult,
  };
}

/** Cap fee boost on degen pools — keeps sim PnL realistic while still rewarding hot pools. */
export function applyRiskAdjustedFeeMultiplier(rawMultiplier, riskScore) {
  const mult = toNum(rawMultiplier, 1);
  const risk = clamp01(riskScore);
  if (risk >= 0.72) return mult * 0.62;
  if (risk >= 0.52) return mult * 0.8;
  if (risk >= 0.32) return mult * 0.92;
  return mult;
}

/**
 * Pool-aware exits: tighter stops on risky pools, take-profit scaled to fee potential, min R:R ~1.4:1.
 */
export function resolveAdaptiveExitRules(strategyExit = {}, poolContext = {}, binsBelow = 30, binsAbove = 30) {
  const rr = computeLpRiskRewardProfile({
    ...poolContext,
    binsBelow,
    binsAbove,
    holdHours: 4,
  });
  const base = strategyExit && typeof strategyExit === "object" ? { ...strategyExit } : {};

  let stopLossPct = toNum(base.stopLossPct, -12);
  let takeProfitPct = toNum(base.takeProfitPct, 10);
  let minHoldMin = toNum(base.minHoldMin, 0);
  let oorWaitMin = toNum(base.oorWaitMin, 30);
  let trailingTriggerPct = toNum(base.trailingTriggerPct, 0);

  if (rr.tier === "extreme") {
    stopLossPct = Math.max(stopLossPct, -7);
    takeProfitPct = Math.min(takeProfitPct, Math.max(3.5, rr.expectedFeePct * 2.2));
    minHoldMin = Math.max(minHoldMin, 22);
    oorWaitMin = Math.max(oorWaitMin, 18);
    trailingTriggerPct = trailingTriggerPct > 0 ? Math.min(trailingTriggerPct, takeProfitPct * 0.65) : takeProfitPct * 0.55;
  } else if (rr.tier === "high") {
    stopLossPct = Math.max(stopLossPct, -9);
    takeProfitPct = Math.min(takeProfitPct, Math.max(4.5, rr.expectedFeePct * 2.8));
    minHoldMin = Math.max(minHoldMin, 18);
    oorWaitMin = Math.max(oorWaitMin, 24);
    trailingTriggerPct =
      trailingTriggerPct > 0 ? Math.min(trailingTriggerPct, takeProfitPct * 0.7) : takeProfitPct * 0.5;
  } else if (rr.tier === "medium") {
    stopLossPct = Math.max(stopLossPct, -11);
    takeProfitPct = Math.max(takeProfitPct, Math.min(rr.expectedFeePct * 3.2, 12));
    trailingTriggerPct = trailingTriggerPct > 0 ? trailingTriggerPct : takeProfitPct * 0.45;
  } else {
    stopLossPct = Math.min(stopLossPct, -10);
    takeProfitPct = Math.max(takeProfitPct, 5.5);
    trailingTriggerPct = trailingTriggerPct > 0 ? trailingTriggerPct : takeProfitPct * 0.4;
  }

  const stopAbs = Math.abs(stopLossPct);
  takeProfitPct = Math.max(takeProfitPct, stopAbs * 1.45);
  const trailingGivebackPct = Math.max(
    toNum(base.trailingGivebackPct, 0),
    Math.max(1.2, takeProfitPct * 0.32),
  );

  return {
    ...base,
    stopLossPct,
    takeProfitPct,
    minHoldMin,
    oorWaitMin,
    trailingTriggerPct,
    trailingGivebackPct,
    riskTier: rr.tier,
    riskRewardRatio: rr.ratio,
    riskScore: rr.riskScore,
  };
}

export function isPositionOutOfRange(activeAtOpen, activeNow, binsBelow, binsAbove) {
  const delta = toNum(activeNow, activeAtOpen) - toNum(activeAtOpen, activeNow);
  const overBelow = Math.abs(Math.min(0, delta)) > toNum(binsBelow);
  const overAbove = Math.max(0, delta) > toNum(binsAbove);
  return overBelow || overAbove;
}

/**
 * LP economics: fees accrue in-range; OOR exits realize impermanent loss from price drift.
 * @param {number} [riskScore] 0–1 pool risk — scales IL on out-of-range exits.
 */
export function computeLpNetPnlPct(priceDriftPct, feeYieldPct, inRange, riskScore = 0.35) {
  if (inRange) {
    return priceDriftPct * 0.15 + feeYieldPct;
  }
  const ilScale = 1 + clamp01(riskScore) * 0.7;
  const ilPenalty =
    (-Math.abs(priceDriftPct) * 0.45 - Math.max(0, -priceDriftPct) * 0.2) * ilScale;
  return ilPenalty + feeYieldPct * 0.55;
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
