/**
 * Tier-2 engager authenticity audit for KOL campaign payouts.
 * Samples one page of replies + quotes per audited post and scores engager quality.
 * Designed to run once at finalize for top payout-eligible submissions only (cheap).
 */
import {
  AUTHENTICITY_AUDIT_TOP_N,
  AUTHENTICITY_CEILING,
  AUTHENTICITY_FLOOR,
  AUTHENTICITY_HOLD_THRESHOLD,
  AUTHENTICITY_MAX_FOLLOWING_RATIO,
  AUTHENTICITY_MIN_ACCOUNT_AGE_DAYS,
  AUTHENTICITY_MIN_FOLLOWERS,
  AUTHENTICITY_VERIFIED_ENGAGER_CAP,
} from "../config/kolScoringConfig.js";
import KolXVerification from "../models/KolXVerification.js";
import {
  getTweetQuotes,
  getTweetReplies,
  isTwitterApiIoConfigured,
} from "./twitterApiIoClient.js";

const SPAM_PATTERNS = [
  /^(nice|great|awesome|cool|good|wow|interesting|amazing|love this|gm|gn)[.!]*$/i,
  /^(follow|check|visit|dm|link in bio)\b/i,
  /free\s+(airdrop|nft|token|sol)/i,
  /https?:\/\/\S+/i,
];

/**
 * @param {unknown} value
 * @returns {number}
 */
function toNonNegativeInt(value) {
  const n = Math.floor(Number(value) || 0);
  return n > 0 ? n : 0;
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function toEpochMs(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    const t = value.getTime();
    return Number.isFinite(t) ? t : null;
  }
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : null;
}

/**
 * @param {string} handle
 * @returns {string}
 */
export function normalizeHandleKey(handle) {
  return String(handle || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

/**
 * Normalize comment text for near-duplicate detection.
 * @param {string} text
 * @returns {string}
 */
export function normalizeCommentText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/@\w+/g, " ")
    .replace(/#\w+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} text
 * @returns {boolean}
 */
export function looksLikeSpamComment(text) {
  const raw = String(text || "").trim();
  if (!raw) return true;
  if (raw.length < 3) return true;
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(raw)) return true;
  }
  return false;
}

/**
 * Score a single engager account (0–1).
 * @param {{
 *   followers?: number;
 *   following?: number;
 *   profilePicture?: string | null;
 *   description?: string;
 *   createdAt?: string | Date | null;
 *   verified?: boolean;
 * }} author
 * @param {{ now?: Date | number; isS3Verified?: boolean }} [opts]
 * @returns {{ score: number; reasons: string[] }}
 */
export function scoreEngagerAccount(author, opts = {}) {
  const reasons = [];
  let score = 1;

  const followers = toNonNegativeInt(author?.followers);
  const following = toNonNegativeInt(author?.following);
  const nowMs = toEpochMs(opts.now) ?? Date.now();
  const createdMs = toEpochMs(author?.createdAt);
  const ageDays =
    createdMs != null ? Math.max(0, (nowMs - createdMs) / (24 * 60 * 60 * 1000)) : null;

  if (ageDays != null && ageDays < AUTHENTICITY_MIN_ACCOUNT_AGE_DAYS) {
    reasons.push("young_account");
    score *= ageDays < 7 ? 0.25 : 0.5;
  } else if (ageDays == null) {
    reasons.push("unknown_account_age");
    score *= 0.85;
  }

  if (followers < AUTHENTICITY_MIN_FOLLOWERS) {
    reasons.push("low_followers");
    score *= followers < 5 ? 0.3 : 0.55;
  }

  const hasAvatar =
    Boolean(author?.profilePicture) &&
    !/default_profile/i.test(String(author.profilePicture));
  if (!hasAvatar) {
    reasons.push("no_avatar");
    score *= 0.7;
  }

  const bio = String(author?.description || "").trim();
  if (!bio) {
    reasons.push("empty_bio");
    score *= 0.85;
  }

  if (following > 0 && followers / Math.max(1, following) < 1 / AUTHENTICITY_MAX_FOLLOWING_RATIO) {
    // Extremely follow-heavy relative to followers (common bot shape).
    reasons.push("follow_ratio");
    score *= 0.6;
  } else if (following >= 2000 && followers < 50) {
    reasons.push("follow_ratio");
    score *= 0.65;
  }

  if (author?.verified) {
    score = Math.min(1, score + 0.1);
  }

  if (opts.isS3Verified) {
    score = Math.min(1, Math.max(score, 0.95));
    reasons.push("s3labs_verified");
  }

  return {
    score: Math.round(Math.max(0, Math.min(1, score)) * 1000) / 1000,
    reasons,
  };
}

/**
 * Aggregate sample tweets into an authenticity multiplier.
 * @param {Array<{ text?: string; author?: Record<string, unknown> }>} tweets
 * @param {{ verifiedHandleKeys?: Set<string>; now?: Date | number }} [opts]
 * @returns {{
 *   multiplier: number;
 *   sampleSize: number;
 *   qualityShare: number;
 *   duplicateShare: number;
 *   mixedCreationWeekShare: number;
 *   reasons: string[];
 *   flaggedHandles: string[];
 * }}
 */
export function computeAuthenticityFromSample(tweets, opts = {}) {
  const sample = Array.isArray(tweets) ? tweets.filter(Boolean) : [];
  const verifiedHandleKeys = opts.verifiedHandleKeys ?? new Set();
  const now = opts.now ?? Date.now();

  if (sample.length === 0) {
    // No sample available — do not slash; leave multiplier neutral.
    return {
      multiplier: AUTHENTICITY_CEILING,
      sampleSize: 0,
      qualityShare: 1,
      duplicateShare: 0,
      mixedCreationWeekShare: 0,
      reasons: ["no_sample"],
      flaggedHandles: [],
    };
  }

  /** @type {Map<string, number>} */
  const textCounts = new Map();
  /** @type {Map<string, number>} */
  const creationWeekCounts = new Map();
  /** @type {Map<string, number>} */
  const verifiedWeightUsed = new Map();

  let qualityWeight = 0;
  let totalWeight = 0;
  /** @type {string[]} */
  const reasons = [];
  /** @type {Set<string>} */
  const flagged = new Set();
  let spamCount = 0;

  for (const tweet of sample) {
    const author = tweet?.author && typeof tweet.author === "object" ? tweet.author : {};
    const handleKey = normalizeHandleKey(author.userName);
    if (!handleKey) continue;

    const isS3Verified = verifiedHandleKeys.has(handleKey);
    const { score: accountScore, reasons: accountReasons } = scoreEngagerAccount(author, {
      now,
      isS3Verified,
    });

    let weight = 1;
    if (isS3Verified) {
      const used = verifiedWeightUsed.get(handleKey) ?? 0;
      if (used >= AUTHENTICITY_VERIFIED_ENGAGER_CAP) {
        continue;
      }
      verifiedWeightUsed.set(handleKey, used + 1);
      weight = 1.25;
    }

    const textKey = normalizeCommentText(tweet.text || "");
    if (textKey) {
      textCounts.set(textKey, (textCounts.get(textKey) ?? 0) + 1);
    }

    if (looksLikeSpamComment(tweet.text || "")) {
      spamCount += 1;
    }

    const createdMs = toEpochMs(author.createdAt);
    if (createdMs != null) {
      const weekKey = String(Math.floor(createdMs / (7 * 24 * 60 * 60 * 1000)));
      creationWeekCounts.set(weekKey, (creationWeekCounts.get(weekKey) ?? 0) + 1);
    }

    const effectiveScore =
      accountScore *
      (looksLikeSpamComment(tweet.text || "") ? 0.4 : 1) *
      (textKey && (textCounts.get(textKey) ?? 0) > 2 ? 0.5 : 1);

    qualityWeight += effectiveScore * weight;
    totalWeight += weight;

    if (accountScore < 0.5 || accountReasons.includes("young_account")) {
      flagged.add(handleKey);
      for (const r of accountReasons) {
        if (!reasons.includes(r)) reasons.push(r);
      }
    }
  }

  const qualityShare = totalWeight > 0 ? qualityWeight / totalWeight : 1;

  let duplicatePairs = 0;
  for (const count of textCounts.values()) {
    if (count >= 3) duplicatePairs += count;
  }
  const duplicateShare = sample.length > 0 ? duplicatePairs / sample.length : 0;
  if (duplicateShare >= 0.25) {
    reasons.push("duplicate_comments");
  }

  let maxWeekShare = 0;
  for (const count of creationWeekCounts.values()) {
    maxWeekShare = Math.max(maxWeekShare, count / sample.length);
  }
  if (maxWeekShare >= 0.4 && sample.length >= 8) {
    reasons.push("same_creation_week_batch");
  }

  if (spamCount / sample.length >= 0.35) {
    reasons.push("spam_comments");
  }

  let multiplier = qualityShare;
  if (duplicateShare >= 0.25) multiplier *= 0.7;
  if (maxWeekShare >= 0.4 && sample.length >= 8) multiplier *= 0.75;
  if (spamCount / sample.length >= 0.35) multiplier *= 0.8;

  multiplier = Math.max(
    AUTHENTICITY_FLOOR,
    Math.min(AUTHENTICITY_CEILING, multiplier),
  );
  multiplier = Math.round(multiplier * 1000) / 1000;

  return {
    multiplier,
    sampleSize: sample.length,
    qualityShare: Math.round(qualityShare * 1000) / 1000,
    duplicateShare: Math.round(duplicateShare * 1000) / 1000,
    mixedCreationWeekShare: Math.round(maxWeekShare * 1000) / 1000,
    reasons,
    flaggedHandles: [...flagged].slice(0, 20),
  };
}

/**
 * @param {string} tweetId
 * @returns {Promise<Array<{ text?: string; author?: Record<string, unknown> }>>}
 */
async function sampleEngagersForTweet(tweetId) {
  const id = String(tweetId || "").trim();
  if (!id) return [];

  const [replies, quotes] = await Promise.all([
    getTweetReplies({ tweetId: id }).catch((e) => {
      console.warn(
        `[kol] authenticity replies fetch failed tweet=${id}:`,
        e instanceof Error ? e.message : e,
      );
      return { tweets: [] };
    }),
    getTweetQuotes({ tweetId: id }).catch((e) => {
      console.warn(
        `[kol] authenticity quotes fetch failed tweet=${id}:`,
        e instanceof Error ? e.message : e,
      );
      return { tweets: [] };
    }),
  ]);

  /** @type {Map<string, { text?: string; author?: Record<string, unknown> }>} */
  const byId = new Map();
  for (const tweet of [...(replies.tweets || []), ...(quotes.tweets || [])]) {
    if (!tweet?.id) continue;
    byId.set(String(tweet.id), tweet);
  }
  return [...byId.values()];
}

/**
 * @param {Array<{
 *   _id: unknown;
 *   latestScore?: number;
 *   payoutScore?: number;
 *   tweetId?: string;
 *   contributions?: Array<{ tweetId?: string; score?: number }>;
 *   latestMetrics?: object;
 *   scoreBreakdown?: { integrityFlags?: string[] } | null;
 * }>} submissions
 * @param {{ topN?: number }} [opts]
 */
export async function auditCampaignAuthenticity(submissions, opts = {}) {
  const topN = opts.topN ?? AUTHENTICITY_AUDIT_TOP_N;
  const ranked = [...(submissions || [])]
    .map((s) => ({
      submission: s,
      rankScore: Number(s.payoutScore ?? s.latestScore) || 0,
    }))
    .filter((row) => row.rankScore > 0)
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, topN);

  if (ranked.length === 0) {
    return { audited: 0, results: [] };
  }

  if (!isTwitterApiIoConfigured()) {
    console.warn("[kol] authenticity audit skipped — TWITTER_API_KEY missing");
    return {
      audited: 0,
      results: ranked.map(({ submission }) => ({
        submissionId: String(submission._id),
        multiplier: AUTHENTICITY_CEILING,
        skipped: true,
        reason: "twitterapi_unavailable",
      })),
    };
  }

  const verifiedRows = await KolXVerification.find({ status: "verified" })
    .select("xHandleKey")
    .lean();
  const verifiedHandleKeys = new Set(
    verifiedRows.map((r) => normalizeHandleKey(r.xHandleKey)).filter(Boolean),
  );

  const now = Date.now();
  /** @type {Array<Record<string, unknown>>} */
  const results = [];

  for (const { submission } of ranked) {
    const contributionIds =
      Array.isArray(submission.contributions) && submission.contributions.length > 0
        ? [...submission.contributions]
            .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
            .slice(0, 2)
            .map((c) => String(c.tweetId || "").trim())
            .filter(Boolean)
        : [String(submission.tweetId || "").trim()].filter(Boolean);

    /** @type {Array<{ text?: string; author?: Record<string, unknown> }>} */
    let sample = [];
    for (const tweetId of contributionIds) {
      const part = await sampleEngagersForTweet(tweetId);
      sample = sample.concat(part);
    }

    // Dedupe engagers by handle — keep first comment.
    /** @type {Map<string, { text?: string; author?: Record<string, unknown> }>} */
    const byHandle = new Map();
    for (const tweet of sample) {
      const key = normalizeHandleKey(tweet?.author?.userName);
      if (!key || byHandle.has(key)) continue;
      byHandle.set(key, tweet);
    }
    sample = [...byHandle.values()];

    const computed = computeAuthenticityFromSample(sample, {
      verifiedHandleKeys,
      now,
    });

    results.push({
      submissionId: String(submission._id),
      multiplier: computed.multiplier,
      sampleSize: computed.sampleSize,
      qualityShare: computed.qualityShare,
      duplicateShare: computed.duplicateShare,
      mixedCreationWeekShare: computed.mixedCreationWeekShare,
      reasons: computed.reasons,
      flaggedHandles: computed.flaggedHandles,
      auditedTweetIds: contributionIds,
      holdRecommended:
        computed.multiplier < AUTHENTICITY_HOLD_THRESHOLD ||
        (Array.isArray(submission.scoreBreakdown?.integrityFlags) &&
          submission.scoreBreakdown.integrityFlags.some((f) =>
            ["engagement_spike", "late_surge"].includes(f),
          ) &&
          computed.multiplier < 0.7),
    });
  }

  return { audited: results.length, results };
}

/**
 * Decide claim status after authenticity audit.
 * @param {{
 *   earnedLamports: number;
 *   authenticityMultiplier?: number | null;
 *   integrityFlags?: string[] | null;
 *   holdRecommended?: boolean;
 * }} input
 * @returns {"unearned" | "claimable" | "held_review"}
 */
export function resolveClaimStatusAfterAudit(input) {
  const earned = Math.floor(Number(input.earnedLamports) || 0);
  if (earned <= 0) return "unearned";

  const multiplier =
    input.authenticityMultiplier == null
      ? AUTHENTICITY_CEILING
      : Number(input.authenticityMultiplier);
  const flags = Array.isArray(input.integrityFlags) ? input.integrityFlags : [];
  const velocityFlagged = flags.some((f) =>
    ["engagement_spike", "late_surge"].includes(f),
  );

  if (
    input.holdRecommended === true ||
    multiplier < AUTHENTICITY_HOLD_THRESHOLD ||
    (velocityFlagged && multiplier < 0.7)
  ) {
    return "held_review";
  }

  return "claimable";
}
