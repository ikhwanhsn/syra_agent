/**
 * Fast news for the swap market panel — symbol/name keywords only.
 * Skips mint resolve, CoinGecko lookup, sentiment, events, and signal.
 * Uses Google News only (no full RSS index wait).
 */
import { keywordsForAsset } from '../config/internalNewsConfig.js';
import { filterArticlesByAssetKeywords, toCryptonewsShape } from './newsAggregator.js';
import { fetchGoogleNewsForAsset } from './newsSources/googleNewsRss.js';

const NEWS_LIMIT = 6;
const GOOGLE_NEWS_TIMEOUT_MS = 2_500;
const CACHE_TTL_MS = 90_000;

/** @type {Map<string, { expires: number; data: object }>} */
const cache = new Map();

function trim(v) {
  return v != null ? String(v).trim() : '';
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
  const cacheKey = [ticker, name.toLowerCase(), mint].join('|');
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return { ok: true, data: cached.data };
  }

  const keywordQuery = keywordsForAsset({
    ticker,
    name: name || undefined,
  });

  const empty = (error) => ({
    ok: true,
    data: {
      query: { mint: mint || undefined, symbol: symbol || undefined, name: name || undefined },
      news: { ok: false, items: [], error },
      fetchedAt: new Date().toISOString(),
    },
  });

  if (!keywordQuery.primary?.length && !keywordQuery.all?.length) {
    return empty(`No headlines found related to ${name || symbol || mint}`);
  }

  const googleArticles = await fetchGoogleNewsForAsset(keywordQuery, GOOGLE_NEWS_TIMEOUT_MS);
  const filtered = filterArticlesByAssetKeywords(googleArticles, keywordQuery);
  const items = filtered
    .slice()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, NEWS_LIMIT)
    .map(toCryptonewsShape);

  const data = {
    query: { mint: mint || undefined, symbol: symbol || undefined, name: name || undefined },
    news: {
      ok: items.length > 0,
      items,
      ...(items.length === 0
        ? { error: `No headlines found related to ${name || symbol || mint}` }
        : {}),
    },
    fetchedAt: new Date().toISOString(),
  };

  if (items.length > 0) {
    cache.set(cacheKey, { data, expires: Date.now() + CACHE_TTL_MS });
  }

  return { ok: true, data };
}
