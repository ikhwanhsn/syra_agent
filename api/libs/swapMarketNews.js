/**
 * Swap market panel feed — news + token events for one or both swap-side tokens.
 * Per-token Google News (with fallbacks) + warm RSS index + CoinMarketCal.
 */
import { buildSwapPairFeedBundle } from './assetNewsFeed.js';

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
  return out
    .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
    .slice(0, limit);
}

/**
 * @param {Array<{ symbol?: string; name?: string; mint?: string }>} tokens
 */
function normalizeSwapTokens(tokens) {
  if (!Array.isArray(tokens)) return [];
  /** @type {Array<{ symbol?: string; name?: string; mint?: string }>} */
  const out = [];
  const seen = new Set();
  for (const raw of tokens) {
    if (!raw || typeof raw !== 'object') continue;
    const symbol = trim(raw.symbol);
    const name = trim(raw.name);
    const mint = trim(raw.mint);
    if (!symbol && !name && !mint) continue;
    const key = mint.toLowerCase() || symbol.toUpperCase() || name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      symbol: symbol || undefined,
      name: name || undefined,
      mint: mint || undefined,
    });
  }
  return out;
}

/**
 * @param {Array<{ symbol?: string; name?: string; mint?: string }>} tokens
 */
function swapCacheKey(tokens) {
  return tokens
    .map((t) => [t.mint || '', t.symbol || '', t.name || ''].join(':'))
    .sort()
    .join('|');
}

/**
 * @param {Array<{ symbol?: string; name?: string; mint?: string }>} tokens
 */
function swapAssetLabel(tokens) {
  const labels = tokens
    .map((t) => t.name || t.symbol || t.mint)
    .filter(Boolean);
  if (labels.length === 0) return 'these tokens';
  if (labels.length === 1) return labels[0];
  return `${labels[0]} and ${labels[1]}`;
}

/**
 * @param {{ symbol?: string; name?: string; mint?: string; tokens?: Array<{ symbol?: string; name?: string; mint?: string }> }} input
 */
export async function buildSwapMarketNews(input) {
  const legacyToken = {
    symbol: trim(input.symbol) || undefined,
    name: trim(input.name) || undefined,
    mint: trim(input.mint) || undefined,
  };

  const tokens = normalizeSwapTokens(
    Array.isArray(input.tokens) && input.tokens.length > 0
      ? input.tokens
      : legacyToken.symbol || legacyToken.name || legacyToken.mint
        ? [legacyToken]
        : [],
  );

  if (tokens.length === 0) {
    return { ok: false, error: 'Provide tokens (symbol, name, or mint)', status: 400 };
  }

  const assetLabel = swapAssetLabel(tokens);
  const cacheKey = swapCacheKey(tokens);
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return { ok: true, data: cached.data };
  }

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

  const feed = await buildSwapPairFeedBundle(tokens, {
    newsLimit: NEWS_LIMIT,
    eventsLimit: EVENTS_LIMIT,
    cryptoBias: true,
  });

  const newsItems = Array.isArray(feed.news) ? feed.news : [];
  const eventItems = Array.isArray(feed.events)
    ? feed.events
    : flattenEvents(feed.events, EVENTS_LIMIT);

  const data = {
    query: { tokens },
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
