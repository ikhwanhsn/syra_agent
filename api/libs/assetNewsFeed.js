/**
 * Asset-scoped news/sentiment/events for dashboard intelligence (no x402, no general crypto fallback).
 *
 * Fast path: Google News (asset-specific) + warm RSS index when available within a short budget.
 * Avoids waiting on the full multi-source RSS crawl (often >6s cold), which previously caused
 * "News timed out" / "Events timed out" on the asset detail page.
 */
import { keywordsForAsset, mergeKeywordQueries } from '../config/internalNewsConfig.js';
import { resolveTickerFromCoingecko } from '../utils/coingeckoAPI.js';
import { fetchSentimentTicker } from './internalNewsAgent.js';
import {
  fetchAllRawArticlesWithin,
  filterArticlesByAssetKeywords,
  toCryptonewsShape,
} from './newsAggregator.js';
import { fetchGoogleNewsWithFallbacks } from './newsSources/googleNewsRss.js';
import { fetchCoinMarketCalEventsFiltered } from './assetEventsFromNews.js';

const CACHE_TTL_MS = 90 * 1000;
/** Full RSS index is slow cold — only wait this long; Google News is the primary source. */
const INDEX_BUDGET_MS = 2_500;
const GOOGLE_NEWS_TIMEOUT_MS = 4_500;
const COINMARKETCAL_TIMEOUT_MS = 5_000;
/** How far back news headlines may count as token events. */
const EVENT_LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;
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
/** @type {Map<string, { expires: number; data: import('./newsSources/rssParser.js').RawArticle[] }>} */
const articlePackCache = new Map();
/** @type {Map<string, Promise<import('./newsSources/rssParser.js').RawArticle[]>>} */
const inflightArticles = new Map();

/**
 * @param {string} ticker
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @param {{ cryptoBias?: boolean }} [opts]
 */
function cacheKey(ticker, keywordQuery = {}, opts = {}) {
  const base = String(ticker || 'asset').trim().toLowerCase() || 'asset';
  const primary = (keywordQuery.primary || []).join('|');
  const all = (keywordQuery.all || []).join('|');
  const bias = opts.cryptoBias ? ':crypto' : '';
  return `${base}:${primary}:${all}${bias}`;
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {T} fallback
 * @returns {Promise<T>}
 */
function settleWithin(promise, ms, fallback) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(fallback), ms);
    }),
  ]).finally(() => clearTimeout(timer));
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
 * Shared article pack for news / sentiment / events (one network burst per asset).
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @param {{ cryptoBias?: boolean }} [opts]
 * @returns {Promise<import('./newsSources/rssParser.js').RawArticle[]>}
 */
export async function fetchRawArticlesForAsset(keywordQuery, opts = {}) {
  const key = cacheKey('raw', keywordQuery, opts);
  const cached = articlePackCache.get(key);
  if (cached && Date.now() < cached.expires) return cached.data;

  const inflight = inflightArticles.get(key);
  if (inflight) return inflight;

  const promise = (async () => {
    // Google News is asset-targeted and usually finishes in 1–3s.
    // Full RSS index only contributes when warm or finishes within INDEX_BUDGET_MS.
    const [indexArticles, googleArticles] = await Promise.all([
      fetchAllRawArticlesWithin(INDEX_BUDGET_MS),
      fetchGoogleNewsWithFallbacks(keywordQuery, GOOGLE_NEWS_TIMEOUT_MS, {
        cryptoBias: Boolean(opts.cryptoBias),
      }),
    ]);

    const filtered = filterArticlesByAssetKeywords(
      [...indexArticles, ...googleArticles],
      keywordQuery,
    );

    if (filtered.length > 0) {
      articlePackCache.set(key, { data: filtered, expires: Date.now() + CACHE_TTL_MS });
    }
    return filtered;
  })().finally(() => {
    inflightArticles.delete(key);
  });

  inflightArticles.set(key, promise);
  return promise;
}

/**
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @param {number} n
 * @param {{ cryptoBias?: boolean }} [opts]
 */
async function fetchAssetRelatedArticles(keywordQuery, n, opts = {}) {
  if (!keywordQuery.all?.length && !keywordQuery.primary?.length) return [];

  const filtered = await fetchRawArticlesForAsset(keywordQuery, opts);

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
 * @param {{ cryptoBias?: boolean }} [opts]
 */
export async function getAssetNews(ticker, keywordQuery = {}, limit = 8, opts = {}) {
  const key = cacheKey(ticker, keywordQuery, opts);
  const hit = newsCache.get(key);
  if (hit && Date.now() < hit.expires) {
    return Array.isArray(hit.data) ? hit.data.slice(0, limit) : [];
  }

  const rows = dedupeNewsArticles(
    await fetchAssetRelatedArticles(keywordQuery, NEWS_LIST_ITEMS, opts),
  );

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
    try {
      const raw = await settleWithin(fetchSentimentTicker(ticker), 2_500, {});
      result = Object.keys(raw).map((date) => ({ date, ticker: raw[date] }));
    } catch {
      result = [];
    }
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

/** Catalyst / calendar-style headlines derived from the shared news scrape. */
const EVENT_HEADLINE_RE =
  /launch|listing|delist|upgrade|fork|mainnet|testnet|conference|summit|halving|unlock|airdrop|vote|voting|proposal|governance|hearing|etf|partnership|integrat|support(?:ing|s|ed)?\b|earnings|ipo|dividend|split|acqui|hack|exploit|lawsuit|regulat|approval|roadmap|release|burn|migration|rebrand|suspend|ban|funding|raise|seed round|series [a-c]\b|token sale|ido\b|ico\b|tge\b|claim|snapshot|deadline|goes live|going live|announces|announced|unveil|debut|rolls out|rolled out|opens? (?:to|for)|closes? (?:to|for)|hard fork|soft fork|token burn|staking|unstak|validator|upgrade to|v\d+\.\d+/i;

/** Market-moving headlines used when no hard catalyst match is found. */
const SOFT_EVENT_RE =
  /\b(price|rally|surge|soar|plunge|crash|ath|all[- ]time|breakout|sell-?off|whale|liquidation|market cap|hits? \$?\d|jumps?|spikes?|drops?|falls?|rises?|gains?\b|loses?\b)/i;

/**
 * Pick event-like articles from the shared news pack (hard catalysts first, soft movers fill).
 * @param {import('./newsSources/rssParser.js').RawArticle[]} articles
 * @param {number} [limit]
 */
function selectEventArticles(articles, limit = 12) {
  const recent = articles
    .filter((a) => new Date(a.publishedAt).getTime() >= Date.now() - EVENT_LOOKBACK_MS)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  const seen = new Set();
  /** @type {import('./newsSources/rssParser.js').RawArticle[]} */
  const picked = [];

  const push = (row) => {
    const key = `${row.title}|${row.url || ''}`.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    picked.push(row);
  };

  for (const a of recent) {
    if (EVENT_HEADLINE_RE.test(`${a.title} ${a.description}`)) push(a);
    if (picked.length >= limit) return picked;
  }
  for (const a of recent) {
    if (SOFT_EVENT_RE.test(`${a.title} ${a.description}`)) push(a);
    if (picked.length >= limit) return picked;
  }
  return picked;
}

/**
 * @param {import('./newsSources/rssParser.js').RawArticle[]} articles
 */
function eventsFromArticles(articles) {
  /** @type {Record<string, Array<Record<string, unknown>>>} */
  const out = {};
  for (const a of articles) {
    // Caller selects event-like articles (hard catalysts or soft market movers).
    const date = String(a.publishedAt || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
    if (!out[date]) out[date] = [];
    out[date].push({
      event_name: a.title.slice(0, 200),
      event_text: (a.description || a.title).slice(0, 500),
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
  const terms = [
    ...new Set(
      [...(keywordQuery.primary || []), ...(keywordQuery.all || [])]
        .map((kw) => String(kw || '').trim().toLowerCase())
        .filter((kw) => kw.length >= 2),
    ),
  ];
  if (!Array.isArray(rows) || terms.length === 0) return [];

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
        return terms.some((kw) => blob.includes(kw));
      });
      if (filtered.length === 0) return null;
      return { date: r.date, ticker: filtered };
    })
    .filter(Boolean);
}

/**
 * @param {string} ticker
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @param {{ cryptoBias?: boolean }} [opts]
 */
export async function getAssetEvents(ticker, keywordQuery = {}, opts = {}) {
  const key = cacheKey(ticker, keywordQuery, opts);
  const hit = eventCache.get(key);
  if (hit && Date.now() < hit.expires) return hit.data;

  // Articles + CoinMarketCal in parallel (CMC used to run after articles and blow the budget).
  const [rawArticles, calFiltered] = await Promise.all([
    fetchRawArticlesForAsset(keywordQuery, opts),
    settleWithin(
      fetchCoinMarketCalEventsFiltered(keywordQuery).catch(() => []),
      COINMARKETCAL_TIMEOUT_MS,
      [],
    ),
  ]);

  /** @type {unknown[]} */
  let result = eventsFromArticles(selectEventArticles(rawArticles));

  if (Array.isArray(calFiltered) && calFiltered.length > 0) {
    result = [...result, ...calFiltered];
  }

  result = filterEventRowsByAsset(result, keywordQuery);

  if (Array.isArray(result) && result.length > 0) {
    eventCache.set(key, { data: result, expires: Date.now() + CACHE_TTL_MS });
  }
  return result;
}

/**
 * Single burst for intelligence: shared articles, no outer race that surfaces "timed out".
 * Events are derived from the same article pack (event-like headlines) + CoinMarketCal.
 * @param {string} ticker
 * @param {{ primary?: string[]; all?: string[] }} keywordQuery
 * @param {{ newsLimit?: number; cryptoBias?: boolean }} [opts]
 */
export async function buildAssetFeedBundle(ticker, keywordQuery = {}, opts = {}) {
  const newsLimit = opts.newsLimit ?? 8;
  const feedOpts = { cryptoBias: Boolean(opts.cryptoBias) };

  const newsKey = cacheKey(ticker, keywordQuery, feedOpts);
  const newsHit = newsCache.get(newsKey);
  const sentimentHit = sentimentCache.get(newsKey);
  const eventHit = eventCache.get(newsKey);

  if (
    newsHit &&
    Date.now() < newsHit.expires &&
    sentimentHit &&
    Date.now() < sentimentHit.expires &&
    eventHit &&
    Date.now() < eventHit.expires
  ) {
    return {
      news: Array.isArray(newsHit.data) ? newsHit.data.slice(0, newsLimit) : [],
      sentiment: sentimentHit.data,
      events: eventHit.data,
    };
  }

  const articlesP = fetchRawArticlesForAsset(keywordQuery, feedOpts);
  const sentimentTickerP =
    ticker && ticker !== 'GENERAL'
      ? settleWithin(fetchSentimentTicker(ticker), 2_500, {}).catch(() => ({}))
      : Promise.resolve({});
  const calP = settleWithin(
    fetchCoinMarketCalEventsFiltered(keywordQuery).catch(() => []),
    COINMARKETCAL_TIMEOUT_MS,
    [],
  );

  const [rawArticles, sentimentRaw, calFiltered] = await Promise.all([
    articlesP,
    sentimentTickerP,
    calP,
  ]);

  const newsRows = dedupeNewsArticles(
    rawArticles
      .slice()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, NEWS_LIST_ITEMS)
      .map(toCryptonewsShape),
  );
  const news = newsRows.slice(0, newsLimit);
  if (newsRows.length > 0) {
    newsCache.set(newsKey, { data: newsRows, expires: Date.now() + CACHE_TTL_MS });
  }

  let sentiment = Object.keys(sentimentRaw || {}).map((date) => ({
    date,
    ticker: sentimentRaw[date],
  }));
  if (!hasSentimentData(sentiment)) {
    sentiment = deriveSentimentRowsFromArticles(rawArticles);
  }
  if (sentiment.length > 0) {
    sentimentCache.set(newsKey, { data: sentiment, expires: Date.now() + CACHE_TTL_MS });
  }

  let events = eventsFromArticles(selectEventArticles(rawArticles));
  if (Array.isArray(calFiltered) && calFiltered.length > 0) {
    events = [...events, ...calFiltered];
  }
  events = filterEventRowsByAsset(events, keywordQuery);
  if (events.length > 0) {
    eventCache.set(newsKey, { data: events, expires: Date.now() + CACHE_TTL_MS });
  }

  return { news, sentiment, events };
}

/** Swap-side tokens that rarely need dedicated headline slots (stable / base). */
const SWAP_LOW_PRIORITY_SYMBOLS = new Set([
  'USDC',
  'USDT',
  'USDS',
  'USD1',
  'DAI',
  'BUSD',
  'FRAX',
  'PYUSD',
  'USDD',
  'EURC',
  'SOL',
  'WSOL',
]);

/**
 * @param {import('./newsSources/rssParser.js').RawArticle[]} articles
 */
function dedupeRawArticles(articles) {
  const seen = new Set();
  /** @type {import('./newsSources/rssParser.js').RawArticle[]} */
  const out = [];
  for (const a of articles) {
    const key = `${a.title}|${a.url || ''}`.toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(a);
  }
  return out;
}

/**
 * @param {Array<{ symbol?: string; name?: string; mint?: string }>} assets
 */
function dedupeSwapAssets(assets) {
  const seen = new Set();
  /** @type {Array<{ symbol?: string; name?: string; mint?: string }>} */
  const out = [];
  for (const a of assets) {
    const symbol = String(a.symbol || '').trim().toUpperCase();
    const mint = String(a.mint || '').trim().toLowerCase();
    const key = mint || symbol || String(a.name || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      symbol: symbol || undefined,
      name: String(a.name || '').trim() || undefined,
      mint: mint || undefined,
    });
  }
  return out;
}

/**
 * @param {number} assetCount
 * @param {number} total
 * @param {boolean[]} lowPriority
 */
function allocateBalancedSlots(assetCount, total, lowPriority) {
  if (assetCount <= 0) return [];
  const slots = new Array(assetCount).fill(0);
  const highIdx = lowPriority
    .map((low, i) => (low ? -1 : i))
    .filter((i) => i >= 0);
  const lowIdx = lowPriority.map((low, i) => (low ? i : -1)).filter((i) => i >= 0);

  if (highIdx.length === 0) {
    const each = Math.max(1, Math.floor(total / assetCount));
    return slots.map(() => each);
  }

  if (lowIdx.length === 0 || highIdx.length === assetCount) {
    const base = Math.floor(total / assetCount);
    const rem = total % assetCount;
    return slots.map((_, i) => base + (i < rem ? 1 : 0));
  }

  const lowSlots = Math.min(lowIdx.length, Math.max(1, Math.floor(total * 0.2)));
  const highSlots = total - lowSlots * lowIdx.length;
  const perHigh = Math.max(1, Math.ceil(highSlots / highIdx.length));
  for (const i of highIdx) slots[i] = perHigh;
  for (const i of lowIdx) slots[i] = lowSlots;
  return slots;
}

/**
 * Round-robin pick from per-asset buckets up to per-bucket limits.
 * @template T
 * @param {T[][]} buckets
 * @param {number[]} limits
 * @param {(item: T) => string} keyFn
 * @param {number} totalCap
 */
function selectBalancedFromBuckets(buckets, limits, keyFn, totalCap) {
  const seen = new Set();
  /** @type {unknown[]} */
  const out = [];
  const pointers = buckets.map(() => 0);
  const counts = limits.map(() => 0);

  while (out.length < totalCap) {
    let added = false;
    for (let i = 0; i < buckets.length; i += 1) {
      if (counts[i] >= limits[i]) continue;
      while (pointers[i] < buckets[i].length && counts[i] < limits[i]) {
        const item = buckets[i][pointers[i]];
        pointers[i] += 1;
        const key = keyFn(item);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(item);
        counts[i] += 1;
        added = true;
        break;
      }
      if (out.length >= totalCap) break;
    }
    if (!added) break;
  }
  return out;
}

/**
 * Swap panel feed — parallel per-token Google News + shared RSS, balanced news/events.
 * @param {Array<{ symbol?: string; name?: string; mint?: string }>} assets
 * @param {{ newsLimit?: number; eventsLimit?: number; cryptoBias?: boolean }} [opts]
 */
export async function buildSwapPairFeedBundle(assets, opts = {}) {
  const newsLimit = opts.newsLimit ?? 6;
  const eventsLimit = opts.eventsLimit ?? 8;
  const feedOpts = { cryptoBias: Boolean(opts.cryptoBias ?? true) };

  const normalized = dedupeSwapAssets(assets);
  if (normalized.length === 0) return { news: [], events: [] };

  const assetQueries = normalized.map((asset) => {
    const ticker = (asset.symbol || asset.name || 'TOKEN').toUpperCase();
    return {
      asset,
      ticker,
      keywords: keywordsForAsset({ ticker, name: asset.name }),
    };
  });

  const [indexArticles, ...googleBatches] = await Promise.all([
    fetchAllRawArticlesWithin(INDEX_BUDGET_MS),
    ...assetQueries.map((aq) =>
      fetchGoogleNewsWithFallbacks(aq.keywords, GOOGLE_NEWS_TIMEOUT_MS, feedOpts),
    ),
  ]);

  const allArticles = dedupeRawArticles([...indexArticles, ...googleBatches.flat()]);
  const mergedKeywords = mergeKeywordQueries(...assetQueries.map((aq) => aq.keywords));

  const calFiltered = await settleWithin(
    fetchCoinMarketCalEventsFiltered(mergedKeywords).catch(() => []),
    COINMARKETCAL_TIMEOUT_MS,
    [],
  );

  const lowPriority = assetQueries.map((aq) =>
    SWAP_LOW_PRIORITY_SYMBOLS.has(String(aq.asset.symbol || '').toUpperCase()),
  );
  const newsSlots = allocateBalancedSlots(normalized.length, newsLimit, lowPriority);
  const eventSlots = allocateBalancedSlots(normalized.length, eventsLimit, lowPriority);

  const newsBuckets = assetQueries.map((aq) =>
    filterArticlesByAssetKeywords(allArticles, aq.keywords)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .map((a) => ({
        ...toCryptonewsShape(a),
        related_symbol: String(aq.asset.symbol || aq.ticker).toUpperCase(),
      })),
  );

  const news = selectBalancedFromBuckets(
    newsBuckets,
    newsSlots,
    (row) => String(row.news_url || row.title || '').toLowerCase(),
    newsLimit,
  );

  const eventBuckets = assetQueries.map((aq) => {
    const matched = filterArticlesByAssetKeywords(allArticles, aq.keywords);
    let rows = eventsFromArticles(selectEventArticles(matched));
    rows = filterEventRowsByAsset(rows, aq.keywords);
    /** @type {Array<Record<string, unknown>>} */
    const flat = [];
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const r = /** @type {Record<string, unknown>} */ (row);
      const date = String(r.date ?? '');
      const bucket = r.ticker;
      if (!Array.isArray(bucket)) continue;
      for (const ev of bucket) {
        if (!ev || typeof ev !== 'object') continue;
        flat.push({
          .../** @type {Record<string, unknown>} */ (ev),
          date,
          related_symbol: String(aq.asset.symbol || aq.ticker).toUpperCase(),
        });
      }
    }
    return flat;
  });

  let events = selectBalancedFromBuckets(
    eventBuckets,
    eventSlots,
    (ev) => `${ev.event_name}|${ev.date}`,
    eventsLimit,
  );

  if (Array.isArray(calFiltered) && calFiltered.length > 0) {
    /** @type {Array<Record<string, unknown>>} */
    const calFlat = [];
    for (const row of calFiltered) {
      if (!row || typeof row !== 'object') continue;
      const r = /** @type {Record<string, unknown>} */ (row);
      const date = String(r.date ?? '');
      const bucket = r.ticker;
      if (!Array.isArray(bucket)) continue;
      for (const ev of bucket) {
        if (!ev || typeof ev !== 'object') continue;
        calFlat.push({ .../** @type {Record<string, unknown>} */ (ev), date });
      }
    }
    const seen = new Set(events.map((e) => `${e.event_name}|${e.date}`));
    for (const ev of calFlat) {
      const key = `${ev.event_name}|${ev.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      events.push(ev);
      if (events.length >= eventsLimit) break;
    }
    events = events
      .sort((a, b) => String(b.date ?? '').localeCompare(String(a.date ?? '')))
      .slice(0, eventsLimit);
  }

  return { news, events };
}
