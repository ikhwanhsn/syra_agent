/**
 * Daily sentiment pipeline — classify last 24h articles, persist rolling Mongo series.
 */

import NewsSentimentDaily from "../models/NewsSentimentDaily.js";
import { getArticlesWithinHours } from "./newsAggregator.js";
import { keywordsForTicker, INTERNAL_NEWS_SENTIMENT_BATCH_SIZE, INTERNAL_NEWS_SENTIMENT_CRON_MS } from "../config/internalNewsConfig.js";
import { TICKER_KEYWORD_MAP } from "../config/internalNewsConfig.js";
import {
  classifyArticleSentiments,
  aggregateSentimentStats,
} from "../agents/news-intelligence-agent.js";

/** @type {ReturnType<typeof setInterval> | null} */
let cronHandle = null;

/** @type {boolean} */
let tickInFlight = false;

/**
 * @returns {string}
 */
function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * @param {import("./newsSources/rssParser.js").RawArticle[]} articles
 * @param {string} ticker
 * @returns {import("./newsSources/rssParser.js").RawArticle[]}
 */
function filterArticlesForTicker(articles, ticker) {
  const t = String(ticker || "").trim().toUpperCase();
  if (!t || t === "GENERAL") return articles;
  const keywords = keywordsForTicker(t);
  return articles.filter((a) => {
    if (a.tickers.includes(t)) return true;
    const blob = `${a.title} ${a.description}`.toLowerCase();
    return keywords.some((kw) => blob.includes(kw.toLowerCase()));
  });
}

/**
 * @param {string} section
 * @param {{ Positive: number; Negative: number; Neutral: number; Total: number; sentiment_score: number }} stats
 */
async function upsertDailySection(section, stats) {
  const date = todayUtc();
  await NewsSentimentDaily.findOneAndUpdate(
    { date, section },
    {
      date,
      section,
      Positive: stats.Positive,
      Negative: stats.Negative,
      Neutral: stats.Neutral,
      Total: stats.Total,
      sentiment_score: stats.sentiment_score,
      generatedAt: new Date(),
    },
    { upsert: true, new: true },
  );
}

/**
 * Run one sentiment aggregation tick (general + alltickers + major tickers).
 * @returns {Promise<{ success: boolean; sections: number; error?: string }>}
 */
export async function runDailySentimentTick() {
  if (tickInFlight) {
    return { success: false, sections: 0, error: "tick already in flight" };
  }
  tickInFlight = true;
  try {
    const articles = await getArticlesWithinHours(24);
    const batch = articles.slice(0, INTERNAL_NEWS_SENTIMENT_BATCH_SIZE);

    const sections = [
      { section: "general", ticker: "GENERAL" },
      { section: "alltickers", ticker: "GENERAL" },
    ];

    const majorTickers = Object.keys(TICKER_KEYWORD_MAP).slice(0, 8);
    for (const t of majorTickers) {
      sections.push({ section: `ticker:${t}`, ticker: t });
    }

    let count = 0;
    for (const { section, ticker } of sections) {
      const subset =
        section === "general" || section === "alltickers"
          ? batch
          : filterArticlesForTicker(batch, ticker).slice(0, 25);

      if (subset.length === 0) {
        await upsertDailySection(section, {
          Positive: 0,
          Negative: 0,
          Neutral: 0,
          Total: 0,
          sentiment_score: 0,
        });
        count += 1;
        continue;
      }

      const classifications = await classifyArticleSentiments(subset);
      const stats = aggregateSentimentStats(classifications);
      await upsertDailySection(section, stats);
      count += 1;
    }

    console.info(`[internal-news] sentiment tick complete: ${count} sections`);
    return { success: true, sections: count };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[internal-news] sentiment tick failed:", msg);
    return { success: false, sections: 0, error: msg };
  } finally {
    tickInFlight = false;
  }
}

/**
 * Start periodic sentiment scheduler (no run on boot — first run after interval).
 */
export function startSentimentDailyScheduler() {
  if (cronHandle) return;
  const ms = INTERNAL_NEWS_SENTIMENT_CRON_MS;
  if (!Number.isFinite(ms) || ms <= 0) {
    console.info("[internal-news] sentiment scheduler disabled (INTERNAL_NEWS_SENTIMENT_CRON_MS=0)");
    return;
  }

  cronHandle = setInterval(() => {
    runDailySentimentTick().catch((e) => {
      console.warn("[internal-news] scheduled sentiment tick error:", e instanceof Error ? e.message : e);
    });
  }, ms);

  if (typeof cronHandle.unref === "function") {
    cronHandle.unref();
  }

  console.info(`[internal-news] sentiment scheduler started (every ${Math.round(ms / 60000)} min)`);

  setTimeout(() => {
    runDailySentimentTick().catch(() => {});
  }, 15_000);
}

export function stopSentimentDailyScheduler() {
  if (cronHandle) {
    clearInterval(cronHandle);
    cronHandle = null;
  }
}
