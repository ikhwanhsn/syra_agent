/**
 * Stocks News Lab leader scoring — favors sample size, expectancy, and clean exits
 * over short lucky streaks.
 */

/** Min decided (wins+losses) before a strategy can be named lab leader. */
const MIN_DECIDED_FOR_LEADER = 30;

/** Elite parent bar for evolution spawns (stricter than leader floor). */
const ELITE_MIN_DECIDED = 30;
const ELITE_MIN_WIN_RATE = 0.48;
const ELITE_MIN_AVG_PNL_USD = 0;
const ELITE_MIN_RECENT_AVG_PNL_USD = 0;

/** Sample size where score is fully trusted. */
const FULL_SAMPLE_DECIDED = 40;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {{
 *   decided?: number;
 *   wins?: number;
 *   losses?: number;
 *   expired?: number;
 *   winRate?: number | null;
 *   sumPnlUsd?: number;
 *   avgPnlUsd?: number | null;
 *   grossWinUsd?: number | null;
 *   grossLossUsd?: number | null;
 * }} row
 */
export function computeStocksLeaderScore(row) {
  const wins = toNum(row.wins);
  const losses = toNum(row.losses);
  const expired = toNum(row.expired);
  const decided = toNum(row.decided, wins + losses);
  const closed = decided + expired;
  const winRate = row.winRate != null ? toNum(row.winRate) : decided > 0 ? wins / decided : 0;
  const sumPnl = toNum(row.sumPnlUsd);
  const avgPnl =
    row.avgPnlUsd != null
      ? toNum(row.avgPnlUsd)
      : decided + expired > 0
        ? sumPnl / (decided + expired)
        : 0;

  if (sumPnl <= 0 || decided <= 0) return -999;

  const sampleFactor = Math.min(1, decided / FULL_SAMPLE_DECIDED);
  const closedFactor = Math.min(1, closed / FULL_SAMPLE_DECIDED);
  const winFactor = Math.max(0, Math.min(1, (winRate - 0.4) / 0.55));
  const expectancyFactor = Math.max(0, Math.min(1.5, avgPnl / 25));
  const pnlFactor = Math.log1p(Math.max(0, sumPnl) * 0.01);

  const expireRate = closed > 0 ? expired / closed : 0;
  const expirePenalty = 1 - Math.min(0.55, expireRate * 0.9);

  const grossWin = toNum(row.grossWinUsd, Math.max(0, sumPnl));
  const grossLoss = toNum(row.grossLossUsd, 0);
  const profitFactor =
    grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 3 : 0;
  const pfFactor = Math.max(0, Math.min(1.4, Math.log1p(profitFactor) / Math.log1p(3)));

  // Confidence: punish tiny samples hard even if sum PnL looks great.
  const confidence = 0.25 + sampleFactor * 0.45 + closedFactor * 0.3;

  return (
    pnlFactor *
    (0.35 + winFactor * 0.25 + expectancyFactor * 0.25 + pfFactor * 0.15) *
    expirePenalty *
    confidence
  );
}

/**
 * Whether a ranked row may parent the next evolution spawn.
 * @param {{
 *   decided?: number;
 *   sumPnlUsd?: number;
 *   winRate?: number | null;
 *   avgPnlUsd?: number | null;
 *   recentAvgPnlUsd?: number | null;
 *   openPositions?: number;
 * }} row
 */
export function isStocksEliteParent(row) {
  const decided = toNum(row.decided);
  const sumPnl = toNum(row.sumPnlUsd);
  const winRate = row.winRate == null ? 0 : toNum(row.winRate);
  const avgPnl = row.avgPnlUsd == null ? sumPnl / Math.max(1, decided) : toNum(row.avgPnlUsd);
  const recentAvg =
    row.recentAvgPnlUsd == null ? avgPnl : toNum(row.recentAvgPnlUsd);
  const open = toNum(row.openPositions);
  return (
    decided >= ELITE_MIN_DECIDED &&
    sumPnl > 0 &&
    avgPnl > ELITE_MIN_AVG_PNL_USD &&
    recentAvg > ELITE_MIN_RECENT_AVG_PNL_USD &&
    (row.holdoutAvgPnlUsd == null || toNum(row.holdoutAvgPnlUsd) > 0) &&
    winRate >= ELITE_MIN_WIN_RATE &&
    open === 0 &&
    computeStocksLeaderScore(row) > 0
  );
}

/**
 * Weighted tournament pick among elite rows (already filtered + sorted best-first).
 * @template T
 * @param {T[]} elites
 * @param {(row: T) => number} scoreOf
 * @param {number} [topN]
 * @returns {T | null}
 */
export function pickWeightedElite(elites, scoreOf, topN = 3) {
  if (!Array.isArray(elites) || elites.length === 0) return null;
  const pool = elites.slice(0, Math.max(1, topN));
  const weights = pool.map((row) => Math.max(0.05, scoreOf(row)));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[0];
}

export {
  MIN_DECIDED_FOR_LEADER,
  ELITE_MIN_DECIDED,
  ELITE_MIN_WIN_RATE,
  ELITE_MIN_AVG_PNL_USD,
  ELITE_MIN_RECENT_AVG_PNL_USD,
  FULL_SAMPLE_DECIDED,
};
