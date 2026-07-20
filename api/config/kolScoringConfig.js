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

/** Integrity factor bounds (soft discount for implausible / bought signatures). */
export const INTEGRITY_FLOOR = 0.3;
export const INTEGRITY_CEILING = 1.0;

/**
 * Expected engagement-to-view ratio band for integrity check.
 * engagementSum = likes + retweets + replies + quotes
 */
export const INTEGRITY_ENGAGEMENT_VIEW_MIN = 0.005;
export const INTEGRITY_ENGAGEMENT_VIEW_MAX = 0.25;

/**
 * Organic reply/quote rates vs views are typically well under ~2%.
 * Hundreds of comments on a low-view post is a near-certain buy signal.
 */
export const INTEGRITY_REPLY_VIEW_MAX = 0.02;
export const INTEGRITY_QUOTE_VIEW_MAX = 0.015;

/**
 * Snapshot velocity (Tier 1) — free spike detection between metric refreshes.
 * Bought engagement arrives in bursts; organic engagement tracks views.
 */
export const VELOCITY_SPIKE_MIN_ABSOLUTE = 50;
export const VELOCITY_SPIKE_MIN_RATIO = 3.0;
export const VELOCITY_SPIKE_MAX_VIEW_GROWTH_RATIO = 1.25;
export const VELOCITY_LATE_SURGE_MIN_AGE_MS = 72 * 60 * 60 * 1000;
export const VELOCITY_LATE_SURGE_MIN_ABSOLUTE = 40;
export const VELOCITY_LATE_SURGE_MIN_RATIO = 2.0;

/**
 * Engager authenticity audit (Tier 2) — run once at finalize for top payout posts.
 */
export const AUTHENTICITY_AUDIT_TOP_N = (() => {
  const n = Number.parseInt(
    String(process.env.KOL_AUTHENTICITY_AUDIT_TOP_N ?? "").trim(),
    10,
  );
  return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 20;
})();

export const AUTHENTICITY_FLOOR = 0.25;
export const AUTHENTICITY_CEILING = 1.0;
/** Payouts below this authenticity multiplier are held for admin review. */
export const AUTHENTICITY_HOLD_THRESHOLD = 0.4;

export const AUTHENTICITY_MIN_ACCOUNT_AGE_DAYS = 30;
export const AUTHENTICITY_MIN_FOLLOWERS = 25;
export const AUTHENTICITY_MAX_FOLLOWING_RATIO = 50;
/** Max weight contribution from any single s3labs-verified engager. */
export const AUTHENTICITY_VERIFIED_ENGAGER_CAP = 3;

/**
 * Max reply/quote posts counted toward a handle's campaign score.
 * Per-post scoring still applies; only the top N by score are summed.
 */
export const MAX_CONTRIBUTIONS_PER_HANDLE = (() => {
  const n = Number.parseInt(
    String(process.env.KOL_MAX_CONTRIBUTIONS_PER_HANDLE ?? "").trim(),
    10,
  );
  return Number.isFinite(n) && n > 0 ? Math.min(n, 20) : 3;
})();

/**
 * Legacy min-likes helper (meetsMinLikes). Leaderboard now lists all replies/quotes;
 * rewards require hasRewardEngagement (likes/RTs/replies/quotes > 0), not this gate.
 * Kept for env compatibility / tests. Set KOL_MIN_LIKES_PER_POST=0 to disable.
 */
export const MIN_LIKES_PER_POST = (() => {
  const raw = String(process.env.KOL_MIN_LIKES_PER_POST ?? "").trim();
  if (raw === "") return 1;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 1;
})();
