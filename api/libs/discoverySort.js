/**
 * Shared MongoDB sort specs for discovery listings (jobs, events, hackathons).
 * Default is always newest-first.
 */

/** @type {Record<string, Record<string, 1 | -1>>} */
export const JOB_SORT_SPECS = {
  newest: { lastSeenAt: -1, salaryScore: -1 },
  oldest: { lastSeenAt: 1, salaryScore: -1 },
  salary_high: { salaryScore: -1, lastSeenAt: -1 },
  salary_low: { salaryScore: 1, lastSeenAt: -1 },
};

/** @type {Record<string, Record<string, 1 | -1>>} */
export const EVENT_SORT_SPECS = {
  newest: { discoveredAt: -1, startAt: 1 },
  oldest: { discoveredAt: 1, startAt: 1 },
  upcoming: { startAt: 1, discoveredAt: -1 },
  relevance: { relevanceScore: -1, discoveredAt: -1 },
};

/** @type {Record<string, Record<string, 1 | -1>>} */
export const HACKATHON_SORT_SPECS = {
  newest: { discoveredAt: -1 },
  oldest: { discoveredAt: 1 },
  deadline: { deadline: 1, discoveredAt: -1 },
  prize_high: { prizeAmountUsd: -1, discoveredAt: -1 },
  relevance: { relevanceScore: -1, discoveredAt: -1 },
};

/**
 * @param {Record<string, Record<string, 1 | -1>>} specs
 * @param {string | undefined} sort
 * @param {string} fallback
 * @returns {Record<string, 1 | -1>}
 */
export function resolveDiscoverySort(specs, sort, fallback = "newest") {
  if (typeof sort === "string" && specs[sort]) {
    return specs[sort];
  }
  return specs[fallback] ?? { discoveredAt: -1 };
}
