/**
 * Optional per-agent gating for trading experiment BUY persistence.
 * Uses CryptoAnalysisEngine quickSummary.confidence (LOW | MEDIUM | HIGH).
 * Indicator filters: {@link validateIndicatorFilter} from indicatorFilters.js.
 */

import { validateIndicatorFilter } from "./indicatorFilters.js";

/** @typedef {{ minConfidence?: "LOW" | "MEDIUM" | "HIGH" }} ExperimentSignalGate */

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
