/**
 * Smart trade preparation for trading experiment lab — improves R:R on entries.
 */
import {
  experimentBuyPassesAllGates,
  experimentBuyPassesQualityGate,
} from "./experimentSignalGate.js";

/** Stretch first target to this R:R when engine target is tighter. */
export const EXPERIMENT_TARGET_RISK_REWARD = 2.5;

/**
 * Widen TP to hit target R:R; keep stop unchanged (engine levels).
 * @param {Record<string, unknown>} ex
 * @param {number} [targetRr]
 * @returns {Record<string, unknown>}
 */
export function enhanceExperimentLongLevels(ex, targetRr = EXPERIMENT_TARGET_RISK_REWARD) {
  const entry = ex.entry;
  const sl = ex.stopLoss;
  let tp = ex.firstTarget;
  if (
    typeof entry !== "number" ||
    typeof sl !== "number" ||
    typeof tp !== "number" ||
    !(entry > 0 && sl < entry)
  ) {
    return ex;
  }
  const risk = entry - sl;
  if (!(risk > 0)) return ex;
  const minTp = entry + risk * targetRr;
  if (tp < minTp) tp = minTp;
  return { ...ex, firstTarget: tp };
}

/**
 * @param {Record<string, unknown>} ex
 * @param {import("./experimentSignalGate.js").ExperimentSignalGate | null | undefined} gate
 * @param {Record<string, unknown> | null | undefined} indicatorFilter
 * @returns {Record<string, unknown> | null}
 */
export function prepareExperimentBuy(ex, gate, indicatorFilter) {
  if (ex.clearSignal !== "BUY") return null;
  if (!experimentBuyPassesAllGates(ex, gate, indicatorFilter)) return null;
  const enhanced = enhanceExperimentLongLevels(ex);
  if (!experimentBuyPassesQualityGate(enhanced, gate)) return null;
  return enhanced;
}
