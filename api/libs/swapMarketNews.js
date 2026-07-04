/**
 * Swap market panel feed — news + token events from one shared article burst.
 * Uses Google News (crypto-biased) + warm RSS index, then derives event-like
 * headlines and CoinMarketCal rows for the focused token.
 */
import { keywordsForAsset } from '../config/internalNewsConfig.js';
import { buildAssetFeedBundle } from './assetNewsFeed.js';

const NEWS_LIMIT = 6;
const EVENTS_LIMIT = 8;
const CACHE_TTL_MS = 90_000;

/** @type {Map<string, { expires: number; data: object }>} */
const cache = new Map();

function trim(v) {
  return v != null ? String(v).trim() : '';
}

/**
 * @param {unknown} rows
 * @param {number} limit
 */
function flattenEvents(rows, limit = EVENTS_LIMIT) {
  if (!Array.isArray(rows)) return [];
  /** @type {Array<Record<string, unknown>>} */
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const r = /** @type {Record<string, unknown>} */ (row);
    const date = String(r.date ?? '');
    const bucket = r.ticker ?? r.general;
    if (!Array.isArray(bucket)) continue;
    for (const ev of bucket) {
      if (!ev || typeof ev !== 'object') continue;
      out.push({ .../** @type {Record<string, unknown>} */ (ev), date });
    }
  }
  // Prefer newest dates first for the swap panel.
  return out
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
    .slice(0, limit);
}

/**
 * @param {{ symbol?: string; name?: string; mint?: string }} input
 */
export async function buildSwapMarketNews(input) {
  const symbol = trim(input.symbol);
  const name = trim(input.name);
  const mint = trim(input.mint);

  if (!symbol && !name && !mint) {
    return { ok: false, error: 'Provide symbol, name, or mint', status: 400 };
  }

  const ticker = (symbol || name || 'TOKEN').toUpperCase();
  const assetLabel = name || symbol || mint;
  const cacheKey = [ticker, name.toLowerCase(), mint].join('|');
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return { ok: true, data: cached.data };
  }

  const keywordQuery = keywordsForAsset({
    ticker,
    name: name || undefined,
  });

  const emptyNews = (error) => ({
    ok: false,
    items: [],
    error,
  });
  const emptyEvents = (error) => ({
    ok: false,
    items: [],
    error,
  });

  if (!keywordQuery.primary?.length && !keywordQuery.all?.length) {
    const data = {
      query: { mint: mint || undefined, symbol: symbol || undefined, name: name || undefined },
      news: emptyNews(`No headlines found related to ${assetLabel}`),
      events: emptyEvents(`No events found related to ${assetLabel}`),
      fetchedAt: new Date().toISOString(),
    };
    return { ok: true, data };
  }

  const feed = await buildAssetFeedBundle(ticker, keywordQuery, {
    newsLimit: NEWS_LIMIT,
    cryptoBias: true,
  });

  const newsItems = Array.isArray(feed.news) ? feed.news : [];
  const eventItems = flattenEvents(feed.events, EVENTS_LIMIT);

  const data = {
    query: { mint: mint || undefined, symbol: symbol || undefined, name: name || undefined },
    news: {
      ok: newsItems.length > 0,
      items: newsItems,
      ...(newsItems.length === 0
        ? { error: `No headlines found related to ${assetLabel}` }
        : {}),
    },
    events: {
      ok: eventItems.length > 0,
      items: eventItems,
      ...(eventItems.length === 0
        ? { error: `No events found related to ${assetLabel}` }
        : {}),
    },
    fetchedAt: new Date().toISOString(),
  };

  if (newsItems.length > 0 || eventItems.length > 0) {
    cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });
  }

  return { ok: true, data };
}
