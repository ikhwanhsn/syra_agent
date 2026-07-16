/**
 * Auto-discover KOL engagers (replies + quotes) for active campaigns.
 * Combines each handle's top-N posts into one submission score.
 */
import { MAX_CONTRIBUTIONS_PER_HANDLE } from "../config/kolScoringConfig.js";
import KolCampaign from "../models/KolCampaign.js";
import KolSubmission from "../models/KolSubmission.js";
import KolEngagementSnapshot from "../models/KolEngagementSnapshot.js";
import {
  aggregateContributions,
  meetsMinLikes,
  metricsEngagementTotal,
  metricsIncreased,
  scoreSubmission,
} from "./kolEngagementService.js";
import {
  getTweetQuotes,
  getTweetReplies,
  isTwitterApiIoConfigured,
} from "./twitterApiIoClient.js";
import { seedXProfileFromAuthor } from "./kolXProfileCache.js";

const DEFAULT_MAX_PAGES = (() => {
  const n = Number.parseInt(String(process.env.KOL_DISCOVERY_MAX_PAGES ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 10;
})();

const DISCOVERY_FRESH_MS = (() => {
  const n = Number.parseInt(String(process.env.KOL_METRICS_FRESH_MS ?? "").trim(), 10);
  return Number.isFinite(n) && n >= 60_000 ? n : 24 * 60 * 60 * 1000;
})();

/**
 * @param {string} handle
 */
function normalizeHandle(handle) {
  return String(handle || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase();
}

/**
 * @param {{ followers?: number; verified?: boolean }} author
 */
function authorContextFromTweet(author) {
  return {
    followers: Math.max(0, Math.floor(Number(author?.followers) || 0)),
    verified: Boolean(author?.verified),
  };
}

/**
 * @typedef {{
 *   tweetId: string;
 *   tweetUrl: string;
 *   mode: "reply" | "quote";
 *   metrics: Record<string, number>;
 *   score: number;
 *   scoreBreakdown: unknown;
 *   authorHandle: string;
 *   authorHandleKey: string;
 *   authorFollowers: number;
 *   authorVerified: boolean;
 * }} DiscoveredPost
 */

/**
 * Collect all reply/quote posts for a source tweet, keyed by author handle.
 * Dedupes by tweetId within each handle (keeps higher score).
 * @param {string} sourceTweetId
 * @param {string} sourceAuthorHandleKey
 * @param {"reply" | "quote"} mode
 * @param {(opts: { tweetId: string; cursor?: string | null }) => Promise<{ tweets: unknown[]; hasNextPage: boolean; nextCursor: string | null }>} fetchPage
 * @returns {Promise<Map<string, DiscoveredPost[]>>}
 */
async function collectEngagements(sourceTweetId, sourceAuthorHandleKey, mode, fetchPage) {
  /** @type {Map<string, Map<string, DiscoveredPost>>} */
  const byHandle = new Map();
  let cursor = null;
  let pages = 0;

  while (pages < DEFAULT_MAX_PAGES) {
    const page = await fetchPage({
      tweetId: sourceTweetId,
      cursor,
    });

    for (const rawTweet of page.tweets) {
      const tweet = /** @type {Record<string, unknown> & { id: string; url: string; author: { userName: string; followers?: number; verified?: boolean }; metrics: Record<string, number>; inReplyToId?: string | null; quotedTweetId?: string | null }} */ (
        rawTweet
      );
      const authorHandle = String(tweet.author?.userName || "").trim();
      const authorHandleKey = normalizeHandle(authorHandle);
      if (!authorHandleKey) continue;
      if (authorHandleKey === sourceAuthorHandleKey) continue;

      if (mode === "reply" && tweet.inReplyToId !== sourceTweetId) continue;
      if (mode === "quote" && tweet.quotedTweetId !== sourceTweetId) continue;
      if (!meetsMinLikes(tweet.metrics)) continue;

      const authorContext = authorContextFromTweet(tweet.author);
      const { score, breakdown } = scoreSubmission(tweet.metrics, authorContext);

      /** @type {DiscoveredPost} */
      const row = {
        tweetId: tweet.id,
        tweetUrl: tweet.url,
        mode,
        metrics: tweet.metrics,
        score,
        scoreBreakdown: breakdown,
        authorHandle,
        authorHandleKey,
        authorFollowers: authorContext.followers,
        authorVerified: authorContext.verified,
      };

      let posts = byHandle.get(authorHandleKey);
      if (!posts) {
        posts = new Map();
        byHandle.set(authorHandleKey, posts);
      }

      const existing = posts.get(row.tweetId);
      if (existing) {
        const existingTotal = metricsEngagementTotal(existing.metrics);
        const newTotal = metricsEngagementTotal(row.metrics);
        if (existing.score > score) continue;
        if (existing.score === score && existingTotal >= newTotal) continue;
      }
      posts.set(row.tweetId, row);
    }

    pages += 1;
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }

  /** @type {Map<string, DiscoveredPost[]>} */
  const result = new Map();
  for (const [handleKey, posts] of byHandle) {
    result.set(handleKey, [...posts.values()]);
  }
  return result;
}

/**
 * Merge reply + quote maps into one map of posts per handle.
 * @param {Map<string, DiscoveredPost[]>} replies
 * @param {Map<string, DiscoveredPost[]>} quotes
 * @returns {Map<string, DiscoveredPost[]>}
 */
function mergePostsByHandle(replies, quotes) {
  /** @type {Map<string, Map<string, DiscoveredPost>>} */
  const merged = new Map();

  for (const source of [replies, quotes]) {
    for (const [handleKey, posts] of source) {
      let byTweet = merged.get(handleKey);
      if (!byTweet) {
        byTweet = new Map();
        merged.set(handleKey, byTweet);
      }
      for (const post of posts) {
        const existing = byTweet.get(post.tweetId);
        if (existing) {
          const existingTotal = metricsEngagementTotal(existing.metrics);
          const newTotal = metricsEngagementTotal(post.metrics);
          if (existing.score > post.score) continue;
          if (existing.score === post.score && existingTotal >= newTotal) continue;
        }
        byTweet.set(post.tweetId, post);
      }
    }
  }

  /** @type {Map<string, DiscoveredPost[]>} */
  const result = new Map();
  for (const [handleKey, byTweet] of merged) {
    result.set(handleKey, [...byTweet.values()]);
  }
  return result;
}

/**
 * Build contribution rows from an existing submission (legacy-safe).
 * @param {import("../models/KolSubmission.js").default | Record<string, unknown>} existing
 */
function contributionsFromExisting(existing) {
  const stored = Array.isArray(existing.contributions) ? existing.contributions : [];
  if (stored.length > 0) {
    return stored.map((c) => ({
      tweetId: String(c.tweetId || "").trim(),
      tweetUrl: String(c.tweetUrl || "").trim(),
      mode: c.mode === "quote" ? "quote" : "reply",
      metrics: c.metrics || {},
      score: Number(c.score) || 0,
      scoreBreakdown: c.scoreBreakdown ?? null,
    }));
  }

  if (existing.tweetId) {
    return [
      {
        tweetId: String(existing.tweetId),
        tweetUrl: String(existing.tweetUrl || ""),
        mode: existing.mode === "quote" ? "quote" : "reply",
        metrics: existing.latestMetrics || {},
        score: Number(existing.latestScore) || 0,
        scoreBreakdown: existing.scoreBreakdown ?? null,
      },
    ];
  }

  return [];
}

/**
 * Discover and upsert submissions for one active campaign.
 * Stores top-N contributions per handle; latestScore = sum of those scores.
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 * @param {{ force?: boolean }} [opts]
 */
export async function discoverCampaignEngagements(campaignId, opts = {}) {
  if (!isTwitterApiIoConfigured()) {
    return { discovered: 0, skipped: true, reason: "twitterapi_unavailable" };
  }

  const campaign = await KolCampaign.findById(campaignId);
  if (!campaign || campaign.status !== "active") {
    return { discovered: 0, skipped: true, reason: "not_active" };
  }

  if (
    !opts.force &&
    campaign.lastSnapshotAt &&
    Date.now() - new Date(campaign.lastSnapshotAt).getTime() < DISCOVERY_FRESH_MS
  ) {
    return { discovered: 0, skipped: true, reason: "fresh" };
  }

  const sourceTweetId = String(campaign.sourceTweetId || "").trim();
  if (!sourceTweetId) {
    return { discovered: 0, skipped: true, reason: "missing_source_tweet" };
  }

  const sourceAuthorHandleKey = normalizeHandle(campaign.sourceAuthorHandle);

  const [replies, quotes] = await Promise.all([
    collectEngagements(sourceTweetId, sourceAuthorHandleKey, "reply", getTweetReplies),
    collectEngagements(sourceTweetId, sourceAuthorHandleKey, "quote", getTweetQuotes),
  ]);

  const postsByHandle = mergePostsByHandle(replies, quotes);

  const capturedAt = new Date();
  let discovered = 0;
  let updated = 0;

  for (const [authorHandleKey, discoveredPosts] of postsByHandle) {
    if (discoveredPosts.length === 0) continue;

    const sample = discoveredPosts[0];
    const existing = await KolSubmission.findOne({
      campaignId: campaign._id,
      authorHandleKey,
    });

    const mergedRows = [
      ...(existing ? contributionsFromExisting(existing) : []),
      ...discoveredPosts.map((p) => ({
        tweetId: p.tweetId,
        tweetUrl: p.tweetUrl,
        mode: p.mode,
        metrics: p.metrics,
        score: p.score,
        scoreBreakdown: p.scoreBreakdown,
      })),
    ].filter((row) => meetsMinLikes(row.metrics));

    const aggregated = aggregateContributions(mergedRows, MAX_CONTRIBUTIONS_PER_HANDLE);
    if (!aggregated) {
      // New handle with nothing eligible → skip. Existing handle → leave unchanged (no downgrade).
      continue;
    }

    const { contributions, primary, totalScore, aggregatedMetrics } = aggregated;

    if (existing) {
      const shouldUpdate =
        totalScore > (existing.latestScore ?? 0) ||
        primary.tweetId !== existing.tweetId ||
        contributions.length !== (existing.contributions?.length ?? 0) ||
        metricsIncreased(existing.latestMetrics, aggregatedMetrics);

      if (shouldUpdate) {
        existing.tweetId = primary.tweetId;
        existing.tweetUrl = primary.tweetUrl;
        existing.mode = primary.mode;
        existing.authorHandle = sample.authorHandle;
        existing.contributions = contributions;
        existing.latestMetrics = aggregatedMetrics;
        existing.latestScore = totalScore;
        existing.scoreBreakdown = primary.scoreBreakdown ?? null;
        existing.authorFollowers = sample.authorFollowers;
        existing.authorVerified = sample.authorVerified;
        await existing.save();
        updated += 1;
      }

      await KolEngagementSnapshot.create({
        campaignId: campaign._id,
        submissionId: existing._id,
        capturedAt,
        metrics: aggregatedMetrics,
        score: totalScore,
        scoreBreakdown: primary.scoreBreakdown ?? null,
      });
      continue;
    }

    try {
      const submission = await KolSubmission.create({
        campaignId: campaign._id,
        kolWallet: null,
        tweetId: primary.tweetId,
        tweetUrl: primary.tweetUrl,
        mode: primary.mode,
        authorHandle: sample.authorHandle,
        authorHandleKey,
        authorFollowers: sample.authorFollowers,
        authorVerified: sample.authorVerified,
        verified: true,
        contributions,
        latestMetrics: aggregatedMetrics,
        latestScore: totalScore,
        scoreBreakdown: primary.scoreBreakdown ?? null,
        projectedLamports: 0,
        earnedLamports: 0,
        claimStatus: "unearned",
        discoveredAt: capturedAt,
      });

      await KolEngagementSnapshot.create({
        campaignId: campaign._id,
        submissionId: submission._id,
        capturedAt,
        metrics: aggregatedMetrics,
        score: totalScore,
        scoreBreakdown: primary.scoreBreakdown ?? null,
      });

      await seedXProfileFromAuthor({
        userName: sample.authorHandle,
        verified: sample.authorVerified,
      }).catch(() => {});

      discovered += 1;
    } catch (e) {
      if (e && typeof e === "object" && /** @type {{ code?: number }} */ (e).code === 11000) {
        continue;
      }
      console.warn(
        `[kol] discovery upsert failed campaign=${campaign._id} handle=${sample.authorHandle}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  // Discovery is the primary daily snapshot path — mark freshness so ticks skip when fresh.
  campaign.lastSnapshotAt = capturedAt;
  await campaign.save();

  const { refreshCampaignProjections } = await import("./kolMarketplaceService.js");
  await refreshCampaignProjections(campaign._id);

  return {
    discovered,
    updated,
    totalHandles: postsByHandle.size,
    capturedAt: capturedAt.toISOString(),
  };
}

/**
 * Refresh metrics for existing submissions (post-discovery).
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 */
export async function refreshDiscoveredSubmissionMetrics(campaignId) {
  const { refreshCampaignMetrics } = await import("./kolMarketplaceService.js");
  return refreshCampaignMetrics(campaignId);
}
