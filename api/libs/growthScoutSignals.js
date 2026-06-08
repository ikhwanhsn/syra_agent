/**
 * Collect compact growth signals for Syra Growth Scout (users, TVL, social, context).
 */

import PaidApiCall from "../models/PaidApiCall.js";
import Chat from "../models/agent/Chat.js";
import PlaygroundShare from "../models/PlaygroundShare.js";
import DashboardResearch from "../models/DashboardResearch.js";
import { searchRecentTweets, isXApiBearerConfigured } from "./xApiClient.js";
import { getLpGlobalOverview } from "./lpGlobalOverview.js";
import {
  GROWTH_SYRA_SOCIAL_SEARCH_QUERY,
  GROWTH_SYRA_SOCIAL_MAX_PER_QUERY,
  GROWTH_SECTOR_NARRATIVE_SEARCH_QUERY,
  GROWTH_SECTOR_MAX_PER_QUERY,
} from "../config/internalPipelineAgents.js";
import { SYRA_TREND_SCOUT_DB_ID } from "../config/syraTrendScoutConfig.js";
import { GROWTH_SCOUT_X_CACHE_MS } from "../config/syraGrowthScoutConfig.js";

/** @type {Map<string, { expires: number; tweets: GrowthTweetSample[] }>} */
const xSearchCache = new Map();

/**
 * @typedef {{
 *   id: string;
 *   text: string;
 *   authorHandle: string;
 *   likeCount: number;
 *   retweetCount: number;
 * }} GrowthTweetSample
 */

/**
 * @param {unknown} body
 * @returns {GrowthTweetSample[]}
 */
function normalizeTweets(body) {
  const tweets = Array.isArray(body?.data) ? body.data : [];
  const users = Array.isArray(body?.includes?.users) ? body.includes.users : [];
  const userById = new Map();
  for (const u of users) {
    if (!u || typeof u !== "object") continue;
    const x = /** @type {Record<string, unknown>} */ (u);
    const id = String(x.id || "");
    if (id) userById.set(id, x);
  }

  /** @type {GrowthTweetSample[]} */
  const out = [];
  for (const t of tweets) {
    if (!t || typeof t !== "object") continue;
    const tw = /** @type {Record<string, unknown>} */ (t);
    const id = String(tw.id || "").trim();
    const text = String(tw.text || "").trim();
    if (!id || !text) continue;
    const authorId = String(tw.author_id || "");
    const u = userById.get(authorId);
    const handle = u ? String(u.username || "") : "";
    const metrics =
      tw.public_metrics && typeof tw.public_metrics === "object"
        ? /** @type {Record<string, unknown>} */ (tw.public_metrics)
        : {};
    out.push({
      id,
      text: text.slice(0, 280),
      authorHandle: handle,
      likeCount: Number(metrics.like_count) || 0,
      retweetCount: Number(metrics.retweet_count) || 0,
    });
  }
  return out;
}

/**
 * @param {string} query
 * @param {number} maxResults
 * @returns {Promise<GrowthTweetSample[]>}
 */
async function fetchCachedTweets(query, maxResults) {
  if (!isXApiBearerConfigured()) return [];

  const cached = xSearchCache.get(query);
  if (cached && Date.now() < cached.expires) {
    return cached.tweets;
  }

  const body = await searchRecentTweets(query, {
    max_results: maxResults,
    tweetFields: "created_at,public_metrics,author_id,text",
    expansions: "author_id",
    userFields: "username",
  });

  if (body.errors?.length) {
    const msg = body.errors.map((e) => e.message).join("; ");
    throw new Error(`X search failed: ${msg}`);
  }

  const tweets = normalizeTweets(body).slice(0, maxResults);
  xSearchCache.set(query, { tweets, expires: Date.now() + GROWTH_SCOUT_X_CACHE_MS });
  return tweets;
}

/**
 * @returns {Promise<{
 *   metrics: Record<string, number | string | null>;
 *   metricsNotes: string[];
 *   lpOverview: Record<string, unknown> | null;
 *   syraSocialTweets: GrowthTweetSample[];
 *   sectorTweets: GrowthTweetSample[];
 *   trendScoutSummary: string | null;
 *   xConfigured: boolean;
 * }>}
 */
export async function collectGrowthScoutSignals() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const prevSevenDaysStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    paidTotal,
    paid7d,
    paidPrev7d,
    paid30d,
    chatsTotal,
    chats7d,
    chats30d,
    uniqueUsers7d,
    uniqueUsers30d,
    sharesTotal,
    shares7d,
    lpOverview,
    trendDoc,
    syraSocialTweets,
    sectorTweets,
  ] = await Promise.all([
    PaidApiCall.countDocuments(),
    PaidApiCall.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    PaidApiCall.countDocuments({ createdAt: { $gte: prevSevenDaysStart, $lt: sevenDaysAgo } }),
    PaidApiCall.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Chat.countDocuments(),
    Chat.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    Chat.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Chat.distinct("anonymousId", { updatedAt: { $gte: sevenDaysAgo } }).then((ids) =>
      ids.filter(Boolean).length,
    ),
    Chat.distinct("anonymousId", { updatedAt: { $gte: thirtyDaysAgo } }).then((ids) =>
      ids.filter(Boolean).length,
    ),
    PlaygroundShare.countDocuments(),
    PlaygroundShare.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
    getLpGlobalOverview().catch(() => null),
    DashboardResearch.findOne({ id: SYRA_TREND_SCOUT_DB_ID }).lean(),
    fetchCachedTweets(GROWTH_SYRA_SOCIAL_SEARCH_QUERY, GROWTH_SYRA_SOCIAL_MAX_PER_QUERY).catch(
      () => [],
    ),
    fetchCachedTweets(GROWTH_SECTOR_NARRATIVE_SEARCH_QUERY, GROWTH_SECTOR_MAX_PER_QUERY).catch(
      () => [],
    ),
  ]);

  const paidApiLast24h = await PaidApiCall.countDocuments({ createdAt: { $gte: oneDayAgo } });

  const real = lpOverview?.realAgent || {};
  const sim = lpOverview?.simulation || {};
  const candidateTvl = lpOverview?.candidates || {};

  /** @type {Record<string, number | string | null>} */
  const metrics = {
    paidApiCallsTotal: paidTotal,
    paidApiCalls7d: paid7d,
    paidApiCallsPrev7d: paidPrev7d,
    paidApiCalls30d: paid30d,
    paidApiCalls24h: paidApiLast24h,
    agentChatsTotal: chatsTotal,
    agentChats7d: chats7d,
    agentChats30d: chats30d,
    activeUsers7d: uniqueUsers7d,
    activeUsers30d: uniqueUsers30d,
    playgroundSharesTotal: sharesTotal,
    playgroundShares7d: shares7d,
    lpRealDeployedSol: typeof real.deployedSol === "number" ? real.deployedSol : null,
    lpRealOpenPositions: typeof real.openPositions === "number" ? real.openPositions : null,
    lpRealEnabledAgents: typeof real.enabledAgents === "number" ? real.enabledAgents : null,
    lpSimDeployedSol: typeof sim.sumDeployedSol === "number" ? sim.sumDeployedSol : null,
    lpSimOpenPositions: typeof sim.openPositions === "number" ? sim.openPositions : null,
    lpCandidatePoolTvlUsd:
      typeof candidateTvl.trackedTvlUsd === "number" ? candidateTvl.trackedTvlUsd : null,
    solPriceUsd: typeof lpOverview?.solPriceUsd === "number" ? lpOverview.solPriceUsd : null,
  };

  /** @type {string[]} */
  const metricsNotes = [];
  if (paidPrev7d > 0) {
    const pct = Math.round(((paid7d - paidPrev7d) / paidPrev7d) * 100);
    metricsNotes.push(`Paid API calls: ${pct >= 0 ? "+" : ""}${pct}% vs prior 7 days`);
  }
  if (typeof real.deployedSol === "number" && real.deployedSol > 0) {
    metricsNotes.push(`Real LP agents have ${real.deployedSol.toFixed(2)} SOL deployed`);
  }

  const trendPayload = trendDoc?.payload;
  const trendScoutSummary =
    trendPayload &&
    typeof trendPayload === "object" &&
    typeof /** @type {Record<string, unknown>} */ (trendPayload).marketSummary === "string"
      ? String(/** @type {Record<string, unknown>} */ (trendPayload).marketSummary).slice(0, 600)
      : null;

  return {
    metrics,
    metricsNotes,
    lpOverview: lpOverview
      ? {
          realAgent: real,
          simulation: sim,
          candidates: candidateTvl,
          meteora: lpOverview.meteora ?? null,
        }
      : null,
    syraSocialTweets: syraSocialTweets,
    sectorTweets: sectorTweets,
    trendScoutSummary,
    xConfigured: isXApiBearerConfigured(),
  };
}
