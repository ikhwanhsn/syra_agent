/**
 * KOL marketplace engagement scoring configuration.
 * All weights, caps, and multiplier bounds are centralized here for tuning.
 */

/** Hard cap on view count contribution to score. */
export const VIEW_CAP = 50_000;

/** Per-engagement type weights (harder-to-fake actions score higher). */
export const ENGAGEMENT_WEIGHTS = {
  like: 1.0,
  reply: 1.5,
  retweet: 2.5,
  quote: 3.0,
  /** Applied per 1,000 views after diminishing returns. */
  viewPer1000: 1.0,
};

/**
 * Follower-relative caps: max(floor, followers × ratio).
 * Generous ratios allow genuine viral tweets; floors protect micro-KOLs.
 */
export const FOLLOWER_CAP_FLOORS = {
  like: 50,
  reply: 25,
  retweet: 30,
  quote: 15,
  view: 500,
};

export const FOLLOWER_CAP_RATIOS = {
  like: 5.0,
  reply: 2.0,
  retweet: 2.5,
  quote: 1.5,
  view: 50.0,
};

/**
 * Diminishing returns knee per metric type.
 * Linear up to knee, sqrt-scaled beyond.
 */
export const DIMINISHING_KNEES = {
  like: 100,
  reply: 50,
  retweet: 75,
  quote: 40,
  view: 10_000,
};

/** Credibility multiplier bounds. */
export const CREDIBILITY_FLOOR = 0.5;
export const CREDIBILITY_CEILING = 1.15;
export const VERIFIED_BONUS = 0.05;

/** Follower count at which credibility reaches ceiling (log-ramp). */
export const CREDIBILITY_FOLLOWER_ANCHOR = 100_000;

/** Integrity factor bounds (soft discount for implausible signatures). */
export const INTEGRITY_FLOOR = 0.6;
export const INTEGRITY_CEILING = 1.0;

/**
 * Expected engagement-to-view ratio band for integrity check.
 * engagementSum = likes + retweets + replies + quotes
 */
export const INTEGRITY_ENGAGEMENT_VIEW_MIN = 0.005;
export const INTEGRITY_ENGAGEMENT_VIEW_MAX = 0.35;
