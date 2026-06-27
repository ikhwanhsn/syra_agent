/** Participation points awarded to every campaign participant at finalization. */
export const POINTS_PARTICIPATION = 1;

/** Total early-bird points pool split linearly by submission order. */
export const POINTS_EARLY_POOL = 3;

/** Points awarded to project wallet when a campaign is funded and goes live. */
export const POINTS_CAMPAIGN_CREATION = 5;

/** Daily claim — base points per UTC day. */
export const POINTS_DAILY_CLAIM_BASE = 0.1;

/** Bonus when user claims every day through the last day of the ISO week (Sunday UTC). */
export const POINTS_DAILY_CLAIM_WEEKLY_BONUS = 1;

/** Bonus when user claims every day through the last day of the calendar month (UTC). */
export const POINTS_DAILY_CLAIM_MONTHLY_BONUS = 10;

/**
 * Compute early-bird points per rank (index 0 = earliest submitter).
 * Linear weights: N, N-1, ..., 1 normalized to POINTS_EARLY_POOL.
 * @param {number} participantCount
 * @returns {number[]}
 */
export function computeEarlyPoints(participantCount) {
  const n = Math.floor(Number(participantCount) || 0);
  if (n <= 0) return [];
  if (n === 1) return [POINTS_EARLY_POOL];

  const weightSum = (n * (n + 1)) / 2;
  const points = [];
  for (let rank = 0; rank < n; rank += 1) {
    const weight = n - rank;
    points.push((POINTS_EARLY_POOL * weight) / weightSum);
  }
  return points;
}

/**
 * Round points for display/storage consistency (1 decimal).
 * @param {number} value
 */
export function roundPoints(value) {
  return Math.round(Number(value) * 10) / 10;
}
