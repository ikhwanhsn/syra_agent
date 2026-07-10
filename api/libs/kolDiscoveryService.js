/**
 * Auto-discover KOL engagers (replies + quotes) for active campaigns.
 */
import KolCampaign from "../models/KolCampaign.js";
import KolSubmission from "../models/KolSubmission.js";
import KolEngagementSnapshot from "../models/KolEngagementSnapshot.js";
import {
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
  return Number.isFinite(n) && n >= 60_000 ? n : 6 * 60 * 60 * 1000;
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
 * @param {string} sourceTweetId
 * @param {string} sourceAuthorHandleKey
 * @param {"reply" | "quote"} mode
 * @param {(opts: { tweetId: string; cursor?: string | null }) => Promise<{ tweets: unknown[]; hasNextPage: boolean; nextCursor: string | null }>} fetchPage
 */
async function collectEngagements(sourceTweetId, sourceAuthorHandleKey, mode, fetchPage) {
  /** @type {Map<string, { tweet: Record<string, unknown>; mode: "reply" | "quote"; score: number; scoreBreakdown: unknown; metrics: unknown; authorHandle: string; authorHandleKey: string; authorFollowers: number; authorVerified: boolean; tweetId: string; tweetUrl: string }>} */
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

      const authorContext = authorContextFromTweet(tweet.author);
      const { score, breakdown } = scoreSubmission(tweet.metrics, authorContext);

      const existing = byHandle.get(authorHandleKey);
      if (existing) {
        const existingTotal = metricsEngagementTotal(existing.metrics);
        const newTotal = metricsEngagementTotal(tweet.metrics);
        if (existing.score > score) continue;
        if (existing.score === score && existingTotal >= newTotal) continue;
      }

      byHandle.set(authorHandleKey, {
        tweet,
        mode,
        score,
        scoreBreakdown: breakdown,
        metrics: tweet.metrics,
        authorHandle,
        authorHandleKey,
        authorFollowers: authorContext.followers,
        authorVerified: authorContext.verified,
        tweetId: tweet.id,
        tweetUrl: tweet.url,
      });
    }

    pages += 1;
    if (!page.hasNextPage || !page.nextCursor) break;
    cursor = page.nextCursor;
  }

  return [...byHandle.values()];
}

/**
 * Discover and upsert submissions for one active campaign.
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

  /** @type {Map<string, typeof replies[number]>} */
  const bestByHandle = new Map();
  for (const row of [...replies, ...quotes]) {
    const existing = bestByHandle.get(row.authorHandleKey);
    if (!existing) {
      bestByHandle.set(row.authorHandleKey, row);
      continue;
    }
    const existingTotal = metricsEngagementTotal(existing.metrics);
    const rowTotal = metricsEngagementTotal(row.metrics);
    if (
      row.score > existing.score ||
      (row.score === existing.score && rowTotal > existingTotal)
    ) {
      bestByHandle.set(row.authorHandleKey, row);
    }
  }

  const capturedAt = new Date();
  let discovered = 0;
  let updated = 0;

  for (const row of bestByHandle.values()) {
    const existing = await KolSubmission.findOne({
      campaignId: campaign._id,
      authorHandleKey: row.authorHandleKey,
    });

    if (existing) {
      const shouldUpdate =
        row.score > (existing.latestScore ?? 0) ||
        row.tweetId !== existing.tweetId ||
        metricsIncreased(existing.latestMetrics, row.metrics);

      if (shouldUpdate) {
        existing.tweetId = row.tweetId;
        existing.tweetUrl = row.tweetUrl;
        existing.mode = row.mode;
        existing.authorHandle = row.authorHandle;
        existing.latestMetrics = row.metrics;
        existing.latestScore = row.score;
        existing.scoreBreakdown = row.scoreBreakdown;
        existing.authorFollowers = row.authorFollowers;
        existing.authorVerified = row.authorVerified;
        await existing.save();
        updated += 1;
      }

      await KolEngagementSnapshot.create({
        campaignId: campaign._id,
        submissionId: existing._id,
        capturedAt,
        metrics: row.metrics,
        score: row.score,
        scoreBreakdown: row.scoreBreakdown,
      });
      continue;
    }

    try {
      const submission = await KolSubmission.create({
        campaignId: campaign._id,
        kolWallet: null,
        tweetId: row.tweetId,
        tweetUrl: row.tweetUrl,
        mode: row.mode,
        authorHandle: row.authorHandle,
        authorHandleKey: row.authorHandleKey,
        authorFollowers: row.authorFollowers,
        authorVerified: row.authorVerified,
        verified: true,
        latestMetrics: row.metrics,
        latestScore: row.score,
        scoreBreakdown: row.scoreBreakdown,
        projectedLamports: 0,
        earnedLamports: 0,
        claimStatus: "unearned",
        discoveredAt: capturedAt,
      });

      await KolEngagementSnapshot.create({
        campaignId: campaign._id,
        submissionId: submission._id,
        capturedAt,
        metrics: row.metrics,
        score: row.score,
        scoreBreakdown: row.scoreBreakdown,
      });

      await seedXProfileFromAuthor({
        userName: row.authorHandle,
        verified: row.authorVerified,
      }).catch(() => {});

      discovered += 1;
    } catch (e) {
      if (e && typeof e === "object" && /** @type {{ code?: number }} */ (e).code === 11000) {
        continue;
      }
      console.warn(
        `[kol] discovery upsert failed campaign=${campaign._id} handle=${row.authorHandle}:`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  const { refreshCampaignProjections } = await import("./kolMarketplaceService.js");
  await refreshCampaignProjections(campaign._id);

  return {
    discovered,
    updated,
    totalHandles: bestByHandle.size,
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
