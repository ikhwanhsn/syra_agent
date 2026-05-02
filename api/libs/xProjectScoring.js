/**
 * Deterministic X (Twitter) project scoring from user profile + tweet samples.
 * Pure functions — no I/O, no env.
 */

/** Category weight caps (total 100). */
export const WEIGHT_IDENTITY = 15;
export const WEIGHT_REACH = 25;
export const WEIGHT_ENGAGEMENT = 30;
export const WEIGHT_CADENCE = 15;
export const WEIGHT_CONTENT = 15;

/** Account age: map 0→0 to 10 years→7 pts (within identity cap). */
const IDENTITY_AGE_MAX_YEARS = 10;
const IDENTITY_AGE_MAX_POINTS = 7;

/** Reach: log10(followers) scaled so log10(1e6)=6 maps to 20 pts. */
const REACH_LOG_MAX = 6;
const REACH_LOG_POINTS = 20;
const REACH_RATIO_MAX_BONUS = 5;

/** Engagement: piecewise avg rate % → points (max 30). */
const ENG_RATE_PCT_FOR_MID = 1;
const ENG_POINTS_AT_MID = 18;
const ENG_RATE_PCT_FOR_TOP = 5;
const ENG_POINTS_AT_TOP = 30;

/** Cadence: ideal tweets/day band. */
const CADENCE_IDEAL_LOW = 0.5;
const CADENCE_IDEAL_HIGH = 3;
const CADENCE_IDEAL_POINTS = 12;
const CADENCE_RECENT_BONUS = 3;
const CADENCE_RECENT_HOURS = 48;
const CADENCE_SPAM_THRESHOLD = 20;
const CADENCE_DORMANT_DAYS = 14;

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function linearMap(x, x0, x1, y0, y1) {
  if (x1 === x0) return y0;
  const t = (x - x0) / (x1 - x0);
  return y0 + t * (y1 - y0);
}

/**
 * @param {number} score0to100
 * @returns {"A"|"B"|"C"|"D"|"F"}
 */
export function scoreToGrade(score0to100) {
  const s = clamp(Math.round(score0to100), 0, 100);
  if (s >= 90) return "A";
  if (s >= 80) return "B";
  if (s >= 70) return "C";
  if (s >= 60) return "D";
  return "F";
}

/**
 * X user object shape from API v2 (minimal fields we use).
 * @typedef {object} XUserLite
 * @property {string} [created_at]
 * @property {string} [description]
 * @property {string} [url]
 * @property {boolean} [verified]
 * @property {string} [verified_type]
 * @property {{ followers_count?: number; following_count?: number; tweet_count?: number }} [public_metrics]
 */

/**
 * @typedef {object} XTweetLite
 * @property {string} [created_at]
 * @property {{ like_count?: number; retweet_count?: number; reply_count?: number; quote_count?: number; impression_count?: number }} [public_metrics]
 */

/**
 * @param {XTweetLite} tweet
 * @returns {number}
 */
function tweetInteractionTotal(tweet) {
  const m = tweet?.public_metrics;
  if (!m || typeof m !== "object") return 0;
  const like = Number(m.like_count) || 0;
  const rt = Number(m.retweet_count) || 0;
  const reply = Number(m.reply_count) || 0;
  const quote = Number(m.quote_count) || 0;
  const imp = Number(m.impression_count);
  const base = like + rt + reply + quote;
  if (Number.isFinite(imp) && imp > 0) {
    return base + imp * 0.001;
  }
  return base;
}

/**
 * @param {XUserLite} user
 * @returns {boolean}
 */
function isVerifiedUser(user) {
  if (!user || typeof user !== "object") return false;
  if (user.verified === true) return true;
  const vt = String(user.verified_type || "").toLowerCase();
  return vt !== "" && vt !== "none";
}

/**
 * @param {string} [iso]
 * @param {Date} now
 * @returns {number|null} age in days
 */
function accountAgeDays(iso, now) {
  if (!iso || typeof iso !== "string") return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((now.getTime() - d.getTime()) / (86400 * 1000));
}

/**
 * Engagement rate % from interactions / followers, averaged per tweet.
 * @param {XTweetLite[]} tweets
 * @param {number} followers
 * @returns {number}
 */
function averageEngagementRatePct(tweets, followers) {
  const denom = Math.max(followers, 1);
  if (!Array.isArray(tweets) || tweets.length === 0) return 0;
  let sum = 0;
  for (const t of tweets) {
    const interactions = tweetInteractionTotal(t);
    sum += (interactions / denom) * 100;
  }
  return sum / tweets.length;
}

/**
 * Map avg engagement rate % to 0–WEIGHT_ENGAGEMENT.
 * @param {number} avgRatePct
 * @returns {number}
 */
function engagementPointsFromRate(avgRatePct) {
  const x = clamp(avgRatePct, 0, 100);
  if (x <= 0) return 0;
  if (x <= ENG_RATE_PCT_FOR_MID) {
    return linearMap(x, 0, ENG_RATE_PCT_FOR_MID, 0, ENG_POINTS_AT_MID);
  }
  if (x <= ENG_RATE_PCT_FOR_TOP) {
    return linearMap(
      x,
      ENG_RATE_PCT_FOR_MID,
      ENG_RATE_PCT_FOR_TOP,
      ENG_POINTS_AT_MID,
      ENG_POINTS_AT_TOP,
    );
  }
  return ENG_POINTS_AT_TOP;
}

/**
 * @param {XTweetLite[]} tweets
 * @param {Date} now
 * @returns {{ tweetsPerDay: number; lastTweetDaysAgo: number | null; spanDays: number }}
 */
function cadenceSignals(tweets, now) {
  if (!Array.isArray(tweets) || tweets.length === 0) {
    return { tweetsPerDay: 0, lastTweetDaysAgo: null, spanDays: 0 };
  }
  const times = tweets
    .map((t) => (t?.created_at ? new Date(t.created_at).getTime() : NaN))
    .filter((ts) => Number.isFinite(ts))
    .sort((a, b) => a - b);
  if (times.length === 0) {
    return { tweetsPerDay: 0, lastTweetDaysAgo: null, spanDays: 0 };
  }
  const oldest = times[0];
  const newest = times[times.length - 1];
  const spanMs = Math.max(now.getTime() - oldest, 1);
  const spanDays = spanMs / (86400 * 1000);
  const tweetsPerDay = tweets.length / Math.max(spanDays, 1 / 24);
  const lastTweetDaysAgo = Math.floor(
    (now.getTime() - newest) / (86400 * 1000),
  );
  return { tweetsPerDay, lastTweetDaysAgo, spanDays };
}

/**
 * Cadence score 0–WEIGHT_CADENCE.
 * @param {{ tweetsPerDay: number; lastTweetDaysAgo: number | null }} sig
 * @param {Date} now
 * @param {XTweetLite[]} tweets
 * @returns {{ score: number; details: Record<string, unknown> }}
 */
function scoreCadence(sig, now, tweets) {
  let pts = 0;
  const details = {
    tweetsPerDay: sig.tweetsPerDay,
    lastTweetDaysAgo: sig.lastTweetDaysAgo,
    idealBand: `${CADENCE_IDEAL_LOW}-${CADENCE_IDEAL_HIGH}/day`,
  };

  const tpd = sig.tweetsPerDay;
  if (tpd >= CADENCE_IDEAL_LOW && tpd <= CADENCE_IDEAL_HIGH) {
    pts += CADENCE_IDEAL_POINTS;
  } else if (tpd > 0 && tpd < CADENCE_IDEAL_LOW) {
    pts += linearMap(tpd, 0, CADENCE_IDEAL_LOW, 4, CADENCE_IDEAL_POINTS);
  } else if (tpd > CADENCE_IDEAL_HIGH && tpd <= CADENCE_SPAM_THRESHOLD) {
    pts += linearMap(
      tpd,
      CADENCE_IDEAL_HIGH,
      CADENCE_SPAM_THRESHOLD,
      CADENCE_IDEAL_POINTS,
      6,
    );
  } else if (tpd > CADENCE_SPAM_THRESHOLD) {
    pts += 2;
    details.spamSuspected = true;
  }

  if (
    sig.lastTweetDaysAgo != null &&
    sig.lastTweetDaysAgo > CADENCE_DORMANT_DAYS
  ) {
    pts = Math.min(pts, 5);
    details.dormant = true;
  }

  if (sig.lastTweetDaysAgo != null && sig.lastTweetDaysAgo * 24 <= CADENCE_RECENT_HOURS) {
    pts += CADENCE_RECENT_BONUS;
    details.recentActivityBonus = true;
  }

  pts = clamp(pts, 0, WEIGHT_CADENCE);
  return { score: pts, details };
}

/**
 * Content diversity: penalize single-tweet dominance; reward profile tweet volume (log).
 * @param {XTweetLite[]} tweets
 * @param {number} profileTweetCount
 * @returns {{ score: number; details: Record<string, unknown> }}
 */
function scoreContentDiversity(tweets, profileTweetCount) {
  const totals = Array.isArray(tweets)
    ? tweets.map((t) => tweetInteractionTotal(t))
    : [];
  const sum = totals.reduce((a, b) => a + b, 0);
  let spreadPts = 0;
  let dominance = 0;
  if (totals.length >= 2 && sum > 0) {
    const max = Math.max(...totals);
    dominance = max / sum;
    spreadPts = (1 - clamp(dominance, 0, 1)) * 10;
  } else if (totals.length === 1 && sum > 0) {
    dominance = 1;
    spreadPts = 3;
  } else {
    spreadPts = totals.length === 0 ? 0 : 4;
  }

  const tc = Math.max(Number(profileTweetCount) || 0, 0);
  const logTc = tc > 0 ? Math.log10(tc + 1) : 0;
  const volumePts = clamp((logTc / 5) * 5, 0, 5);

  let score = clamp(spreadPts + volumePts, 0, WEIGHT_CONTENT);
  return {
    score,
    details: {
      dominanceRatio: Number(dominance.toFixed(3)),
      spreadPoints: Number(spreadPts.toFixed(2)),
      volumePoints: Number(volumePts.toFixed(2)),
      profileTweetCount: tc,
    },
  };
}

/**
 * @param {{ user: XUserLite; tweets: XTweetLite[]; now?: Date }} input
 * @returns {{
 *   score: number;
 *   grade: ReturnType<typeof scoreToGrade>;
 *   breakdown: Record<string, { score: number; max: number; details: Record<string, unknown> }>;
 *   signals: Record<string, unknown>;
 *   redFlags: string[];
 * }}
 */
export function computeXProjectScore({ user, tweets, now = new Date() }) {
  const pm = user?.public_metrics && typeof user.public_metrics === "object"
    ? user.public_metrics
    : {};
  const followersCount = Math.max(Number(pm.followers_count) || 0, 0);
  const followingCount = Math.max(Number(pm.following_count) || 0, 0);
  const profileTweetCount = Math.max(Number(pm.tweet_count) || 0, 0);

  const ageDays = accountAgeDays(user?.created_at, now);
  const ageYears = ageDays != null ? ageDays / 365 : 0;

  /** Identity & Trust */
  let identityPts = 0;
  const identityDetails = {};
  if (isVerifiedUser(user)) {
    identityPts += 5;
    identityDetails.verifiedBonus = 5;
  }
  const agePts = linearMap(
    clamp(ageYears, 0, IDENTITY_AGE_MAX_YEARS),
    0,
    IDENTITY_AGE_MAX_YEARS,
    0,
    IDENTITY_AGE_MAX_POINTS,
  );
  identityPts += agePts;
  identityDetails.ageYears = Number(ageYears.toFixed(2));
  identityDetails.agePoints = Number(agePts.toFixed(2));

  const desc = String(user?.description || "");
  if (desc.length >= 40) {
    identityPts += 2;
    identityDetails.bioLengthBonus = 2;
  }
  const profileUrl = user?.url;
  if (profileUrl && String(profileUrl).trim()) {
    identityPts += 1;
    identityDetails.urlBonus = 1;
  }
  identityPts = clamp(identityPts, 0, WEIGHT_IDENTITY);

  /** Reach */
  const logF = followersCount > 0 ? Math.log10(followersCount) : 0;
  const logReachPts = clamp((logF / REACH_LOG_MAX) * REACH_LOG_POINTS, 0, REACH_LOG_POINTS);
  const ratio = followersCount / Math.max(followingCount, 1);
  const ratioBonus = clamp(Math.log10(ratio + 1) * 2.5, 0, REACH_RATIO_MAX_BONUS);
  let reachPts = clamp(logReachPts + ratioBonus, 0, WEIGHT_REACH);
  const reachDetails = {
    followersCount,
    followingCount,
    log10Followers: Number(logF.toFixed(3)),
    logMappedPoints: Number(logReachPts.toFixed(2)),
    ratioBonus: Number(ratioBonus.toFixed(2)),
  };

  /** Engagement */
  const avgEngagementRatePct = averageEngagementRatePct(tweets, followersCount);
  let engagementPts = engagementPointsFromRate(avgEngagementRatePct);
  engagementPts = clamp(engagementPts, 0, WEIGHT_ENGAGEMENT);
  const engagementDetails = {
    avgEngagementRatePct: Number(avgEngagementRatePct.toFixed(4)),
    tweetsAnalyzed: Array.isArray(tweets) ? tweets.length : 0,
  };

  /** Cadence */
  const cadSig = cadenceSignals(tweets, now);
  const cadence = scoreCadence(cadSig, now, tweets);

  /** Content diversity */
  const content = scoreContentDiversity(tweets, profileTweetCount);

  const rawTotal =
    identityPts +
    reachPts +
    engagementPts +
    cadence.score +
    content.score;
  const score = clamp(Math.round(rawTotal), 0, 100);
  const grade = scoreToGrade(score);

  const redFlags = [];
  if (ageDays != null && ageDays < 183) {
    redFlags.push("Account under 6 months old");
  }
  if (avgEngagementRatePct < 0.05 && (tweets?.length ?? 0) >= 3) {
    redFlags.push("Very low engagement rate vs followers (< 0.05% avg)");
  }
  if (followingCount > 0 && followersCount / followingCount < 0.1 && followersCount < 500) {
    redFlags.push("Followers/following ratio suggests growth pattern worth reviewing");
  }
  if (cadSig.lastTweetDaysAgo != null && cadSig.lastTweetDaysAgo > CADENCE_DORMANT_DAYS) {
    redFlags.push(`No recent tweets in sample window (~${cadSig.lastTweetDaysAgo}+ days)`);
  }

  const signals = {
    followersCount,
    followingCount,
    tweetsAnalyzed: Array.isArray(tweets) ? tweets.length : 0,
    profileTweetCount,
    avgEngagementRatePct: Number(avgEngagementRatePct.toFixed(4)),
    tweetsPerDay: Number(cadSig.tweetsPerDay.toFixed(4)),
    lastTweetDaysAgo: cadSig.lastTweetDaysAgo,
    accountAgeDays: ageDays,
  };

  return {
    score,
    grade,
    breakdown: {
      identity: {
        score: Number(identityPts.toFixed(2)),
        max: WEIGHT_IDENTITY,
        details: identityDetails,
      },
      reach: {
        score: Number(reachPts.toFixed(2)),
        max: WEIGHT_REACH,
        details: reachDetails,
      },
      engagement: {
        score: Number(engagementPts.toFixed(2)),
        max: WEIGHT_ENGAGEMENT,
        details: engagementDetails,
      },
      cadence: {
        score: Number(cadence.score.toFixed(2)),
        max: WEIGHT_CADENCE,
        details: cadence.details,
      },
      contentDiversity: {
        score: Number(content.score.toFixed(2)),
        max: WEIGHT_CONTENT,
        details: content.details,
      },
    },
    signals,
    redFlags,
  };
}
