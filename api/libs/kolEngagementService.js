/**
 * KOL marketplace engagement scoring and tweet validation.
 */
import { getTweetById, isTwitterApiIoConfigured } from "./twitterApiIoClient.js";

const VIEW_CAP = 50_000;

/**
 * @param {{ likeCount?: number; retweetCount?: number; replyCount?: number; quoteCount?: number; viewCount?: number } | null | undefined} metrics
 * @returns {number}
 */
export function computeEngagementScore(metrics) {
  return (
    (metrics?.likeCount ?? 0) * 1.0 +
    (metrics?.retweetCount ?? 0) * 2.5 +
    (metrics?.replyCount ?? 0) * 1.5 +
    (metrics?.quoteCount ?? 0) * 2.0 +
    Math.min(metrics?.viewCount ?? 0, VIEW_CAP) * 0.001
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
 * @param {string} wallet
 * @returns {string}
 */
export function normalizeWallet(wallet) {
  return String(wallet || "").trim();
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

  let mode = null;
  if (tweet.inReplyToId === sourceId) {
    mode = "reply";
  } else if (tweet.quotedTweetId === sourceId) {
    mode = "quote";
  }

  if (!mode) {
    const err = new Error("Tweet must be a reply or quote of the campaign post");
    err.code = "submission_not_related";
    throw err;
  }

  const score = roundScore(computeEngagementScore(tweet.metrics));

  return {
    tweet,
    mode,
    score,
    metrics: tweet.metrics,
    authorHandle: tweet.author.userName,
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
  const score = roundScore(computeEngagementScore(tweet.metrics));
  return {
    metrics: tweet.metrics,
    score,
    authorHandle: tweet.author.userName,
  };
}

/**
 * @param {Array<{ _id: unknown; kolWallet: string; latestScore: number }>} submissions
 * @param {number} rewardLamports
 */
export function computeProRataPayouts(submissions, rewardLamports) {
  const pool = BigInt(Math.floor(Number(rewardLamports) || 0));
  if (pool <= 0n) return [];

  const eligible = submissions.filter((s) => (s.latestScore ?? 0) > 0);
  const totalScore = eligible.reduce((sum, s) => sum + (s.latestScore ?? 0), 0);
  if (totalScore <= 0) return [];

  const rows = eligible.map((s) => {
    const share = (s.latestScore ?? 0) / totalScore;
    const lamports = BigInt(Math.floor(share * Number(pool)));
    return {
      submissionId: s._id,
      kolWallet: s.kolWallet,
      score: s.latestScore ?? 0,
      lamports: lamports > 0n ? lamports : 0n,
    };
  });

  const allocated = rows.reduce((sum, r) => sum + r.lamports, 0n);
  let remainder = pool - allocated;

  const sorted = [...rows].sort((a, b) => b.score - a.score);
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
      lamports: Number(r.lamports),
    }));
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
