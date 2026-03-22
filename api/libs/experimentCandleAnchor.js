/**
 * Shared candle timing for trading experiment anchors (any CEX OHLC rows with open time at index 0).
 */

/**
 * @param {string} [bar]
 * @returns {number}
 */
export function barDurationMsGeneric(bar) {
  const k = String(bar || "1h").trim().toLowerCase();
  const map = {
    "1m": 60_000,
    "3m": 180_000,
    "5m": 300_000,
    "15m": 900_000,
    "30m": 1_800_000,
    "1h": 3_600_000,
    "2h": 7_200_000,
    "4h": 14_400_000,
    "6h": 21_600_000,
    "8h": 28_800_000,
    "12h": 43_200_000,
    "1d": 86_400_000,
    "1w": 604_800_000,
  };
  if (map[k] != null) return map[k];
  return 3_600_000;
}

/**
 * @param {number[]} sortedOpensAsc
 * @param {number} barDurMs
 * @param {number} [nowMs]
 * @returns {number | null}
 */
export function lastClosedAnchorFromSortedOpens(sortedOpensAsc, barDurMs, nowMs = Date.now()) {
  if (!sortedOpensAsc.length) return null;
  for (let i = sortedOpensAsc.length - 1; i >= 0; i--) {
    const open = Number(sortedOpensAsc[i]);
    if (!Number.isFinite(open)) continue;
    const close = open + barDurMs - 1;
    if (close <= nowMs - 400) return close;
  }
  if (sortedOpensAsc.length >= 2) {
    const open = Number(sortedOpensAsc[sortedOpensAsc.length - 2]);
    if (Number.isFinite(open)) return open + barDurMs - 1;
  }
  return null;
}

/**
 * Engine / internal rows: [openMs, ...]
 * @param {unknown[][]} rows
 * @param {number} barDurMs
 * @returns {number | null}
 */
export function lastClosedAnchorFromEngineRows(rows, barDurMs) {
  const opens = rows
    .map((r) => (Array.isArray(r) ? Number(r[0]) : NaN))
    .filter((x) => Number.isFinite(x))
    .sort((a, b) => a - b);
  return lastClosedAnchorFromSortedOpens(opens, barDurMs);
}
