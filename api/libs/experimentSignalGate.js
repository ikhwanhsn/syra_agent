/**
 * Optional per-agent gating for trading experiment BUY persistence.
 * Uses CryptoAnalysisEngine quickSummary.confidence (LOW | MEDIUM | HIGH).
 * Agents without `experimentGate` behave as before (any valid BUY persists).
 */

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
