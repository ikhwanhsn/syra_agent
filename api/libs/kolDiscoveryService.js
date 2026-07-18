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
  metricsEngagementTotal,
  metricsIncreased,
  parseTweetIdFromUrl,
  scoreSubmission,
} from "./kolEngagementService.js";
import {
  advancedSearch,
  getTweetById,
  getTweetQuotes,
  getTweetReplies,
  getTweetsByIds,
  getUserLastTweets,
  isTwitterApiIoConfigured,
} from "./twitterApiIoClient.js";
import { seedXProfileFromAuthor } from "./kolXProfileCache.js";

const DEFAULT_MAX_PAGES = (() => {
  const n = Number.parseInt(String(process.env.KOL_DISCOVERY_MAX_PAGES ?? "").trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 25;
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
 * @param {Map<string, Map<string, DiscoveredPost>>} byHandle
 * @param {Record<string, unknown> & { id: string; url: string; author: { userName: string; followers?: number; verified?: boolean }; metrics: Record<string, number>; inReplyToId?: string | null; quotedTweetId?: string | null }} tweet
 * @param {string} sourceTweetId
 * @param {string} sourceAuthorHandleKey
 * @param {"reply" | "quote"} mode
 */
function ingestDiscoveredTweet(
  byHandle,
  tweet,
  sourceTweetId,
  sourceAuthorHandleKey,
  mode,
) {
  const authorHandle = String(tweet.author?.userName || "").trim();
  const authorHandleKey = normalizeHandle(authorHandle);
  if (!authorHandleKey) return;
  if (authorHandleKey === sourceAuthorHandleKey) return;

  // Trust the replies/quotes endpoint for this source tweet. Only reject when
  // a relation id is present and clearly points at a different post (nested
  // replies). Missing relation fields are common in twitterapi.io payloads and
  // previously caused valid engagers to never appear on the leaderboard.
  if (
    mode === "reply" &&
    tweet.inReplyToId != null &&
    String(tweet.inReplyToId) !== sourceTweetId
  ) {
    return;
  }
  if (
    mode === "quote" &&
    tweet.quotedTweetId != null &&
    String(tweet.quotedTweetId) !== sourceTweetId
  ) {
    return;
  }
  // Include zero-engagement posts on the leaderboard; rewards still require
  // engagement via hasRewardEngagement in payout projection.

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
    if (existing.score > score) return;
    if (existing.score === score && existingTotal >= newTotal) return;
  }
  posts.set(row.tweetId, row);
}

/**
 * @param {Map<string, Map<string, DiscoveredPost>>} byHandle
 * @returns {Map<string, DiscoveredPost[]>}
 */
function finalizeByHandle(byHandle) {
  /** @type {Map<string, DiscoveredPost[]>} */
  const result = new Map();
  for (const [handleKey, posts] of byHandle) {
    result.set(handleKey, [...posts.values()]);
  }
  return result;
}

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

  try {
    while (pages < DEFAULT_MAX_PAGES) {
      const page = await fetchPage({
        tweetId: sourceTweetId,
        cursor,
      });

      for (const rawTweet of page.tweets) {
        const tweet = /** @type {Record<string, unknown> & { id: string; url: string; author: { userName: string; followers?: number; verified?: boolean }; metrics: Record<string, number>; inReplyToId?: string | null; quotedTweetId?: string | null }} */ (
          rawTweet
        );
        ingestDiscoveredTweet(
          byHandle,
          tweet,
          sourceTweetId,
          sourceAuthorHandleKey,
          mode,
        );
      }

      pages += 1;
      if (!page.hasNextPage || !page.nextCursor) break;
      cursor = page.nextCursor;
    }
  } catch (e) {
    // Do not abort the whole campaign snapshot — other sources (quotes/search)
    // can still succeed. Leaving lastSnapshotAt stuck for days was causing
    // "Last update: Nd ago" and missing engagers on high-volume posts.
    console.warn(
      `[kol] discovery ${mode} endpoint failed tweet=${sourceTweetId} pages=${pages}:`,
      e instanceof Error ? e.message : e,
    );
  }

  return finalizeByHandle(byHandle);
}

/**
 * Exhaustive fallback via advanced_search — catches engagers beyond the
 * dedicated replies/quotes endpoint page cap on high-volume campaign posts.
 * @param {string} sourceTweetId
 * @param {string} sourceAuthorHandleKey
 * @param {"reply" | "quote"} mode
 * @returns {Promise<Map<string, DiscoveredPost[]>>}
 */
async function collectEngagementsViaSearch(
  sourceTweetId,
  sourceAuthorHandleKey,
  mode,
) {
  /** @type {Map<string, Map<string, DiscoveredPost>>} */
  const byHandle = new Map();

  const query =
    mode === "reply"
      ? `conversation_id:${sourceTweetId}`
      : `quoted_tweet_id:${sourceTweetId} OR url:${sourceTweetId}`;

  let cursor = null;
  let pages = 0;

  try {
    while (pages < DEFAULT_MAX_PAGES) {
      const page = await advancedSearch({
        query,
        queryType: "Latest",
        cursor,
        skipCache: true,
      });

      for (const rawTweet of page.tweets) {
        const tweet = /** @type {Record<string, unknown> & { id: string; url: string; author: { userName: string; followers?: number; verified?: boolean }; metrics: Record<string, number>; inReplyToId?: string | null; quotedTweetId?: string | null }} */ (
          rawTweet
        );
        // Skip the source tweet itself if search returns it.
        if (String(tweet.id) === sourceTweetId) continue;
        ingestDiscoveredTweet(
          byHandle,
          tweet,
          sourceTweetId,
          sourceAuthorHandleKey,
          mode,
        );
      }

      pages += 1;
      if (!page.hasNextPage || !page.nextCursor) break;
      cursor = page.nextCursor;
    }
  } catch (e) {
    console.warn(
      `[kol] discovery search fallback failed mode=${mode} tweet=${sourceTweetId}:`,
      e instanceof Error ? e.message : e,
    );
  }

  return finalizeByHandle(byHandle);
}

/**
 * Merge any number of handle→posts maps; keeps higher score per tweetId.
 * @param {...Map<string, DiscoveredPost[]>} sources
 * @returns {Map<string, DiscoveredPost[]>}
 */
function mergePostsByHandle(...sources) {
  /** @type {Map<string, Map<string, DiscoveredPost>>} */
  const merged = new Map();

  for (const source of sources) {
    if (!source) continue;
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

  return finalizeByHandle(merged);
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

  // Dedicated endpoints + advanced_search fallback so high-volume threads
  // (beyond ~25 pages of replies/quotes) still surface every engager.
  const [replies, quotes, searchReplies, searchQuotes] = await Promise.all([
    collectEngagements(sourceTweetId, sourceAuthorHandleKey, "reply", getTweetReplies),
    collectEngagements(sourceTweetId, sourceAuthorHandleKey, "quote", getTweetQuotes),
    collectEngagementsViaSearch(sourceTweetId, sourceAuthorHandleKey, "reply"),
    collectEngagementsViaSearch(sourceTweetId, sourceAuthorHandleKey, "quote"),
  ]);

  const postsByHandle = mergePostsByHandle(
    replies,
    quotes,
    searchReplies,
    searchQuotes,
  );

  const capturedAt = new Date();
  let discovered = 0;
  let updated = 0;

  for (const [authorHandleKey, discoveredPosts] of postsByHandle) {
    const result = await upsertHandlePosts(
      campaign,
      authorHandleKey,
      discoveredPosts,
      capturedAt,
    );
    discovered += result.created;
    updated += result.updated;
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
 * Upsert one handle's discovered posts into a submission (+ snapshot).
 * Shared by full-campaign discovery and targeted per-handle discovery.
 * @param {import("../models/KolCampaign.js").default} campaign
 * @param {string} authorHandleKey
 * @param {DiscoveredPost[]} discoveredPosts
 * @param {Date} capturedAt
 * @returns {Promise<{ created: number; updated: number }>}
 */
async function upsertHandlePosts(campaign, authorHandleKey, discoveredPosts, capturedAt) {
  if (!discoveredPosts || discoveredPosts.length === 0) {
    return { created: 0, updated: 0 };
  }

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
  ];

  const aggregated = aggregateContributions(mergedRows, MAX_CONTRIBUTIONS_PER_HANDLE);
  if (!aggregated) {
    // New handle with nothing eligible → skip. Existing handle → leave unchanged (no downgrade).
    return { created: 0, updated: 0 };
  }

  const { contributions, primary, totalScore, aggregatedMetrics } = aggregated;

  if (existing) {
    const shouldUpdate =
      totalScore > (existing.latestScore ?? 0) ||
      primary.tweetId !== existing.tweetId ||
      contributions.length !== (existing.contributions?.length ?? 0) ||
      metricsIncreased(existing.latestMetrics, aggregatedMetrics);

    let updated = 0;
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
      updated = 1;
    }

    await KolEngagementSnapshot.create({
      campaignId: campaign._id,
      submissionId: existing._id,
      capturedAt,
      metrics: aggregatedMetrics,
      score: totalScore,
      scoreBreakdown: primary.scoreBreakdown ?? null,
    });
    return { created: 0, updated };
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

    return { created: 1, updated: 0 };
  } catch (e) {
    if (e && typeof e === "object" && /** @type {{ code?: number }} */ (e).code === 11000) {
      return { created: 0, updated: 0 };
    }
    console.warn(
      `[kol] discovery upsert failed campaign=${campaign._id} handle=${sample.authorHandle}:`,
      e instanceof Error ? e.message : e,
    );
    return { created: 0, updated: 0 };
  }
}

/**
 * Determine whether a tweet engages the source tweet, and how.
 * Tolerant: uses relation ids when present, else falls back to conversation id,
 * quote flags, and source id appearing in the tweet text.
 * @param {Record<string, unknown> & { text?: string; inReplyToId?: string | null; quotedTweetId?: string | null; conversationId?: string | null; isQuote?: boolean }} tweet
 * @param {string} sourceTweetId
 * @returns {"reply" | "quote" | null}
 */
function classifyEngagement(tweet, sourceTweetId) {
  const inReplyToId = tweet.inReplyToId != null ? String(tweet.inReplyToId) : null;
  const quotedTweetId = tweet.quotedTweetId != null ? String(tweet.quotedTweetId) : null;
  const conversationId =
    tweet.conversationId != null ? String(tweet.conversationId) : null;

  if (quotedTweetId === sourceTweetId) return "quote";
  if (inReplyToId === sourceTweetId) return "reply";

  // Quote flag + conversation rooted at the campaign post.
  if (tweet.isQuote && conversationId === sourceTweetId) return "quote";

  // Direct reply in the campaign conversation when parent id is missing.
  if (!quotedTweetId && conversationId === sourceTweetId && inReplyToId == null) {
    return "reply";
  }

  // Quote fallback: the quoted status URL (containing the id) is in the text.
  const text = String(tweet.text ?? "");
  if (text.includes(`/status/${sourceTweetId}`) || text.includes(sourceTweetId)) {
    if (quotedTweetId || tweet.isQuote) return "quote";
    if (inReplyToId) return "reply";
    return "quote";
  }

  return null;
}

/**
 * Admin: track one engagement post by X URL (or raw tweet id).
 * Fetches that tweet by id (skip cache), classifies vs the campaign source,
 * and upserts it. Much more reliable than handle timeline scans when the
 * provider strips quote relation fields from timeline payloads.
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 * @param {string} tweetUrlOrId
 * @param {{ force?: boolean }} [opts]
 */
export async function discoverCampaignTweet(campaignId, tweetUrlOrId, opts = {}) {
  if (!isTwitterApiIoConfigured()) {
    return { found: false, skipped: true, reason: "twitterapi_unavailable" };
  }

  const tweetId = parseTweetIdFromUrl(tweetUrlOrId);
  if (!tweetId) {
    const err = new Error("Invalid X post URL or tweet id");
    err.code = "invalid_tweet_url";
    throw err;
  }

  const campaign = await KolCampaign.findById(campaignId);
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.code = "not_found";
    throw err;
  }
  if (campaign.status !== "active" && !opts.force) {
    return { found: false, skipped: true, reason: "not_active" };
  }

  const sourceTweetId = String(campaign.sourceTweetId || "").trim();
  if (!sourceTweetId) {
    return { found: false, skipped: true, reason: "missing_source_tweet" };
  }

  if (tweetId === sourceTweetId) {
    return {
      found: false,
      reason: "is_source_tweet",
      sourceTweetId,
      tweetId,
      message: "That URL is the campaign source post itself, not a reply/quote.",
    };
  }

  const sourceAuthorHandleKey = normalizeHandle(campaign.sourceAuthorHandle);
  const sourceTweetUrl = String(campaign.sourceTweetUrl || "").trim();
  const sourceAuthorHandle = String(campaign.sourceAuthorHandle || "").trim();

  let tweet;
  try {
    ({ tweet } = await getTweetById(tweetId, { skipCache: true }));
  } catch (e) {
    if (e && typeof e === "object" && /** @type {{ code?: string }} */ (e).code === "tweet_not_found") {
      return {
        found: false,
        reason: "tweet_not_found",
        sourceTweetId,
        tweetId,
        message: `Tweet ${tweetId} was not found via the X API.`,
      };
    }
    throw e;
  }

  const authorHandle = String(tweet.author?.userName || "").trim();
  const authorHandleKey = normalizeHandle(authorHandle);
  if (!authorHandleKey) {
    return {
      found: false,
      reason: "missing_author",
      sourceTweetId,
      tweetId,
      message: "Tweet has no author handle.",
    };
  }
  if (authorHandleKey === sourceAuthorHandleKey) {
    return {
      found: false,
      reason: "is_source_author",
      sourceTweetId,
      tweetId,
      handle: authorHandleKey,
      message: "Cannot track the campaign author's own post as a KOL entry.",
    };
  }

  let mode = classifyEngagement(
    /** @type {never} */ (tweet),
    sourceTweetId,
  );

  // Admin paste: if relation fields are still missing but this is clearly a
  // quote (isQuote / quote flag) of the campaign conversation, accept as quote.
  if (!mode && tweet.isQuote && String(tweet.conversationId || "") === sourceTweetId) {
    mode = "quote";
  }

  // Last-resort admin trust: pasted engagement URL with no usable relation.
  // Only when force=true (admin endpoint). Prefer quote (common missing case).
  if (!mode && opts.force === true) {
    if (tweet.inReplyToId != null && String(tweet.inReplyToId) !== sourceTweetId) {
      // Nested reply to someone else's reply — still accept as reply to campaign
      // only if conversation is the campaign thread.
      if (String(tweet.conversationId || "") === sourceTweetId) {
        mode = "reply";
      }
    } else {
      mode = "quote";
    }
  }

  const diagnostic = {
    tweetId: tweet.id,
    tweetUrl: tweet.url,
    handle: authorHandleKey,
    inReplyToId: tweet.inReplyToId != null ? String(tweet.inReplyToId) : null,
    quotedTweetId: tweet.quotedTweetId != null ? String(tweet.quotedTweetId) : null,
    conversationId:
      tweet.conversationId != null ? String(tweet.conversationId) : null,
    isQuote: Boolean(tweet.isQuote),
    text: String(tweet.text ?? "").slice(0, 120),
  };

  if (!mode) {
    return {
      found: false,
      reason: "not_related",
      sourceTweetId,
      sourceTweetUrl,
      sourceAuthorHandle,
      ...diagnostic,
      message:
        "This post does not look like a reply or quote of the campaign source tweet. Check the URL is the KOL’s reply/quote, not an unrelated post.",
    };
  }

  const authorContext = {
    followers: Math.max(0, Math.floor(Number(tweet.author?.followers) || 0)),
    verified: Boolean(tweet.author?.verified),
  };
  const { score, breakdown } = scoreSubmission(tweet.metrics, authorContext);

  /** @type {DiscoveredPost} */
  const post = {
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

  const capturedAt = new Date();
  const result = await upsertHandlePosts(
    campaign,
    authorHandleKey,
    [post],
    capturedAt,
  );

  if (result.created === 0 && result.updated === 0) {
    // Already existed with same/higher score — still a success for the admin.
    const existing = await KolSubmission.findOne({
      campaignId: campaign._id,
      authorHandleKey,
    }).lean();
    if (existing) {
      const { refreshCampaignProjections } = await import("./kolMarketplaceService.js");
      await refreshCampaignProjections(campaign._id);
      return {
        found: true,
        alreadyTracked: true,
        handle: authorHandleKey,
        mode,
        sourceTweetId,
        sourceTweetUrl,
        sourceAuthorHandle,
        created: 0,
        updated: 0,
        ...diagnostic,
        score,
        metrics: tweet.metrics,
        capturedAt: capturedAt.toISOString(),
      };
    }
    return {
      found: false,
      reason: "upsert_skipped",
      sourceTweetId,
      ...diagnostic,
      message: "Tweet classified but was not saved (unexpected).",
    };
  }

  const { refreshCampaignProjections } = await import("./kolMarketplaceService.js");
  await refreshCampaignProjections(campaign._id);

  return {
    found: true,
    alreadyTracked: false,
    handle: authorHandleKey,
    mode,
    sourceTweetId,
    sourceTweetUrl,
    sourceAuthorHandle,
    created: result.created,
    updated: result.updated,
    ...diagnostic,
    score,
    metrics: tweet.metrics,
    capturedAt: capturedAt.toISOString(),
  };
}

/**
 * Fetch a single handle's recent tweets from both advanced_search and the
 * user timeline endpoint (they miss different tweets), deduped by id.
 * @param {string} handleKey
 * @returns {Promise<Array<Record<string, unknown> & { id: string; text?: string; inReplyToId?: string | null; quotedTweetId?: string | null; author?: { userName?: string } }>>}
 */
async function fetchHandleTweets(handleKey) {
  /** @type {Map<string, Record<string, unknown> & { id: string }>} */
  const byId = new Map();

  const collect = async (label, fetchPage) => {
    let cursor = null;
    let pages = 0;
    try {
      while (pages < DEFAULT_MAX_PAGES) {
        const page = await fetchPage(cursor);
        for (const t of page.tweets) {
          if (t && typeof t === "object" && t.id) byId.set(String(t.id), t);
        }
        pages += 1;
        if (!page.hasNextPage || !page.nextCursor) break;
        cursor = page.nextCursor;
      }
    } catch (e) {
      console.warn(
        `[kol] fetchHandleTweets ${label} failed handle=${handleKey}:`,
        e instanceof Error ? e.message : e,
      );
    }
  };

  await Promise.all([
    collect("search", (cursor) =>
      advancedSearch({
        query: `from:${handleKey}`,
        queryType: "Latest",
        cursor,
        skipCache: true,
      }),
    ),
    collect("timeline", (cursor) =>
      getUserLastTweets({ userName: handleKey, cursor }),
    ),
  ]);

  return [...byId.values()];
}

/**
 * Precise engagement lookup: search operators that guarantee the relation by
 * construction (`quoted_tweet_id:` / `conversation_id:` scoped to the handle),
 * so results count even when payloads omit relation ids.
 * @param {string} handleKey
 * @param {string} sourceTweetId
 * @param {"reply" | "quote"} mode
 * @returns {Promise<Map<string, Record<string, unknown> & { id: string }>>}
 */
async function searchHandleEngagements(handleKey, sourceTweetId, mode) {
  const queries =
    mode === "quote"
      ? [
          `quoted_tweet_id:${sourceTweetId} from:${handleKey}`,
          `url:${sourceTweetId} from:${handleKey}`,
        ]
      : [`conversation_id:${sourceTweetId} from:${handleKey}`];

  /** @type {Map<string, Record<string, unknown> & { id: string }>} */
  const byId = new Map();

  for (const query of queries) {
    let cursor = null;
    let pages = 0;
    try {
      while (pages < 3) {
        const page = await advancedSearch({
          query,
          queryType: "Latest",
          cursor,
          skipCache: true,
        });
        for (const t of page.tweets) {
          if (t && typeof t === "object" && t.id) byId.set(String(t.id), t);
        }
        pages += 1;
        if (!page.hasNextPage || !page.nextCursor) break;
        cursor = page.nextCursor;
      }
    } catch (e) {
      console.warn(
        `[kol] targeted ${mode} search failed handle=${handleKey} query="${query}":`,
        e instanceof Error ? e.message : e,
      );
    }
  }

  return byId;
}

const HYDRATE_MAX_TWEETS = 100;

/**
 * Timeline/search payloads often omit inReplyToId/quotedTweetId entirely,
 * which makes quotes undetectable. Re-fetch relation-less tweets via the
 * batched tweet-detail endpoint (full payload includes quoted_tweet) and
 * patch the relations in place.
 * @param {Array<Record<string, unknown> & { id: string; createdAt?: string | null; text?: string; metrics?: Record<string, number>; inReplyToId?: string | null; quotedTweetId?: string | null }>} tweets
 * @param {Date | string | null | undefined} campaignStartAt
 * @returns {Promise<number>} number of tweets that gained a relation id
 */
async function hydrateMissingRelations(tweets, campaignStartAt) {
  const sinceMs = campaignStartAt
    ? new Date(campaignStartAt).getTime() - 24 * 60 * 60 * 1000
    : null;

  const candidates = tweets
    .filter((t) => t.inReplyToId == null && t.quotedTweetId == null)
    .filter((t) => {
      if (sinceMs == null || !t.createdAt) return true;
      const ts = new Date(t.createdAt).getTime();
      return !Number.isFinite(ts) || ts >= sinceMs;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime(),
    )
    .slice(0, HYDRATE_MAX_TWEETS);

  if (candidates.length === 0) return 0;

  try {
    const { byId } = await getTweetsByIds(candidates.map((t) => String(t.id)));
    let hydrated = 0;
    for (const t of candidates) {
      const full = byId.get(String(t.id));
      if (!full) continue;
      if (t.quotedTweetId == null && full.quotedTweetId != null) {
        t.quotedTweetId = full.quotedTweetId;
        hydrated += 1;
      }
      if (t.inReplyToId == null && full.inReplyToId != null) {
        t.inReplyToId = full.inReplyToId;
      }
      if (full.metrics) t.metrics = full.metrics;
      if (!t.text && full.text) t.text = full.text;
    }
    return hydrated;
  } catch (e) {
    console.warn(
      "[kol] hydrateMissingRelations failed:",
      e instanceof Error ? e.message : e,
    );
    return 0;
  }
}

/**
 * Targeted discovery for a single handle — scans that user's own tweets for a
 * reply/quote to the campaign source tweet and upserts it. Deterministic
 * fallback for engagers the thread scan misses on high-volume posts.
 * @param {import("mongoose").Types.ObjectId | string} campaignId
 * @param {string} handle
 * @param {{ force?: boolean }} [opts]
 */
export async function discoverCampaignHandle(campaignId, handle, opts = {}) {
  if (!isTwitterApiIoConfigured()) {
    return { found: false, skipped: true, reason: "twitterapi_unavailable" };
  }

  const handleKey = normalizeHandle(handle);
  if (!handleKey) {
    const err = new Error("Handle is required");
    err.code = "invalid_handle";
    throw err;
  }

  const campaign = await KolCampaign.findById(campaignId);
  if (!campaign) {
    const err = new Error("Campaign not found");
    err.code = "not_found";
    throw err;
  }
  if (campaign.status !== "active" && !opts.force) {
    return { found: false, skipped: true, reason: "not_active" };
  }

  const sourceTweetId = String(campaign.sourceTweetId || "").trim();
  if (!sourceTweetId) {
    return { found: false, skipped: true, reason: "missing_source_tweet" };
  }

  const sourceAuthorHandleKey = normalizeHandle(campaign.sourceAuthorHandle);
  if (handleKey === sourceAuthorHandleKey) {
    return { found: false, skipped: true, reason: "is_source_author" };
  }

  // Three detection sources, most precise first:
  // 1. Targeted operator searches (relation guaranteed by the query itself).
  // 2. Timeline/from: search, hydrated via tweet-detail for missing relations.
  const [tweets, quoteHits, replyHits] = await Promise.all([
    fetchHandleTweets(handleKey),
    searchHandleEngagements(handleKey, sourceTweetId, "quote"),
    searchHandleEngagements(handleKey, sourceTweetId, "reply"),
  ]);

  const hydrated = await hydrateMissingRelations(tweets, campaign.startAt);

  /** @type {Map<string, Map<string, DiscoveredPost>>} */
  const byHandle = new Map();
  /** @type {Array<{ id: string; mode: string; via: string; inReplyToId: string | null; quotedTweetId: string | null }>} */
  const matched = [];
  const matchedIds = new Set();

  const ingestMatch = (tweet, mode, via) => {
    const id = String(tweet.id);
    if (id === sourceTweetId || matchedIds.has(id)) return;
    ingestDiscoveredTweet(
      byHandle,
      /** @type {never} */ (tweet),
      sourceTweetId,
      sourceAuthorHandleKey,
      mode,
    );
    matchedIds.add(id);
    matched.push({
      id,
      mode,
      via,
      inReplyToId: tweet.inReplyToId != null ? String(tweet.inReplyToId) : null,
      quotedTweetId: tweet.quotedTweetId != null ? String(tweet.quotedTweetId) : null,
    });
  };

  // Targeted operator results: the query guarantees the relation, so accept
  // them even when the payload omits quotedTweetId/inReplyToId.
  for (const tweet of quoteHits.values()) {
    ingestMatch(tweet, "quote", "targeted_search");
  }
  for (const tweet of replyHits.values()) {
    // Nested replies (reply to someone else inside the thread) keep their
    // inReplyToId — ingestDiscoveredTweet rejects those, matching main flow.
    ingestMatch(tweet, "reply", "targeted_search");
  }

  // Timeline classification (now with hydrated relation ids).
  for (const tweet of tweets) {
    const mode = classifyEngagement(tweet, sourceTweetId);
    if (!mode) continue;
    ingestMatch(tweet, mode, "timeline");
  }

  const postsByHandle = finalizeByHandle(byHandle);
  const discoveredPosts = postsByHandle.get(handleKey) ?? [];

  const sourceTweetUrl = String(campaign.sourceTweetUrl || "").trim();
  const sourceAuthorHandle = String(campaign.sourceAuthorHandle || "").trim();

  if (discoveredPosts.length === 0) {
    // Nothing matched — return a diagnostic sample so admins can see why.
    const sample = tweets.slice(0, 10).map((t) => ({
      id: String(t.id),
      text: String(t.text ?? "").slice(0, 100),
      inReplyToId: t.inReplyToId != null ? String(t.inReplyToId) : null,
      quotedTweetId: t.quotedTweetId != null ? String(t.quotedTweetId) : null,
    }));
    return {
      found: false,
      handle: handleKey,
      sourceTweetId,
      sourceTweetUrl,
      sourceAuthorHandle,
      tweetsScanned: tweets.length,
      targetedQuoteHits: quoteHits.size,
      targetedReplyHits: replyHits.size,
      hydrated,
      matched: 0,
      reason: tweets.length === 0 ? "no_tweets_fetched" : "no_engagement_found",
      sample,
    };
  }

  const capturedAt = new Date();
  const result = await upsertHandlePosts(
    campaign,
    handleKey,
    discoveredPosts,
    capturedAt,
  );

  const { refreshCampaignProjections } = await import("./kolMarketplaceService.js");
  await refreshCampaignProjections(campaign._id);

  return {
    found: true,
    handle: handleKey,
    sourceTweetId,
    sourceTweetUrl,
    sourceAuthorHandle,
    tweetsScanned: tweets.length,
    targetedQuoteHits: quoteHits.size,
    targetedReplyHits: replyHits.size,
    hydrated,
    matched: matched.length,
    created: result.created,
    updated: result.updated,
    posts: matched,
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
