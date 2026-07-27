/**
 * Outcome / completed-work pricing (services dollar, not per-call software dollar).
 * Agents pay when a job is proven done via x402 settlement.
 */

/** Performance fee on positive realized PnL (basis points, 1000 = 10%). */
export const OUTCOME_DEFAULT_PERFORMANCE_FEE_BPS = 1500;

/** Minimum performance fee charge in USD. */
export const OUTCOME_MIN_PERFORMANCE_FEE_USD = 0.05;

/** Take rate on managed capital per billing period (bps per month). */
export const OUTCOME_DEFAULT_AUM_FEE_BPS_MONTHLY = 25;

/** Minimum AUM fee charge in USD per period. */
export const OUTCOME_MIN_AUM_FEE_USD = 0.10;

/** Flat fee per completed job cycle (USD). */
export const OUTCOME_FLAT_CYCLE_FEE_USD = 0.25;

/**
 * Per-product pricing overrides.
 * @type {Record<string, { performanceFeeBps?: number; aumFeeBpsMonthly?: number; flatCycleFeeUsd?: number; billingModel: 'performance' | 'aum' | 'flat' | 'hybrid' }>}
 */
export const OUTCOME_PRODUCT_PRICING = Object.freeze({
  robinhood_lp_autopilot: Object.freeze({
    billingModel: "hybrid",
    performanceFeeBps: 2000,
    aumFeeBpsMonthly: 30,
    flatCycleFeeUsd: 0.15,
  }),
  lp_autopilot_solana: Object.freeze({
    billingModel: "performance",
    performanceFeeBps: 1500,
    aumFeeBpsMonthly: 25,
    flatCycleFeeUsd: 0.20,
  }),
  treasury_autopilot: Object.freeze({
    billingModel: "aum",
    performanceFeeBps: 1000,
    aumFeeBpsMonthly: 20,
    flatCycleFeeUsd: 0.25,
  }),
  yield_autopilot: Object.freeze({
    billingModel: "performance",
    performanceFeeBps: 1200,
    aumFeeBpsMonthly: 15,
    flatCycleFeeUsd: 0.20,
  }),
});

/**
 * Compute outcome fee for a completed job.
 * @param {string} productId
 * @param {{ realizedPnlUsd?: number; managedCapitalUsd?: number; billingPeriodDays?: number }} metrics
 * @returns {{ totalUsd: number; breakdown: Record<string, number>; billingModel: string }}
 */
export function computeOutcomeFee(productId, metrics = {}) {
  const pricing = OUTCOME_PRODUCT_PRICING[productId] ?? {
    billingModel: "performance",
    performanceFeeBps: OUTCOME_DEFAULT_PERFORMANCE_FEE_BPS,
    aumFeeBpsMonthly: OUTCOME_DEFAULT_AUM_FEE_BPS_MONTHLY,
    flatCycleFeeUsd: OUTCOME_FLAT_CYCLE_FEE_USD,
  };

  const realizedPnl = Math.max(0, Number(metrics.realizedPnlUsd) || 0);
  const managedCapital = Math.max(0, Number(metrics.managedCapitalUsd) || 0);
  const periodDays = Math.max(1, Number(metrics.billingPeriodDays) || 30);

  const breakdown = {};
  let totalUsd = 0;

  if (pricing.billingModel === "performance" || pricing.billingModel === "hybrid") {
    const perfFee = (realizedPnl * (pricing.performanceFeeBps ?? OUTCOME_DEFAULT_PERFORMANCE_FEE_BPS)) / 10_000;
    if (perfFee > 0) {
      breakdown.performanceFeeUsd = Math.max(perfFee, OUTCOME_MIN_PERFORMANCE_FEE_USD);
      totalUsd += breakdown.performanceFeeUsd;
    }
  }

  if (pricing.billingModel === "aum" || pricing.billingModel === "hybrid") {
    const monthlyBps = pricing.aumFeeBpsMonthly ?? OUTCOME_DEFAULT_AUM_FEE_BPS_MONTHLY;
    const aumFee = (managedCapital * monthlyBps * periodDays) / (10_000 * 30);
    if (aumFee > 0) {
      breakdown.aumFeeUsd = Math.max(aumFee, OUTCOME_MIN_AUM_FEE_USD);
      totalUsd += breakdown.aumFeeUsd;
    }
  }

  if (pricing.billingModel === "flat" || pricing.billingModel === "hybrid") {
    breakdown.flatCycleFeeUsd = pricing.flatCycleFeeUsd ?? OUTCOME_FLAT_CYCLE_FEE_USD;
    totalUsd += breakdown.flatCycleFeeUsd;
  }

  return {
    totalUsd: Math.round(totalUsd * 1_000_000) / 1_000_000,
    breakdown,
    billingModel: pricing.billingModel,
  };
}
