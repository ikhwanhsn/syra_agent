/**
 * Optional per-agent gating for trading experiment BUY persistence.
 * Uses CryptoAnalysisEngine quickSummary.confidence (LOW | MEDIUM | HIGH).
 * Indicator filters: {@link validateIndicatorFilter} from indicatorFilters.js.
 */

import { validateIndicatorFilter } from "./indicatorFilters.js";

/** Minimum reward:risk on entry (TP distance / SL distance). */
export const EXPERIMENT_MIN_RISK_REWARD = 2;

/** @typedef {{
 *   minConfidence?: "LOW" | "MEDIUM" | "HIGH";
 *   minRiskReward?: number;
 *   minAdx?: number;
 *   requireTrendMomentumAlign?: boolean;
 * }} ExperimentSignalGate */

const RANK = Object.freeze({ LOW: 0, MEDIUM: 1, HIGH: 2 });

/**
 * @param {string | null | undefined} c
 * @returns {number}
 */
function confidenceRank(c) {
  const k = String(c ?? "LOW").trim().toUpperCase();
  return RANK[k] ?? 0;
}

/**
 * @param {{ confidence?: string | null }} extracted - from {@link extractSignalFields}
 * @param {ExperimentSignalGate | undefined | null} gate
 * @returns {boolean}
 */
/**
 * @param {Record<string, unknown>} ex
 * @returns {number | null}
 */
export function computeLongRiskReward(ex) {
  const entry = ex.entry;
  const sl = ex.stopLoss;
  const tp = ex.firstTarget;
  if (
    typeof entry !== "number" ||
    typeof sl !== "number" ||
    typeof tp !== "number" ||
    !(entry > 0 && sl < entry && tp > entry)
  ) {
    return null;
  }
  const risk = entry - sl;
  if (!(risk > 0)) return null;
  return (tp - entry) / risk;
}

/**
 * @param {Record<string, unknown>} ex
 * @param {ExperimentSignalGate | undefined | null} gate
 * @returns {boolean}
 */
export function experimentBuyPassesQualityGate(ex, gate) {
  if (ex.clearSignal !== "BUY") return true;
  if (gate?.requireTrendMomentumAlign) {
    if (ex.trendClearSignal !== "BUY" || ex.momentumClearSignal !== "BUY") return false;
  }
  const minAdx = gate?.minAdx;
  if (minAdx != null && Number.isFinite(Number(minAdx))) {
    if (ex.adxValue == null || ex.adxValue < Number(minAdx)) return false;
  }
  const minRr = gate?.minRiskReward ?? EXPERIMENT_MIN_RISK_REWARD;
  const rr = computeLongRiskReward(ex);
  if (rr == null || rr < minRr) return false;
  return true;
}

export function experimentBuyPassesSmartGate(extracted, gate) {
  if (extracted.clearSignal !== "BUY") return true;
  if (gate == null || gate.minConfidence == null) return true;
  return confidenceRank(extracted.confidence) >= confidenceRank(gate.minConfidence);
}

/**
 * @param {Record<string, unknown>} extracted
 * @param {Record<string, unknown> | null | undefined} filter
 * @returns {boolean}
 */
export function experimentBuyPassesIndicatorFilter(extracted, filter) {
  if (extracted.clearSignal !== "BUY") return true;
  return validateIndicatorFilter(filter, extracted);
}

/**
 * @param {Parameters<typeof experimentBuyPassesSmartGate>[0]} extracted
 * @param {ExperimentSignalGate | undefined | null} gate
 * @param {Record<string, unknown> | null | undefined} indicatorFilter
 * @returns {boolean}
 */
export function experimentBuyPassesAllGates(extracted, gate, indicatorFilter) {
  if (!experimentBuyPassesSmartGate(extracted, gate)) return false;
  if (!experimentBuyPassesIndicatorFilter(extracted, indicatorFilter)) return false;
  return true;
}
