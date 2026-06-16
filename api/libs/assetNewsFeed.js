/**
 * Asset-scoped news/sentiment/events for dashboard intelligence (no x402, no general crypto fallback).
 */
import { resolveTickerFromCoingecko } from '../utils/coingeckoAPI.js';
import { fetchSentimentTicker } from './internalNewsAgent.js';
import {
  fetchAllRawArticles,
  filterArticlesByAssetKeywords,
  toCryptonewsShape,
} from './newsAggregator.js';
import { fetchGoogleNewsForAsset } from './newsSources/googleNewsRss.js';
import { fetchCoinMarketCalEventsFiltered } from './assetEventsFromNews.js';

const CACHE_TTL_MS = 90 * 1000;
const NEWS_LIST_ITEMS = Math.min(
  100,
  Math.max(
    15,
    Number.parseInt(process.env.INTERNAL_NEWS_ITEMS || process.env.CRYPTONEWS_NEWS_ITEMS || '24', 10),
  ),
);

/** @type {Map<string, { expires: number; data: unknown }>} */
const newsCache = new Map();
/** @type {Map<string, { expires: number; data: unknown }>} */
const sentimentCache = new Map();
/** @type {Map<string, { expires: number; data: unknown }>} */
const eventCache = new Map();

/**
 * @param {string} ticker
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 */
function cacheKey(ticker, keywordQuery = {}) {
  const base = String(ticker || 'asset').trim().toLowerCase() || 'asset';
  const primary = (keywordQuery.primary || []).join('|');
  const all = (keywordQuery.all || []).join('|');
  return `${base}:${primary}:${all}`;
}

/**
 * @param {string} tickerOrName
 * @returns {Promise<string>}
 */
export async function resolveNewsTicker(tickerOrName) {
  const raw = String(tickerOrName || '').trim();
  if (!raw || raw.toLowerCase() === 'general') return raw.toUpperCase() || 'GENERAL';
  try {
    const resolved = await resolveTickerFromCoingecko(raw);
    return resolved ? resolved.symbol.toUpperCase() : raw.toUpperCase();
  } catch {
    return raw.toUpperCase();
  }
}

/**
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 */
async function fetchRawArticlesForAsset(keywordQuery) {
  const [indexArticles, googleArticles] = await Promise.all([
    fetchAllRawArticles(),
    fetchGoogleNewsForAsset(keywordQuery),
  ]);
  return filterArticlesByAssetKeywords([...indexArticles, ...googleArticles], keywordQuery);
}

/**
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @param {number} n
 */
async function fetchAssetRelatedArticles(keywordQuery, n) {
  if (!keywordQuery.all?.length && !keywordQuery.primary?.length) return [];

  const filtered = await fetchRawArticlesForAsset(keywordQuery);

  return filtered
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, n)
    .map(toCryptonewsShape);
}

/**
 * @param {import('./newsAggregator.js').CryptonewsArticle[]} articles
 */
function dedupeNewsArticles(articles) {
  const seen = new Set();
  /** @type {typeof articles} */
  const out = [];
  for (const row of articles) {
    const key = String(row.news_url || row.title || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/**
 * @param {string} ticker
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @param {number} [limit]
 */
export async function getAssetNews(ticker, keywordQuery = {}, limit = 8) {
  const key = cacheKey(ticker, keywordQuery);
  const hit = newsCache.get(key);
  if (hit && Date.now() < hit.expires) {
    return Array.isArray(hit.data) ? hit.data.slice(0, limit) : [];
  }

  const rows = dedupeNewsArticles(await fetchAssetRelatedArticles(keywordQuery, NEWS_LIST_ITEMS));

  if (rows.length > 0) newsCache.set(key, { data: rows, expires: Date.now() + CACHE_TTL_MS });
  return rows.slice(0, limit);
}

/**
 * @param {import('./newsSources/rssParser.js').RawArticle[]} articles
 */
function deriveSentimentRowsFromArticles(articles) {
  if (!articles.length) return [];

  let pos = 0;
  let neg = 0;
  let neu = 0;
  for (const a of articles) {
    const shaped = toCryptonewsShape(a);
    const s = String(shaped.sentiment || '').toLowerCase();
    if (/\b(positive|bullish|bull)\b/.test(s)) pos += 1;
    else if (/\b(negative|bearish|bear)\b/.test(s)) neg += 1;
    else neu += 1;
  }

  const total = pos + neg + neu;
  if (total === 0) return [];

  const score = (pos - neg) / total;
  const today = new Date().toISOString().slice(0, 10);
  return [
    {
      date: today,
      ticker: {
        Positive: pos,
        Negative: neg,
        Neutral: neu,
        Total: total,
        sentiment_score: score,
        Sentiment_Score: score,
      },
    },
  ];
}

/**
 * @param {unknown[]} rows
 */
function hasSentimentData(rows) {
  return (
    Array.isArray(rows) &&
    rows.length > 0 &&
    rows.some((row) => {
      const bucket = row?.ticker ?? row?.general ?? row?.allTicker;
      if (!bucket || typeof bucket !== 'object') return false;
      const b = /** @type {Record<string, number>} */ (bucket);
      return (b.Total ?? 0) > 0 || (b.Positive ?? 0) + (b.Negative ?? 0) + (b.Neutral ?? 0) > 0;
    })
  );
}

/**
 * @param {string} ticker
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 */
export async function getAssetSentiment(ticker, keywordQuery = {}) {
  const key = cacheKey(ticker, keywordQuery);
  const hit = sentimentCache.get(key);
  if (hit && Date.now() < hit.expires) return hit.data;

  let result = [];
  if (ticker && ticker !== 'GENERAL') {
    const raw = await fetchSentimentTicker(ticker);
    result = Object.keys(raw).map((date) => ({ date, ticker: raw[date] }));
  }

  if (!hasSentimentData(result)) {
    const rawArticles = await fetchRawArticlesForAsset(keywordQuery);
    result = deriveSentimentRowsFromArticles(rawArticles);
  }

  if (Array.isArray(result) && result.length > 0) {
    sentimentCache.set(key, { data: result, expires: Date.now() + CACHE_TTL_MS });
  }
  return result;
}

const EVENT_HEADLINE_RE =
  /launch|listing|upgrade|fork|mainnet|testnet|conference|summit|halving|unlock|airdrop|vote|hearing|etf|partnership|integrat|earnings|ipo|dividend|split|acqui/i;

/**
 * @param {import('./newsSources/rssParser.js').RawArticle[]} articles
 */
function eventsFromArticles(articles) {
  /** @type {Record<string, Array<Record<string, unknown>>>} */
  const out = {};
  for (const a of articles) {
    const blob = `${a.title} ${a.description}`;
    if (!EVENT_HEADLINE_RE.test(blob)) continue;
    const date = a.publishedAt.slice(0, 10);
    if (!out[date]) out[date] = [];
    out[date].push({
      event_name: a.title.slice(0, 200),
      event_text: a.description.slice(0, 500) || a.title,
      ticker: a.tickers[0] || '',
      source: a.source,
    });
  }
  return Object.keys(out)
    .sort()
    .map((date) => ({ date, ticker: out[date] }));
}

/**
 * @param {unknown[]} rows
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 */
function filterEventRowsByAsset(rows, keywordQuery) {
  const primary = keywordQuery.primary || [];
  const all = keywordQuery.all || [];
  if (!Array.isArray(rows)) return [];

  return rows
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const r = /** @type {Record<string, unknown>} */ (row);
      const bucket = r.ticker ?? r.general;
      if (!Array.isArray(bucket)) return null;
      const filtered = bucket.filter((ev) => {
        if (!ev || typeof ev !== 'object') return false;
        const e = /** @type {Record<string, unknown>} */ (ev);
        const blob = `${e.event_name ?? ''} ${e.event_text ?? ''} ${e.ticker ?? ''}`.toLowerCase();
        if (primary.length > 0) {
          return primary.some((kw) => blob.includes(kw.toLowerCase()));
        }
        return all.some((kw) => blob.includes(kw.toLowerCase()));
      });
      if (filtered.length === 0) return null;
      return { date: r.date, ticker: filtered };
    })
    .filter(Boolean);
}

/**
 * @param {string} ticker
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 */
export async function getAssetEvents(ticker, keywordQuery = {}) {
  const key = cacheKey(ticker, keywordQuery);
  const hit = eventCache.get(key);
  if (hit && Date.now() < hit.expires) return hit.data;

  const recentArticles = (await fetchRawArticlesForAsset(keywordQuery)).filter(
    (a) => new Date(a.publishedAt).getTime() >= Date.now() - 168 * 60 * 60 * 1000,
  );

  /** @type {unknown[]} */
  let result = eventsFromArticles(
    recentArticles.filter((a) => EVENT_HEADLINE_RE.test(`${a.title} ${a.description}`)),
  );

  const calFiltered = await fetchCoinMarketCalEventsFiltered(keywordQuery);
  if (calFiltered.length > 0) {
    result = [...result, ...calFiltered];
  }

  result = filterEventRowsByAsset(result, keywordQuery);

  if (Array.isArray(result) && result.length > 0) {
    eventCache.set(key, { data: result, expires: Date.now() + CACHE_TTL_MS });
  }
  return result;
}
