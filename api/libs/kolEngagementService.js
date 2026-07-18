/**
 * KOL marketplace engagement scoring and tweet validation.
 */
import {
  CREDIBILITY_CEILING,
  CREDIBILITY_FLOOR,
  CREDIBILITY_FOLLOWER_ANCHOR,
  DIMINISHING_KNEES,
  ENGAGEMENT_WEIGHTS,
  FOLLOWER_CAP_FLOORS,
  FOLLOWER_CAP_RATIOS,
  INTEGRITY_CEILING,
  INTEGRITY_ENGAGEMENT_VIEW_MAX,
  INTEGRITY_ENGAGEMENT_VIEW_MIN,
  INTEGRITY_FLOOR,
  MAX_CONTRIBUTIONS_PER_HANDLE,
  MIN_LIKES_PER_POST,
  VERIFIED_BONUS,
  VIEW_CAP,
} from "../config/kolScoringConfig.js";
import { getTweetById, isTwitterApiIoConfigured } from "./twitterApiIoClient.js";

/**
 * @typedef {object} KolMetrics
 * @property {number} [likeCount]
 * @property {number} [retweetCount]
 * @property {number} [replyCount]
 * @property {number} [quoteCount]
 * @property {number} [viewCount]
 */

/**
 * @typedef {object} KolAuthorContext
 * @property {number} [followers]
 * @property {boolean} [verified]
 */

/**
 * @typedef {object} MetricBreakdown
 * @property {number} raw
 * @property {number} afterImpossibility
 * @property {number} afterFollowerCap
 * @property {number} afterDiminishing
 * @property {number} weighted
 * @property {number} weight
 */

/**
 * @typedef {object} ScoreBreakdown
 * @property {number} version
 * @property {Record<string, MetricBreakdown>} metrics
 * @property {number} baseScore
 * @property {number} credibilityMultiplier
 * @property {number} integrityFactor
 * @property {string[]} integrityFlags
 * @property {number} finalScore
 */

const METRIC_KEYS = ["like", "reply", "retweet", "quote", "view"];

/**
 * @param {unknown} value
 * @returns {number}
 */
function toNonNegativeInt(value) {
  const n = Math.floor(Number(value) || 0);
  return n > 0 ? n : 0;
}

const METRIC_COUNT_KEYS = [
  "likeCount",
  "retweetCount",
  "replyCount",
  "quoteCount",
  "viewCount",
];

/**
 * Sum raw engagement counts (likes + RTs + replies + quotes + views).
 * @param {KolMetrics | null | undefined} metrics
 * @returns {number}
 */
export function metricsEngagementTotal(metrics) {
  return METRIC_COUNT_KEYS.reduce(
    (sum, key) => sum + toNonNegativeInt(metrics?.[key]),
    0,
  );
}

/**
 * True when incoming metrics beat existing on any count.
 * @param {KolMetrics | null | undefined} existing
 * @param {KolMetrics | null | undefined} incoming
 * @returns {boolean}
 */
export function metricsIncreased(existing, incoming) {
  return METRIC_COUNT_KEYS.some(
    (key) => toNonNegativeInt(incoming?.[key]) > toNonNegativeInt(existing?.[key]),
  );
}

/**
 * True when a post has enough likes (legacy/optional gate).
 * When MIN_LIKES_PER_POST is 0, all posts pass.
 * Leaderboard inclusion no longer uses this — see hasRewardEngagement.
 * @param {KolMetrics | null | undefined} metrics
 * @returns {boolean}
 */
export function meetsMinLikes(metrics) {
  if (MIN_LIKES_PER_POST <= 0) return true;
  return toNonNegativeInt(metrics?.likeCount) >= MIN_LIKES_PER_POST;
}

/**
 * True when a post/submission has real engagement (likes, RTs, replies, or quotes).
 * Views alone do not count. Used to decide reward eligibility — zero-engagement
 * replies/quotes still appear on the leaderboard with score/payout 0.
 * @param {KolMetrics | null | undefined} metrics
 * @returns {boolean}
 */
export function hasRewardEngagement(metrics) {
  return (
    toNonNegativeInt(metrics?.likeCount) +
      toNonNegativeInt(metrics?.retweetCount) +
      toNonNegativeInt(metrics?.replyCount) +
      toNonNegativeInt(metrics?.quoteCount) >
    0
  );
}

/**
 * @param {number} score
 * @returns {number}
 */
export function roundScore(score) {
  return Math.round(score * 10) / 10;
}

/**
 * @param {number} value
 * @param {number} knee
 * @returns {number}
 */
function applyDiminishingReturns(value, knee) {
  if (value <= knee) return value;
  return knee + Math.sqrt(value - knee) * Math.sqrt(knee);
}

/**
 * @param {number} followers
 * @param {boolean} verified
 * @returns {number}
 */
function computeCredibilityMultiplier(followers, verified) {
  const f = Math.max(0, followers);
  const logRamp =
    f <= 0
      ? 0
      : Math.log10(1 + f) / Math.log10(1 + CREDIBILITY_FOLLOWER_ANCHOR);
  const raw = CREDIBILITY_FLOOR + (CREDIBILITY_CEILING - CREDIBILITY_FLOOR) * logRamp;
  const withVerified = verified ? raw + VERIFIED_BONUS : raw;
  return Math.min(CREDIBILITY_CEILING + (verified ? VERIFIED_BONUS : 0), Math.max(CREDIBILITY_FLOOR, withVerified));
}

/**
 * @param {Record<string, number>} capped
 * @returns {{ factor: number; flags: string[] }}
 */
function computeIntegrityFactor(capped) {
  const views = capped.view ?? 0;
  const engagementSum =
    (capped.like ?? 0) +
    (capped.retweet ?? 0) +
    (capped.reply ?? 0) +
    (capped.quote ?? 0);

  const flags = [];
  let factor = INTEGRITY_CEILING;

  if (views > 0) {
    const ratio = engagementSum / views;
    if (ratio > INTEGRITY_ENGAGEMENT_VIEW_MAX) {
      flags.push("high_engagement_to_view_ratio");
      const excess = ratio / INTEGRITY_ENGAGEMENT_VIEW_MAX;
      factor = Math.max(INTEGRITY_FLOOR, INTEGRITY_CEILING / Math.sqrt(excess));
    } else if (ratio < INTEGRITY_ENGAGEMENT_VIEW_MIN && engagementSum > 10) {
      flags.push("low_engagement_to_view_ratio");
      factor = Math.max(INTEGRITY_FLOOR, factor * 0.85);
    }
  } else if (engagementSum > 20) {
    flags.push("engagement_without_views");
    factor = Math.max(INTEGRITY_FLOOR, factor * 0.7);
  }

  return { factor, flags };
}

/**
 * @param {string} metricKey
 * @param {number} rawValue
 * @param {number} followers
 * @returns {number}
 */
function followerRelativeCap(metricKey, rawValue, followers) {
  const floor = FOLLOWER_CAP_FLOORS[metricKey] ?? 0;
  const ratio = FOLLOWER_CAP_RATIOS[metricKey] ?? 1;
  const cap = Math.max(floor, Math.floor(followers * ratio));
  return Math.min(rawValue, cap);
}

/**
 * @param {string} metricKey
 * @param {number} value
 * @returns {number}
 */
function weightMetric(metricKey, value) {
  if (metricKey === "view") {
    const cappedViews = Math.min(value, VIEW_CAP);
    return (cappedViews / 1000) * ENGAGEMENT_WEIGHTS.viewPer1000;
  }
  return value * (ENGAGEMENT_WEIGHTS[metricKey] ?? 1);
}

/**
 * Legacy wrapper — returns final score only.
 * @param {KolMetrics | null | undefined} metrics
 * @param {KolAuthorContext} [authorContext]
 * @returns {number}
 */
export function computeEngagementScore(metrics, authorContext = {}) {
  return scoreSubmission(metrics, authorContext).score;
}

/**
 * Multi-factor fair scoring with anti-fake-engagement layers.
 * @param {KolMetrics | null | undefined} metrics
 * @param {KolAuthorContext} [authorContext]
 * @returns {{ score: number; breakdown: ScoreBreakdown }}
 */
export function scoreSubmission(metrics, authorContext = {}) {
  const followers = toNonNegativeInt(authorContext.followers);
  const verified = Boolean(authorContext.verified);

  const raw = {
    like: toNonNegativeInt(metrics?.likeCount),
    reply: toNonNegativeInt(metrics?.replyCount),
    retweet: toNonNegativeInt(metrics?.retweetCount),
    quote: toNonNegativeInt(metrics?.quoteCount),
    view: toNonNegativeInt(metrics?.viewCount),
  };

  const viewsForClamp = raw.view;

  /** @type {Record<string, MetricBreakdown>} */
  const metricBreakdown = {};
  /** @type {Record<string, number>} */
  const capped = {};

  for (const key of METRIC_KEYS) {
    const rawValue = raw[key];
    let afterImpossibility = rawValue;
    if (key !== "view" && viewsForClamp > 0) {
      afterImpossibility = Math.min(rawValue, viewsForClamp);
    }

    const afterFollowerCap = followerRelativeCap(key, afterImpossibility, followers);
    const afterDiminishing = applyDiminishingReturns(
      afterFollowerCap,
      DIMINISHING_KNEES[key] ?? 100,
    );
    const weight = key === "view" ? ENGAGEMENT_WEIGHTS.viewPer1000 / 1000 : (ENGAGEMENT_WEIGHTS[key] ?? 1);
    const weighted = weightMetric(key, afterDiminishing);

    metricBreakdown[key] = {
      raw: rawValue,
      afterImpossibility,
      afterFollowerCap,
      afterDiminishing: Math.round(afterDiminishing * 100) / 100,
      weighted: Math.round(weighted * 100) / 100,
      weight: key === "view" ? ENGAGEMENT_WEIGHTS.viewPer1000 : (ENGAGEMENT_WEIGHTS[key] ?? 1),
    };
    capped[key] = afterFollowerCap;
  }

  const baseScore = METRIC_KEYS.reduce((sum, key) => sum + metricBreakdown[key].weighted, 0);
  const credibilityMultiplier = Math.round(computeCredibilityMultiplier(followers, verified) * 1000) / 1000;
  const { factor: integrityFactor, flags: integrityFlags } = computeIntegrityFactor(capped);
  const roundedIntegrity = Math.round(integrityFactor * 1000) / 1000;
  const finalScore = roundScore(baseScore * credibilityMultiplier * roundedIntegrity);

  return {
    score: finalScore,
    breakdown: {
      version: 2,
      metrics: metricBreakdown,
      baseScore: Math.round(baseScore * 100) / 100,
      credibilityMultiplier,
      integrityFactor: roundedIntegrity,
      integrityFlags,
      finalScore,
    },
  };
}

/**
 * @typedef {object} ContributionInput
 * @property {string} tweetId
 * @property {string} tweetUrl
 * @property {"reply" | "quote"} mode
 * @property {KolMetrics} metrics
 * @property {number} score
 * @property {ScoreBreakdown | null | undefined} [scoreBreakdown]
 */

/**
 * @typedef {object} AggregatedContributions
 * @property {ContributionInput[]} contributions
 * @property {ContributionInput} primary
 * @property {number} totalScore
 * @property {KolMetrics} aggregatedMetrics
 * @property {number} postCount
 */

/**
 * Keep the top-N posts by score and sum their scores.
 * Per-post scoring (caps / integrity) already ran via scoreSubmission.
 * @param {ContributionInput[]} rows
 * @param {number} [maxCount]
 * @returns {AggregatedContributions | null}
 */
export function aggregateContributions(rows, maxCount = MAX_CONTRIBUTIONS_PER_HANDLE) {
  const limit = Number.isFinite(maxCount) && maxCount > 0 ? Math.floor(maxCount) : MAX_CONTRIBUTIONS_PER_HANDLE;

  /** @type {Map<string, ContributionInput>} */
  const byTweetId = new Map();
  for (const row of rows || []) {
    const tweetId = String(row?.tweetId || "").trim();
    if (!tweetId) continue;
    const score = Number(row.score) || 0;
    const existing = byTweetId.get(tweetId);
    if (existing) {
      const existingTotal = metricsEngagementTotal(existing.metrics);
      const newTotal = metricsEngagementTotal(row.metrics);
      if (existing.score > score) continue;
      if (existing.score === score && existingTotal >= newTotal) continue;
    }
    byTweetId.set(tweetId, {
      tweetId,
      tweetUrl: String(row.tweetUrl || "").trim(),
      mode: row.mode === "quote" ? "quote" : "reply",
      metrics: {
        likeCount: toNonNegativeInt(row.metrics?.likeCount),
        retweetCount: toNonNegativeInt(row.metrics?.retweetCount),
        replyCount: toNonNegativeInt(row.metrics?.replyCount),
        quoteCount: toNonNegativeInt(row.metrics?.quoteCount),
        viewCount: toNonNegativeInt(row.metrics?.viewCount),
      },
      score,
      scoreBreakdown: row.scoreBreakdown ?? null,
    });
  }

  const sorted = [...byTweetId.values()].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return metricsEngagementTotal(b.metrics) - metricsEngagementTotal(a.metrics);
  });

  if (sorted.length === 0) return null;

  const contributions = sorted.slice(0, limit);
  const primary = contributions[0];
  const totalScore = roundScore(contributions.reduce((sum, c) => sum + (c.score || 0), 0));

  /** @type {KolMetrics} */
  const aggregatedMetrics = {
    likeCount: 0,
    retweetCount: 0,
    replyCount: 0,
    quoteCount: 0,
    viewCount: 0,
  };
  for (const c of contributions) {
    aggregatedMetrics.likeCount += toNonNegativeInt(c.metrics.likeCount);
    aggregatedMetrics.retweetCount += toNonNegativeInt(c.metrics.retweetCount);
    aggregatedMetrics.replyCount += toNonNegativeInt(c.metrics.replyCount);
    aggregatedMetrics.quoteCount += toNonNegativeInt(c.metrics.quoteCount);
    aggregatedMetrics.viewCount += toNonNegativeInt(c.metrics.viewCount);
  }

  return {
    contributions,
    primary,
    totalScore,
    aggregatedMetrics,
    postCount: contributions.length,
  };
}

/**
 * @param {string} url
 * @returns {string | null}
 */
export function parseTweetIdFromUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return null;

  const patterns = [
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/i,
    /status\/(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = raw.match(pattern);
    if (match?.[1]) return match[1];
  }

  if (/^\d{5,}$/.test(raw)) return raw;
  return null;
}

/**
 * Extract the author @handle from an X/Twitter status URL.
 * e.g. https://x.com/Web3Divaa/status/123 → "Web3Divaa"
 * Does not call the X API. Caller should normalize for keys.
 * @param {string} url
 * @returns {string | null}
 */
export function parseHandleFromTweetUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return null;

  const match = raw.match(
    /(?:twitter\.com|x\.com)\/([A-Za-z0-9_]{1,15})\/status(?:es)?\/\d+/i,
  );
  if (!match?.[1]) return null;

  const handle = match[1].replace(/^@/, "");
  const key = handle.toLowerCase();
  // Reject reserved path segments that are not real handles.
  if (
    key === "i" ||
    key === "intent" ||
    key === "share" ||
    key === "home" ||
    key === "explore" ||
    key === "search"
  ) {
    return null;
  }
  return handle;
}

/**
 * @param {string} wallet
 * @returns {string}
 */
export function normalizeWallet(wallet) {
  return String(wallet || "").trim();
}

/**
 * @param {{ followers?: number; verified?: boolean }} author
 * @returns {KolAuthorContext}
 */
function authorContextFromTweet(author) {
  return {
    followers: toNonNegativeInt(author?.followers),
    verified: Boolean(author?.verified),
  };
}

/**
 * @param {string} sourceTweetId
 * @param {string} submissionTweetUrl
 */
export async function validateSubmissionTweet(sourceTweetId, submissionTweetUrl) {
  if (!isTwitterApiIoConfigured()) {
    const err = new Error("TWITTER_API_KEY is not configured");
    err.code = "twitterapi_unavailable";
    throw err;
  }

  const submissionTweetId = parseTweetIdFromUrl(submissionTweetUrl);
  if (!submissionTweetId) {
    const err = new Error("Invalid tweet URL");
    err.code = "invalid_tweet_url";
    throw err;
  }

  const sourceId = String(sourceTweetId || "").trim();
  if (!sourceId) {
    const err = new Error("Invalid source tweet");
    err.code = "invalid_source_tweet";
    throw err;
  }

  const { tweet } = await getTweetById(submissionTweetId);

  const replyTo = tweet.inReplyToId != null ? String(tweet.inReplyToId) : null;
  const quoted = tweet.quotedTweetId != null ? String(tweet.quotedTweetId) : null;

  let mode = null;
  if (replyTo === sourceId) {
    mode = "reply";
  } else if (quoted === sourceId) {
    mode = "quote";
  }

  if (!mode) {
    const err = new Error("Tweet must be a reply or quote of the campaign post");
    err.code = "submission_not_related";
    throw err;
  }

  const authorContext = authorContextFromTweet(tweet.author);
  const { score, breakdown } = scoreSubmission(tweet.metrics, authorContext);

  return {
    tweet,
    mode,
    score,
    scoreBreakdown: breakdown,
    metrics: tweet.metrics,
    authorHandle: tweet.author.userName,
    authorFollowers: authorContext.followers,
    authorVerified: authorContext.verified,
    tweetId: tweet.id,
    tweetUrl: tweet.url,
  };
}

/**
 * Refresh metrics for a submission tweet.
 * @param {string} tweetId
 */
export async function refreshSubmissionMetrics(tweetId) {
  const { tweet } = await getTweetById(tweetId);
  const authorContext = authorContextFromTweet(tweet.author);
  const { score, breakdown } = scoreSubmission(tweet.metrics, authorContext);
  return {
    metrics: tweet.metrics,
    score,
    scoreBreakdown: breakdown,
    authorHandle: tweet.author.userName,
    authorFollowers: authorContext.followers,
    authorVerified: authorContext.verified,
  };
}

/**
 * @param {Array<{ _id: unknown; kolWallet?: string; payoutScore?: number; latestScore?: number; latestMetrics?: KolMetrics }>} submissions
 * @returns {Array<{ submissionId: unknown; kolWallet: string | undefined; score: number; payoutScore: number; latestMetrics?: KolMetrics }>}
 */
function rewardEligibleScoredRows(submissions) {
  return (submissions || [])
    .map((s) => {
      const payoutScore = Number(s.payoutScore ?? s.latestScore) || 0;
      return {
        submissionId: s._id,
        kolWallet: s.kolWallet,
        score: Number(s.latestScore) || 0,
        payoutScore,
        latestMetrics: s.latestMetrics,
      };
    })
    .filter((s) => s.payoutScore > 0 && hasRewardEngagement(s.latestMetrics))
    .sort((a, b) => b.payoutScore - a.payoutScore);
}

/**
 * Pro-rata allocate a lamport pool by payoutScore.
 * @param {Array<{ submissionId: unknown; kolWallet?: string; score: number; payoutScore: number }>} eligible
 * @param {bigint} pool
 */
function allocateProRataByPayoutScore(eligible, pool) {
  if (pool <= 0n || eligible.length === 0) return [];

  const totalScore = eligible.reduce((sum, s) => sum + s.payoutScore, 0);
  if (totalScore <= 0) return [];

  const rows = eligible.map((s) => {
    const share = s.payoutScore / totalScore;
    const lamports = BigInt(Math.floor(share * Number(pool)));
    return {
      submissionId: s.submissionId,
      kolWallet: s.kolWallet,
      score: s.score,
      payoutScore: s.payoutScore,
      lamports: lamports > 0n ? lamports : 0n,
    };
  });

  const allocated = rows.reduce((sum, r) => sum + r.lamports, 0n);
  let remainder = pool - allocated;
  const sorted = [...rows].sort((a, b) => b.payoutScore - a.payoutScore);
  let i = 0;
  while (remainder > 0n && sorted.length > 0) {
    sorted[i % sorted.length].lamports += 1n;
    remainder -= 1n;
    i += 1;
  }

  return rows
    .filter((r) => r.lamports > 0n)
    .map((r) => ({
      submissionId: r.submissionId,
      kolWallet: r.kolWallet,
      score: r.score,
      payoutScore: r.payoutScore,
      lamports: Number(r.lamports),
    }));
}

/**
 * @param {Array<{ _id: unknown; kolWallet: string; latestScore: number; payoutScore?: number; latestMetrics?: KolMetrics }>} submissions
 * @param {number} rewardLamports
 */
export function computeProRataPayouts(submissions, rewardLamports) {
  const pool = BigInt(Math.floor(Number(rewardLamports) || 0));
  if (pool <= 0n) return [];
  return allocateProRataByPayoutScore(rewardEligibleScoredRows(submissions), pool);
}

/**
 * Campaign payouts with optional top-N pool split.
 * Uses payoutScore when present (creator bonus), else latestScore.
 * @param {Array<{ _id: unknown; kolWallet: string; latestScore: number; payoutScore?: number; latestMetrics?: KolMetrics }>} submissions
 * @param {number} rewardLamports
 * @param {{ topN?: number | null; topNShareBps?: number | null }} [opts]
 */
export function computeCampaignPayouts(submissions, rewardLamports, opts = {}) {
  const pool = BigInt(Math.floor(Number(rewardLamports) || 0));
  if (pool <= 0n) return [];

  const eligible = rewardEligibleScoredRows(submissions);
  if (eligible.length === 0) return [];

  const topNRaw = opts.topN;
  const topN =
    topNRaw != null && Number.isFinite(Number(topNRaw)) && Number(topNRaw) > 0
      ? Math.min(100, Math.floor(Number(topNRaw)))
      : null;

  if (!topN || topN >= eligible.length) {
    return allocateProRataByPayoutScore(eligible, pool);
  }

  const shareBpsRaw = Number(opts.topNShareBps);
  const shareBps = Number.isFinite(shareBpsRaw)
    ? Math.min(10_000, Math.max(0, Math.floor(shareBpsRaw)))
    : 10_000;

  const topBucket = eligible.slice(0, topN);
  const restBucket = eligible.slice(topN);
  const topPool = (pool * BigInt(shareBps)) / 10_000n;
  const restPool = pool - topPool;

  /** @type {Map<string, ReturnType<typeof allocateProRataByPayoutScore>[number]>} */
  const byId = new Map();
  for (const row of allocateProRataByPayoutScore(topBucket, topPool)) {
    byId.set(String(row.submissionId), row);
  }
  if (restBucket.length > 0 && restPool > 0n && shareBps < 10_000) {
    for (const row of allocateProRataByPayoutScore(restBucket, restPool)) {
      const key = String(row.submissionId);
      const existing = byId.get(key);
      if (existing) {
        existing.lamports += row.lamports;
      } else {
        byId.set(key, row);
      }
    }
  } else if (restPool > 0n && restBucket.length === 0) {
    // No rest engagers — dust stays unallocated (creator refund on finalize).
  }

  return [...byId.values()].filter((r) => r.lamports > 0);
}

/**
 * @param {string} sourceTweetUrl
 */
export async function fetchSourceTweet(sourceTweetUrl) {
  const tweetId = parseTweetIdFromUrl(sourceTweetUrl);
  if (!tweetId) {
    const err = new Error("Invalid source tweet URL");
    err.code = "invalid_tweet_url";
    throw err;
  }

  const { tweet } = await getTweetById(tweetId);
  return tweet;
}
