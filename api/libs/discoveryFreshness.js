/**
 * Shared MongoDB freshness filters for discovery listings (jobs, events, hackathons).
 */

/** Jobs still seen on source boards within this window are treated as active. */
export const JOB_ACTIVE_DAYS = 30;

/** Hackathons not re-scraped recently are treated as stale. */
export const HACKATHON_STALE_DAYS = 21;

/**
 * @param {Date} [date]
 * @returns {Date}
 */
export function startOfUtcDay(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/**
 * @param {number} days
 * @param {Date} [now]
 * @returns {Date}
 */
export function daysAgo(days, now = new Date()) {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

/**
 * @param {Record<string, unknown>} base
 * @param {Record<string, unknown>} extra
 * @returns {Record<string, unknown>}
 */
export function mergeAndFilter(base, extra) {
  const hasBase = base && Object.keys(base).length > 0;
  const hasExtra = extra && Object.keys(extra).length > 0;
  if (!hasExtra) return base || {};
  if (!hasBase) return extra;
  return { $and: [base, extra] };
}

/**
 * Upcoming or ongoing events only (not ended before now).
 * @param {Date} [now]
 * @returns {Record<string, unknown>}
 */
export function upcomingEventFilter(now = new Date()) {
  const startOfToday = startOfUtcDay(now);
  return {
    $or: [
      { endAt: { $gte: now } },
      { endAt: null, startAt: { $gte: startOfToday } },
    ],
  };
}

/**
 * Open / upcoming hackathons — excludes explicitly closed states.
 * @returns {Record<string, unknown>}
 */
export function openHackathonFilter() {
  return {
    openState: { $nin: ["closed", "ended", "complete", "completed", "archived"] },
  };
}

/**
 * @param {number} [days]
 * @param {Date} [now]
 * @returns {Record<string, unknown>}
 */
export function recentLastSeenFilter(days = JOB_ACTIVE_DAYS, now = new Date()) {
  return { lastSeenAt: { $gte: daysAgo(days, now) } };
}

/**
 * @param {Record<string, unknown>} filter
 * @param {{ freshOnly?: boolean; now?: Date }} [opts]
 * @returns {Record<string, unknown>}
 */
export function applyJobFreshness(filter, opts = {}) {
  if (opts.freshOnly === false) return filter;
  return mergeAndFilter(filter, recentLastSeenFilter(JOB_ACTIVE_DAYS, opts.now));
}

/**
 * @param {Record<string, unknown>} filter
 * @param {{ freshOnly?: boolean; now?: Date }} [opts]
 * @returns {Record<string, unknown>}
 */
export function applyEventFreshness(filter, opts = {}) {
  if (opts.freshOnly === false) return filter;
  return mergeAndFilter(filter, upcomingEventFilter(opts.now));
}

/**
 * @param {Record<string, unknown>} filter
 * @param {{ freshOnly?: boolean; now?: Date }} [opts]
 * @returns {Record<string, unknown>}
 */
export function applyHackathonFreshness(filter, opts = {}) {
  if (opts.freshOnly === false) return filter;
  const fresh = mergeAndFilter(
    openHackathonFilter(),
    recentLastSeenFilter(HACKATHON_STALE_DAYS, opts.now),
  );
  return mergeAndFilter(filter, fresh);
}
