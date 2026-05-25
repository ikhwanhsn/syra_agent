/**
 * Syra Trend Scout pipeline — news + events + trending → LLM → Telegram + MongoDB.
 */

import DashboardResearch from "../models/DashboardResearch.js";
import { runSyraTrendScoutAgent } from "../agents/syra-trend-scout-agent.js";
import {
  fetchEventsGeneral,
  fetchTrendingHeadlinesGeneral,
} from "./internalNewsAgent.js";
import { getArticlesWithinHours } from "./newsAggregator.js";
import { isDevTelegramConfigured, sendDevTelegram } from "./devTelegramNotifier.js";
import { formatSyraTrendScoutTelegram } from "./syraTrendScoutDigests.js";
import {
  SYRA_TREND_SCOUT_DB_ID,
  SYRA_TREND_SCOUT_NEWS_HOURS,
  SYRA_TREND_SCOUT_HEADLINE_LIMIT,
  SYRA_TREND_SCOUT_ARTICLE_LIMIT,
} from "../config/syraTrendScoutConfig.js";

export { SYRA_TREND_SCOUT_DB_ID };

/**
 * @returns {Promise<{ success: true; data: import("../agents/syra-trend-scout-agent.js").SyraTrendScoutOutput }>}
 */
export async function runSyraTrendScoutPipeline() {
  const [headlines, articles, eventsByDate] = await Promise.all([
    fetchTrendingHeadlinesGeneral(),
    getArticlesWithinHours(SYRA_TREND_SCOUT_NEWS_HOURS),
    fetchEventsGeneral(),
  ]);

  const compactHeadlines = headlines
    .slice(0, SYRA_TREND_SCOUT_HEADLINE_LIMIT)
    .map((h) => ({
      headline: String(h.headline || "").slice(0, 200),
      importance: typeof h.importance === "number" ? h.importance : undefined,
    }))
    .filter((h) => h.headline);

  const compactArticles = articles.slice(0, SYRA_TREND_SCOUT_ARTICLE_LIMIT).map((a) => ({
    title: String(a.title || "").slice(0, 200),
    source: String(a.source || "unknown").slice(0, 80),
    publishedAt: String(a.publishedAt || ""),
    snippet: String(a.description || "").slice(0, 400),
  }));

  const data = await runSyraTrendScoutAgent({
    headlines: compactHeadlines,
    articles: compactArticles,
    eventsByDate: eventsByDate || {},
    model: null,
  });

  if (isDevTelegramConfigured()) {
    const sent = await sendDevTelegram(formatSyraTrendScoutTelegram(data), {
      disableWebPagePreview: true,
    });
    if (!sent) console.warn("[syra-trend-scout] Telegram send failed");
  }

  const savedAt = new Date();
  await DashboardResearch.findOneAndUpdate(
    { id: SYRA_TREND_SCOUT_DB_ID },
    { id: SYRA_TREND_SCOUT_DB_ID, payload: data, savedAt },
    { upsert: true, new: true },
  );

  return { success: true, data };
}
