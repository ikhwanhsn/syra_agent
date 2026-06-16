/**
 * Merge, dedupe, filter, and cache normalized crypto news articles.
 */

import { fetchAllSources } from "./newsSources/index.js";
import { keywordsForTicker, INTERNAL_NEWS_CACHE_TTL_MS } from "../config/internalNewsConfig.js";

/**
 * @typedef {import("./newsSources/rssParser.js").RawArticle} RawArticle
 */

/**
 * @typedef {{
 *   news_url: string;
 *   title: string;
 *   text: string;
 *   source_name: string;
 *   date: string;
 *   published_at: string;
 *   tickers: string[];
 *   sentiment?: string;
 * }} CryptonewsArticle
 */

/** @type {Map<string, { expires: number; data: CryptonewsArticle[] }>} */
const articleCache = new Map();

/** @type {Promise<RawArticle[]> | null} */
let inflightFetch = null;

/**
 * @param {string} s
 * @returns {string}
 */
function normalizeTitleKey(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 120);
}

/**
 * @param {RawArticle} raw
 * @returns {CryptonewsArticle}
 */
export function toCryptonewsShape(raw) {
  return {
    news_url: raw.url,
    title: raw.title,
    text: raw.description,
    source_name: raw.source,
    date: raw.publishedAt.slice(0, 10),
    published_at: raw.publishedAt,
    tickers: raw.tickers,
  };
}

/**
 * @param {RawArticle[]} articles
 * @returns {RawArticle[]}
 */
function dedupeArticles(articles) {
  const seenUrl = new Set();
  const seenTitle = new Set();
  /** @type {RawArticle[]} */
  const out = [];

  const sorted = [...articles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  for (const a of sorted) {
    const urlKey = a.url.toLowerCase().replace(/\/+$/, "");
    if (seenUrl.has(urlKey)) continue;
    const titleKey = normalizeTitleKey(a.title);
    if (titleKey && seenTitle.has(titleKey)) continue;
    seenUrl.add(urlKey);
    if (titleKey) seenTitle.add(titleKey);
    out.push(a);
  }
  return out;
}

/**
 * @param {RawArticle[]} articles
 * @param {string} ticker
 * @returns {RawArticle[]}
 */
function filterByTicker(articles, ticker) {
  const t = String(ticker || "").trim().toUpperCase();
  if (!t || t === "GENERAL") return articles;

  const keywords = keywordsForTicker(t);
  if (keywords.length === 0) return articles;

  return articles.filter((a) => {
    if (a.tickers.includes(t)) return true;
    const blob = `${a.title} ${a.description}`.toLowerCase();
    return keywords.some((kw) => blob.includes(kw.toLowerCase()));
  });
}

/**
 * @param {string} cacheKey
 * @returns {CryptonewsArticle[] | null}
 */
function getCached(cacheKey) {
  const entry = articleCache.get(cacheKey);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

/**
 * @param {string} cacheKey
 * @param {CryptonewsArticle[]} data
 */
function setCached(cacheKey, data) {
  articleCache.set(cacheKey, { data, expires: Date.now() + INTERNAL_NEWS_CACHE_TTL_MS });
}

/**
 * Fetch all RSS sources (deduped inflight).
 * @returns {Promise<RawArticle[]>}
 */
export async function fetchAllRawArticles() {
  if (inflightFetch) return inflightFetch;
  inflightFetch = fetchAllSources()
    .then((items) => dedupeArticles(items))
    .finally(() => {
      inflightFetch = null;
    });
  return inflightFetch;
}

/**
 * @param {{ ticker?: string; items?: number; tickersOnly?: boolean }} [opts]
 * @returns {Promise<CryptonewsArticle[]>}
 */
export async function getAggregatedNews(opts = {}) {
  const ticker = String(opts.ticker || "general").trim().toUpperCase() || "GENERAL";
  const items = Math.min(200, Math.max(1, Number(opts.items) || 100));
  const tickersOnly = !!opts.tickersOnly;
  const cacheKey = `news:${ticker}:${items}:${tickersOnly ? "only" : "all"}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  let raw = await fetchAllRawArticles();

  if (ticker !== "GENERAL") {
    raw = filterByTicker(raw, ticker);
    if (tickersOnly) {
      raw = raw.filter((a) => a.tickers.includes(ticker));
    }
  }

  const shaped = raw.slice(0, items).map(toCryptonewsShape);
  if (shaped.length > 0) setCached(cacheKey, shaped);
  return shaped;
}

/**
 * @param {string} kw
 */
function escapeRegExp(kw) {
  return kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} blob
 * @param {string} kw
 */
function articleMatchesKeyword(blob, kw) {
  const k = kw.toLowerCase();
  if (k.length >= 4) return blob.includes(k);
  return new RegExp(`\\b${escapeRegExp(k)}\\b`, "i").test(blob);
}

/**
 * @param {import("./newsSources/rssParser.js").RawArticle} article
 * @param {string[]} keywords
 */
function articleTickerMatches(article, keywords) {
  if (!Array.isArray(article.tickers) || article.tickers.length === 0) return false;
  const kws = keywords.map((k) => k.toUpperCase());
  return article.tickers.some((t) => {
    const upper = String(t).toUpperCase();
    return kws.some((kw) => upper === kw || upper.includes(kw));
  });
}

/**
 * Strict asset-related filter — requires a primary keyword when provided.
 * @param {import("./newsSources/rssParser.js").RawArticle[]} articles
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @returns {import("./newsSources/rssParser.js").RawArticle[]}
 */
export function filterArticlesByAssetKeywords(articles, keywordQuery = {}) {
  const primary = (keywordQuery.primary || [])
    .map((k) => String(k || "").trim().toLowerCase())
    .filter((k) => k.length >= 2);
  const all = (keywordQuery.all || primary)
    .map((k) => String(k || "").trim().toLowerCase())
    .filter((k) => k.length >= 2);

  if (primary.length === 0 && all.length === 0) return [];

  return articles.filter((a) => {
    const blob = `${a.title} ${a.description}`.toLowerCase();
    if (primary.length > 0) {
      if (primary.some((kw) => articleMatchesKeyword(blob, kw))) return true;
      if (articleTickerMatches(a, primary)) return true;
      return false;
    }
    if (all.some((kw) => articleMatchesKeyword(blob, kw))) return true;
    return articleTickerMatches(a, all);
  });
}

/**
 * @param {RawArticle[]} articles
 * @param {string[]} keywords
 * @returns {RawArticle[]}
 */
export function filterArticlesByKeywords(articles, keywords) {
  return filterArticlesByAssetKeywords(articles, { all: keywords, primary: keywords });
}

/**
 * @param {{ keywords?: string[]; keywordQuery?: { primary?: string[]; all?: string[] }; items?: number }} [opts]
 * @returns {Promise<CryptonewsArticle[]>}
 */
export async function getAggregatedNewsByKeywords(opts = {}) {
  const keywordQuery = opts.keywordQuery ?? {
    all: Array.isArray(opts.keywords) ? opts.keywords : [],
    primary: Array.isArray(opts.keywords) ? opts.keywords : [],
  };
  const items = Math.min(200, Math.max(1, Number(opts.items) || 100));
  const cacheKey = `news:asset:${keywordQuery.primary?.join("|")}:${keywordQuery.all?.join("|")}:${items}`;

  const cached = getCached(cacheKey);
  if (cached) return cached;

  const raw = filterArticlesByAssetKeywords(await fetchAllRawArticles(), keywordQuery);
  const shaped = raw.slice(0, items).map(toCryptonewsShape);
  if (shaped.length > 0) setCached(cacheKey, shaped);
  return shaped;
}

/**
 * Articles from the last N hours (for sentiment / sundown).
 * @param {number} hours
 * @returns {Promise<RawArticle[]>}
 */
export async function getArticlesWithinHours(hours) {
  const all = await fetchAllRawArticles();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return all.filter((a) => new Date(a.publishedAt).getTime() >= cutoff);
}
