/**
 * Shared parsing of CryptoAnalysisEngine report fields for trading experiments.
 * @param {Record<string, unknown>} report
 */
export function extractSignalFields(report) {
  const qs = /** @type {Record<string, unknown> | undefined} */ (report?.quickSummary);
  const mo = /** @type {Record<string, unknown> | undefined} */ (report?.marketOverview);
  const clearSignal = String(qs?.signal ?? "HOLD").toUpperCase();
  const entry = parseFloat(String(qs?.entry ?? ""));
  const stopLoss = parseFloat(String(qs?.stopLoss ?? ""));
  const firstTarget = parseFloat(String(qs?.firstTarget ?? ""));
  const priceRaw = mo?.currentPrice;
  const priceAtSignal = parseFloat(String(priceRaw ?? ""));
  const confidence = qs?.confidence != null ? String(qs.confidence) : null;

  return {
    clearSignal,
    entry: Number.isFinite(entry) ? entry : null,
    stopLoss: Number.isFinite(stopLoss) ? stopLoss : null,
    firstTarget: Number.isFinite(firstTarget) ? firstTarget : null,
    priceAtSignal: Number.isFinite(priceAtSignal) ? priceAtSignal : null,
    confidence,
  };
}
