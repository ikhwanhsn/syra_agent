const MIN_DECIDED_FOR_LEADER = 5;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {{ decided?: number; winRate?: number | null; sumPnlUsd?: number }} row
 */
export function computeStocksLeaderScore(row) {
  const decided = toNum(row.decided);
  const winRate = row.winRate ?? 0;
  const sumPnl = toNum(row.sumPnlUsd);
  if (sumPnl <= 0 || decided <= 0) return -999;

  const sampleFactor = Math.min(1, decided / MIN_DECIDED_FOR_LEADER);
  const winFactor = Math.max(0, Math.min(1, (winRate - 0.4) / 0.55));
  const pnlFactor = Math.log1p(Math.max(0, sumPnl) * 0.01);
  return pnlFactor * (0.5 + winFactor * 0.5) * (0.3 + sampleFactor * 0.7);
}

export { MIN_DECIDED_FOR_LEADER };
