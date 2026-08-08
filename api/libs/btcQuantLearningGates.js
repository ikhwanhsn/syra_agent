/**
 * Apply BTC quant real-evolution thresholdOverrides to paper/real signal paths.
 * Learning is batch (not per-trade ML); these helpers make stored overrides enforceable.
 */

/** @type {Readonly<Record<string, number>>} */
export const BTC_QUANT_CONFIDENCE_RANK = Object.freeze({
  LOW: 1,
  MEDIUM: 2,
  MED: 2,
  HIGH: 3,
});

/**
 * @param {unknown} confidence
 * @returns {number}
 */
export function btcQuantConfidenceRank(confidence) {
  if (confidence == null || confidence === "") return 0;
  const key = String(confidence).trim().toUpperCase();
  return BTC_QUANT_CONFIDENCE_RANK[key] ?? 0;
}

/**
 * True when signal confidence meets (or exceeds) learned minConfidence.
 * Missing / empty minConfidence does not block.
 *
 * @param {unknown} confidence
 * @param {unknown} minConfidence
 */
export function meetsBtcQuantMinConfidence(confidence, minConfidence) {
  if (minConfidence == null || minConfidence === "" || minConfidence === false) return true;
  const need = btcQuantConfidenceRank(minConfidence);
  if (need <= 0) return true;
  return btcQuantConfidenceRank(confidence) >= need;
}

/**
 * Raise strategy signalGate.minPasses by learned minPassesDelta (capped).
 * Returns the original strategy object when no tighten applies.
 *
 * @param {object} strategy
 * @param {Record<string, unknown> | null | undefined} thresholdOverrides
 */
export function withBtcQuantLearningGateTighten(strategy, thresholdOverrides = {}) {
  const delta = Number(thresholdOverrides?.minPassesDelta);
  if (!strategy || !Number.isFinite(delta) || delta <= 0) return strategy;

  const gate =
    strategy.signalGate && typeof strategy.signalGate === "object"
      ? { ...strategy.signalGate }
      : {};
  const base = Number.isFinite(Number(gate.minPasses)) ? Number(gate.minPasses) : 0;
  return {
    ...strategy,
    signalGate: {
      ...gate,
      minPasses: Math.min(3, Math.max(0, Math.round(base + delta))),
    },
  };
}

/**
 * Normalize evolution thresholdOverrides for signal consumers.
 * @param {Record<string, unknown> | null | undefined} raw
 */
export function resolveBtcQuantLearningThresholds(raw = {}) {
  const src = raw && typeof raw === "object" ? raw : {};
  const minConfidence =
    src.minConfidence == null || src.minConfidence === ""
      ? null
      : String(src.minConfidence).trim().toUpperCase();
  const maxNotionalMultiplier = (() => {
    const n = Number(src.maxNotionalMultiplier);
    if (!Number.isFinite(n)) return 1;
    return Math.min(1, Math.max(0.25, n));
  })();
  const minPassesDelta = (() => {
    const n = Number(src.minPassesDelta);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return Math.min(2, Math.round(n));
  })();
  return {
    minConfidence:
      minConfidence && btcQuantConfidenceRank(minConfidence) > 0 ? minConfidence : null,
    maxNotionalMultiplier,
    minPassesDelta,
  };
}
