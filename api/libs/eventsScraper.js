/**
 * Crypto events — CoinMarketCal RSS primary; news-article LLM fallback via eventsScraper.
 */

import { COINMARKETCAL_RSS_URL, keywordsForTicker } from "../config/internalNewsConfig.js";
import { fetchRssUrl } from "./newsSources/rssParser.js";
import { getArticlesWithinHours } from "./newsAggregator.js";
import { callOpenRouter } from "./openrouter.js";
import { resolveInternalPipelineModel } from "../config/internalPipelineAgents.js";
import { parseJsonObjectFromLlm } from "./llmJsonObjectParse.js";

/**
 * Cryptonews-compatible events map: { "YYYY-MM-DD": EventRow[] }
 * @typedef {{ event_name: string; event_text: string; ticker?: string; source?: string }} EventRow
 */

/** @type {Map<string, { expires: number; data: Record<string, EventRow[]> }>} */
const eventsCache = new Map();

const CACHE_TTL_MS = 90_000;

/**
 * @param {import("./newsSources/rssParser.js").RawArticle} raw
 * @returns {EventRow}
 */
function articleToEventRow(raw) {
  return {
    event_name: raw.title.slice(0, 200),
    event_text: raw.description.slice(0, 500) || raw.title,
    ticker: raw.tickers[0] || "",
    source: raw.source,
  };
}

/**
 * @param {import("./newsSources/rssParser.js").RawArticle[]} items
 * @returns {Record<string, EventRow[]>}
 */
function groupEventsByDate(items) {
  /** @type {Record<string, EventRow[]>} */
  const out = {};
  for (const item of items) {
    const date = item.publishedAt.slice(0, 10);
    if (!out[date]) out[date] = [];
    out[date].push(articleToEventRow(item));
  }
  return out;
}

/**
 * @param {string} cacheKey
 * @returns {Record<string, EventRow[]> | null}
 */
function getCached(cacheKey) {
  const e = eventsCache.get(cacheKey);
  if (!e || Date.now() > e.expires) return null;
  return e.data;
}

/**
 * @param {string} cacheKey
 * @param {Record<string, EventRow[]>} data
 */
function setCached(cacheKey, data) {
  eventsCache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });
}

/**
 * @returns {Promise<Record<string, EventRow[]>>}
 */
async function fetchCoinMarketCalEvents() {
  try {
    const items = await fetchRssUrl(COINMARKETCAL_RSS_URL, {
      sourceId: "coinmarketcal",
      sourceName: "CoinMarketCal",
    });
    return groupEventsByDate(items);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[internal-news] CoinMarketCal RSS failed:", msg);
    return {};
  }
}

/**
 * LLM extracts upcoming events from recent news when RSS is thin.
 * @param {import("./newsSources/rssParser.js").RawArticle[]} articles
 * @param {string} [ticker]
 * @returns {Promise<Record<string, EventRow[]>>}
 */
async function extractEventsFromNewsLlm(articles, ticker) {
  if (!process.env.OPENROUTER_API_KEY || articles.length === 0) {
    return {};
  }

  const slice = articles.slice(0, 25).map((a) => ({
    title: a.title,
    description: a.description.slice(0, 300),
    date: a.publishedAt.slice(0, 10),
    tickers: a.tickers,
  }));

  const model = resolveInternalPipelineModel(null);
  const tickerHint = ticker && ticker !== "GENERAL" ? ` Focus on ticker ${ticker}.` : "";

  const messages = [
    {
      role: "system",
      content: `You extract crypto market events (launches, upgrades, conferences, listings, regulatory) from news headlines ONLY. Output ONLY JSON: { "events": [ { "date": "YYYY-MM-DD", "event_name": string, "event_text": string, "ticker": string } ] }. Max 15 events. No invented dates beyond what articles imply.${tickerHint}`,
    },
    {
      role: "user",
      content: JSON.stringify({ articles: slice }),
    },
  ];

  try {
    const { response } = await callOpenRouter(messages, {
      model,
      max_tokens: 1200,
      temperature: 0.2,
    });
    const parsed = parseJsonObjectFromLlm(response);
    const list = Array.isArray(parsed?.events) ? parsed.events : [];
    /** @type {Record<string, EventRow[]>} */
    const out = {};
    for (const ev of list) {
      if (!ev || typeof ev !== "object") continue;
      const row = /** @type {Record<string, unknown>} */ (ev);
      const date = String(row.date || "").slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
      const event_name = String(row.event_name || row.title || "").trim();
      if (!event_name) continue;
      const eventRow = {
        event_name: event_name.slice(0, 200),
        event_text: String(row.event_text || row.description || event_name).slice(0, 500),
        ticker: String(row.ticker || "").toUpperCase().slice(0, 12),
        source: "syra-news-extract",
      };
      if (!out[date]) out[date] = [];
      out[date].push(eventRow);
    }
    return out;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("[internal-news] LLM event extract failed:", msg);
    return {};
  }
}

/**
 * Merge two event maps (date keys).
 * @param {Record<string, EventRow[]>} a
 * @param {Record<string, EventRow[]>} b
 */
function mergeEventMaps(a, b) {
  const out = { ...a };
  for (const [date, rows] of Object.entries(b)) {
    if (!out[date]) out[date] = [];
    out[date].push(...rows);
  }
  return out;
}

/**
 * @param {string} [ticker]
 * @returns {Promise<Record<string, EventRow[]>>}
 */
export async function fetchEventsForTicker(ticker = "general") {
  const t = String(ticker || "general").trim().toUpperCase() || "GENERAL";
  const cacheKey = `events:${t}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const [calEvents, recentNews] = await Promise.all([
    fetchCoinMarketCalEvents(),
    getArticlesWithinHours(72),
  ]);

  let filteredNews = recentNews;
  if (t !== "GENERAL") {
    const keywords = keywordsForTicker(t);
    filteredNews = recentNews.filter((a) => {
      if (a.tickers.includes(t)) return true;
      const blob = `${a.title} ${a.description}`.toLowerCase();
      return keywords.some((kw) => blob.includes(kw.toLowerCase()));
    });
  }

  const newsEvents = groupEventsByDate(
    filteredNews.filter((a) =>
      /launch|listing|upgrade|fork|mainnet|testnet|conference|summit|halving|unlock|airdrop|vote|hearing|etf|partnership|integrat/i.test(
        `${a.title} ${a.description}`,
      ),
    ),
  );

  let llmEvents = {};
  const calCount = Object.values(calEvents).flat().length;
  if (calCount < 5) {
    llmEvents = await extractEventsFromNewsLlm(filteredNews, t);
  }

  let merged = mergeEventMaps(calEvents, mergeEventMaps(newsEvents, llmEvents));

  if (t !== "GENERAL") {
    /** @type {Record<string, EventRow[]>} */
    const filtered = {};
    for (const [date, rows] of Object.entries(merged)) {
      const kept = rows.filter(
        (r) =>
          !r.ticker ||
          r.ticker === t ||
          r.event_text.toUpperCase().includes(t) ||
          r.event_name.toUpperCase().includes(t),
      );
      if (kept.length > 0) filtered[date] = kept;
    }
    merged = filtered;
  }

  if (Object.keys(merged).length > 0) setCached(cacheKey, merged);
  return merged;
}
