import DashboardResearch from "../models/DashboardResearch.js";
import InternalNarrativePost from "../models/InternalNarrativePost.js";
import { SYRA_TREND_SCOUT_DB_ID } from "../config/syraTrendScoutConfig.js";
import { fetchTrendingHeadlinesGeneral } from "./internalNewsAgent.js";
function normalizeHookText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""'']/g, "'")
    .trim();
}

/**
 * @param {number} [limit]
 * @returns {Promise<Set<string>>}
 */
async function fetchRecentNewsHooks(limit = 25) {
  const docs = await InternalNarrativePost.find({
    sourceMode: "trending",
    newsHook: { $nin: [null, ""] },
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("newsHook")
    .lean();

  return new Set(
    docs
      .map((d) => normalizeHookText(String(d.newsHook || "")))
      .filter(Boolean),
  );
}

/**
 * @param {Array<{ headline: string; text?: string; source_name?: string }>} headlines
 * @param {string[]} trendTopics
 * @param {Set<string>} usedHooks
 */
function pickTrendingHook(headlines, trendTopics, usedHooks) {
  /** @type {Array<{ type: string; text: string; detail: string; source: string }>} */
  const candidates = [];

  for (const h of headlines.slice(0, 10)) {
    const text = String(h.headline || "").trim();
    if (!text) continue;
    if (usedHooks.has(normalizeHookText(text))) continue;
    candidates.push({
      type: "headline",
      text,
      detail: String(h.text || "").slice(0, 280),
      source: String(h.source_name || "news"),
    });
  }

  for (const topic of trendTopics.slice(0, 8)) {
    const text = String(topic || "").trim();
    if (!text) continue;
    if (usedHooks.has(normalizeHookText(text))) continue;
    candidates.push({
      type: "topic",
      text,
      detail: "",
      source: "trend-scout",
    });
  }

  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  const fallback = headlines[0];
  if (fallback?.headline) {
    return {
      type: "headline",
      text: String(fallback.headline),
      detail: String(fallback.text || "").slice(0, 280),
      source: String(fallback.source_name || "news"),
    };
  }

  return null;
}

/**
 * @returns {Promise<{
 *   headlines: Awaited<ReturnType<typeof fetchTrendingHeadlinesGeneral>>;
 *   trendTopics: string[];
 *   marketSummary: string | null;
 *   pickedHook: { type: string; text: string; detail: string; source: string } | null;
 * }>}
 */
export async function buildTrendingNarrativeContext() {
  const [headlines, trendDoc, usedHooks] = await Promise.all([
    fetchTrendingHeadlinesGeneral(),
    DashboardResearch.findOne({ id: SYRA_TREND_SCOUT_DB_ID }).lean(),
    fetchRecentNewsHooks(),
  ]);

  const payload = trendDoc?.payload && typeof trendDoc.payload === "object" ? trendDoc.payload : {};
  const trendTopics = Array.isArray(payload.trendingTopics)
    ? payload.trendingTopics.map((t) => String(t || "").trim()).filter(Boolean)
    : [];
  const marketSummary =
    typeof payload.marketSummary === "string" && payload.marketSummary.trim()
      ? payload.marketSummary.trim()
      : null;

  const pickedHook = pickTrendingHook(headlines, trendTopics, usedHooks);

  return {
    headlines,
    trendTopics,
    marketSummary,
    pickedHook,
  };
}

/**
 * Lightweight preview for the internal tools UI.
 */
export async function getTrendingNarrativePreview() {
  const ctx = await buildTrendingNarrativeContext();
  return {
    success: true,
    data: {
      headlines: ctx.headlines.slice(0, 8).map((h) => ({
        headline: h.headline,
        source: h.source_name || null,
        importance: typeof h.importance === "number" ? h.importance : null,
      })),
      trendTopics: ctx.trendTopics.slice(0, 6),
      marketSummary: ctx.marketSummary,
      suggestedHook: ctx.pickedHook?.text ?? null,
    },
  };
}
