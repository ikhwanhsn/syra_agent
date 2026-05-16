/**
 * Internal news agent — RSS aggregation, LLM intelligence, Mongo sentiment series.
 * Sole backend for /news, /sentiment, /event, /trending-headline, /sundown-digest.
 */

import mongoose from "mongoose";
import {
  INTERNAL_NEWS_SENTIMENT_LOOKBACK_DAYS,
  keywordsForTicker,
} from "../config/internalNewsConfig.js";
import { getAggregatedNews, getArticlesWithinHours } from "./newsAggregator.js";
import { fetchEventsForTicker } from "./eventsScraper.js";
import {
  scoreTrendingHeadlines,
  composeSundownDigest,
} from "../agents/news-intelligence-agent.js";
import NewsSentimentDaily from "../models/NewsSentimentDaily.js";

/** @deprecated Kept for route compatibility; internal agent needs no external token. */
export function getCryptonewsToken() {
  return "internal";
}

/**
 * @deprecated Internal agent does not use external URLs.
 */
export function buildUrl(pathname, params = {}) {
  return `internal://news${pathname}?${new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  )}`;
}

/**
 * @param {string} sectionKey
 * @returns {Promise<Record<string, { Positive: number; Negative: number; Neutral: number; Total: number; sentiment_score: number; Sentiment_Score: number }>>}
 */
async function loadSentimentSeries(sectionKey) {
  if (mongoose.connection.readyState !== 1) {
    return {};
  }

  const days = INTERNAL_NEWS_SENTIMENT_LOOKBACK_DAYS;
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  let docs;
  try {
    docs = await NewsSentimentDaily.find({
      section: sectionKey,
      date: { $gte: cutoffStr },
    })
      .sort({ date: 1 })
      .lean();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[internal-news] sentiment query failed:", msg);
    return {};
  }

  /** @type {Record<string, { Positive: number; Negative: number; Neutral: number; Total: number; sentiment_score: number; Sentiment_Score: number }>} */
  const out = {};
  for (const doc of docs) {
    out[doc.date] = {
      Positive: doc.Positive,
      Negative: doc.Negative,
      Neutral: doc.Neutral,
      Total: doc.Total,
      sentiment_score: doc.sentiment_score,
      Sentiment_Score: doc.sentiment_score,
    };
  }
  return out;
}

/**
 * @param {string} ticker
 * @returns {string}
 */
function sectionForTicker(ticker) {
  const t = String(ticker || "").trim().toUpperCase();
  if (!t || t === "GENERAL") return "general";
  return `ticker:${t}`;
}

export async function fetchNewsCategoryGeneral(items = 100) {
  return getAggregatedNews({ ticker: "general", items });
}

export async function fetchNewsCategoryAllTickers(items = 100) {
  const all = await getAggregatedNews({ ticker: "general", items });
  return all.filter((a) => Array.isArray(a.tickers) && a.tickers.length > 0);
}

export async function fetchNewsTickers(ticker, items = 100) {
  return getAggregatedNews({ ticker, items, tickersOnly: false });
}

export async function fetchNewsTickersOnly(ticker, items = 100) {
  return getAggregatedNews({ ticker, items, tickersOnly: true });
}

export async function fetchSentimentGeneral(_date = "last30days") {
  return loadSentimentSeries("general");
}

export async function fetchSentimentAllTickers(_date = "last30days") {
  return loadSentimentSeries("alltickers");
}

export async function fetchSentimentTicker(ticker, _date = "last30days") {
  return loadSentimentSeries(sectionForTicker(ticker));
}

export async function fetchEventsGeneral() {
  return fetchEventsForTicker("general");
}

export async function fetchEventsTicker(ticker) {
  return fetchEventsForTicker(ticker);
}

export async function fetchSundownDigest() {
  const articles = await getArticlesWithinHours(24);
  const digest = await composeSundownDigest(articles);
  return digest.map((d) => ({
    title: d.title,
    text: d.body,
    body: d.body,
    tickers: d.tickers || [],
    date: new Date().toISOString().slice(0, 10),
  }));
}

export async function fetchTrendingHeadlinesGeneral() {
  const articles = await getArticlesWithinHours(48);
  return scoreTrendingHeadlines(articles, { limit: 25 });
}

export async function fetchTrendingHeadlinesTicker(ticker) {
  const t = String(ticker || "").trim().toUpperCase();
  let articles = await getArticlesWithinHours(48);
  if (t && t !== "GENERAL") {
    const kws = keywordsForTicker(t);
    articles = articles.filter((a) => {
      if (a.tickers.includes(t)) return true;
      const blob = `${a.title} ${a.description}`.toLowerCase();
      return kws.some((kw) => blob.includes(kw.toLowerCase()));
    });
  }
  return scoreTrendingHeadlines(articles, { limit: 25 });
}

/**
 * Compat shim for callers expecting `{ data }` response shape.
 * @param {string} pathname
 * @param {Record<string, string | number>} [params]
 * @returns {Promise<{ data?: unknown }>}
 */
export async function fetchCryptoNewsApi(pathname, params = {}) {
  const p = String(pathname || "").replace(/\/+$/, "") || "";
  const ticker = String(params.tickers || params.ticker || "SOL").trim().toUpperCase();
  const items = Number(params.items) || 25;

  if (p === "/stat") {
    const data = await fetchSentimentTicker(ticker, String(params.date || "last30days"));
    return { data };
  }
  if (p === "/events") {
    const data = await fetchEventsTicker(ticker);
    return { data };
  }
  if (p === "/trending-headlines") {
    const data =
      ticker && ticker !== "GENERAL"
        ? await fetchTrendingHeadlinesTicker(ticker)
        : await fetchTrendingHeadlinesGeneral();
    return { data };
  }
  if (p === "/sundown-digest") {
    const data = await fetchSundownDigest();
    return { data };
  }
  if (p === "/category") {
    const section = String(params.section || "general");
    const data =
      section === "alltickers"
        ? await fetchNewsCategoryAllTickers(items)
        : await fetchNewsCategoryGeneral(items);
    return { data };
  }

  if (params["tickers-only"]) {
    const data = await fetchNewsTickersOnly(ticker, items);
    return { data };
  }

  const data = await fetchNewsTickers(ticker, items);
  return { data };
}
