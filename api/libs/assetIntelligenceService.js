/**
 * Aggregates Syra intelligence (news, sentiment, events, signal) for asset detail pages.
 */
import { runTokensAgentTool } from './tokensAgentService.js';
import { resolveAssetIntelligenceKeys } from './assetIntelligenceResolver.js';
import { buildAssetFeedBundle, resolveNewsTicker } from './assetNewsFeed.js';
import { loadSignal } from '../routes/signal.js';

const NEWS_LIMIT = 8;
const EVENTS_LIMIT = 8;
const SIGNAL_TIMEOUT_MS = 8_000;
const RESOLVE_TIMEOUT_MS = 5_000;
const INTELLIGENCE_CACHE_TTL_MS = 90_000;

/** @type {Map<string, { expires: number; data: object }>} */
const intelligenceCache = new Map();

function trim(v) {
  return v != null ? String(v).trim() : '';
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} label
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Prefer CoinGecko OHLC for dashboard intelligence (more reliable than CEX geo blocks).
 * @param {string} signalToken
 */
async function loadSignalWithTimeout(signalToken) {
  return withTimeout(
    loadSignal({ token: signalToken, source: 'coingecko' }),
    SIGNAL_TIMEOUT_MS,
    'Signal request',
  );
}

/**
 * @param {{ ref?: string; mint?: string; assetId?: string; symbol?: string; name?: string }} input
 */
function intelligenceCacheKey(input) {
  return [
    trim(input.assetId).toLowerCase(),
    trim(input.mint),
    trim(input.ref).toLowerCase(),
  ].join('|');
}

/**
 * @param {unknown[]} rows
 */
function buildSentimentPayload(rows) {
  /** @type {Record<string, object>} */
  const data = {};
  let totalPos = 0;
  let totalNeg = 0;
  let totalNeutral = 0;
  /** @type {number[]} */
  const scores = [];

  for (const item of rows) {
    if (!item || typeof item !== 'object') continue;
    const row = /** @type {Record<string, unknown>} */ (item);
    const raw = row.ticker ?? row.general ?? row.allTicker ?? row;
    if (!raw || typeof raw !== 'object') continue;
    const day = /** @type {Record<string, unknown>} */ (raw);
    const date = String(row.date ?? '');
    if (date) {
      data[date] = {
        ...day,
        sentiment_score: day.sentiment_score ?? day.Sentiment_Score,
      };
    }
    if (typeof day.Positive === 'number') totalPos += day.Positive;
    if (typeof day.Negative === 'number') totalNeg += day.Negative;
    if (typeof day.Neutral === 'number') totalNeutral += day.Neutral;
    const s = day.sentiment_score ?? day.Sentiment_Score;
    if (typeof s === 'number' && Number.isFinite(s)) scores.push(s);
  }

  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

  return {
    data,
    total: {
      'Total Positive': totalPos,
      'Total Negative': totalNeg,
      'Total Neutral': totalNeutral,
      'Sentiment Score': avgScore,
    },
  };
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
      if (out.length >= limit) return out;
    }
  }
  return out;
}

/**
 * @param {unknown} signalPayload
 */
function normalizeSignal(signalPayload) {
  const root = signalPayload && typeof signalPayload === 'object' ? signalPayload : {};
  const signal =
    /** @type {Record<string, unknown>} */ (root).signal &&
    typeof /** @type {Record<string, unknown>} */ (root).signal === 'object'
      ? /** @type {Record<string, unknown>} */ (/** @type {Record<string, unknown>} */ (root).signal)
      : /** @type {Record<string, unknown>} */ (root);
  const metadata =
    signal.metadata && typeof signal.metadata === 'object'
      ? /** @type {Record<string, unknown>} */ (signal.metadata)
      : {};
  const tradingSignal = String(metadata.TRADING_SIGNAL ?? signal.TRADING_SIGNAL ?? '').trim() || null;
  const strength = String(metadata.SIGNAL_STRENGTH ?? signal.SIGNAL_STRENGTH ?? '').trim() || null;
  const source = String(signal.source ?? metadata.source ?? '').trim() || null;
  return { tradingSignal, strength, source };
}

/**
 * @param {{ ref?: string; mint?: string; assetId?: string; symbol?: string; name?: string; category?: string }} input
 */
export async function buildAssetIntelligence(input) {
  const ref = trim(input.ref);
  const mint = trim(input.mint);
  const assetIdParam = trim(input.assetId);

  if (!ref && !mint && !assetIdParam) {
    return { ok: false, error: 'Provide ref, mint, or assetId', status: 400 };
  }

  const cacheKey = intelligenceCacheKey(input);
  const cached = intelligenceCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return { ok: true, data: cached.data };
  }

  let assetId = assetIdParam;
  let symbol = trim(input.symbol);
  let name = trim(input.name);

  if (!assetId) {
    const resolveParams = mint ? { mint } : { ref };
    let resolved;
    try {
      resolved = await withTimeout(
        runTokensAgentTool('tokens-assets-resolve', resolveParams),
        RESOLVE_TIMEOUT_MS,
        'Asset resolve',
      );
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Could not resolve asset',
        status: 504,
      };
    }
    if (!resolved.ok) {
      return {
        ok: false,
        error: resolved.error || 'Could not resolve asset',
        status: resolved.status ?? 502,
        requestId: resolved.requestId,
      };
    }
    assetId = trim(resolved.data?.assetId);
    if (!assetId) {
      return { ok: false, error: 'Resolve returned no assetId', status: 502 };
    }
    if (!symbol && resolved.data?.variant?.symbol) {
      symbol = trim(resolved.data.variant.symbol);
    }
    if (!name && resolved.data?.asset?.name) {
      name = trim(resolved.data.asset.name);
    }
  }

  // Prefer symbol/name from the request or resolve — skip slow profile fetch when possible.
  if ((!symbol || !name) && assetId) {
    try {
      const detail = await withTimeout(
        runTokensAgentTool('tokens-asset-detail', {
          assetId,
          include: 'profile',
        }),
        RESOLVE_TIMEOUT_MS,
        'Asset profile',
      );
      if (detail.ok && detail.data?.asset) {
        if (!symbol) symbol = trim(detail.data.asset.symbol);
        if (!name) name = trim(detail.data.asset.name);
      }
    } catch {
      /* continue with whatever identifiers we have */
    }
  }

  const keys = await resolveAssetIntelligenceKeys({ assetId, symbol, ref, name });
  let ticker = keys.ticker;
  try {
    ticker = await withTimeout(resolveNewsTicker(keys.ticker), 3_000, 'Ticker resolve');
  } catch {
    ticker = keys.ticker;
  }
  const keywordQuery = keys.keywordQuery;
  const assetLabel = name || symbol || ticker || assetId;

  // One shared feed burst (Google News + warm index) — no outer 6s race that labeled
  // successful-but-slow work as "News timed out" / "Events timed out".
  const [feedSettled, signalSettled] = await Promise.allSettled([
    buildAssetFeedBundle(ticker, keywordQuery, { newsLimit: NEWS_LIMIT }),
    keys.signalToken
      ? loadSignalWithTimeout(keys.signalToken)
      : Promise.reject(new Error('No signal token for this asset')),
  ]);

  /** @type {{ ok: boolean; items: unknown[]; error?: string }} */
  const newsBlock = { ok: false, items: [] };
  /** @type {{ ok: boolean; data: Record<string, object>; total: object; error?: string }} */
  const sentimentBlock = {
    ok: false,
    data: {},
    total: {
      'Total Positive': 0,
      'Total Negative': 0,
      'Total Neutral': 0,
      'Sentiment Score': 0,
    },
  };
  /** @type {{ ok: boolean; items: unknown[]; error?: string }} */
  const eventsBlock = { ok: false, items: [] };

  if (feedSettled.status === 'fulfilled') {
    const feed = feedSettled.value;

    newsBlock.items = Array.isArray(feed.news) ? feed.news : [];
    newsBlock.ok = newsBlock.items.length > 0;
    if (!newsBlock.ok) newsBlock.error = `No headlines found related to ${assetLabel}`;

    const built = buildSentimentPayload(feed.sentiment);
    sentimentBlock.data = built.data;
    sentimentBlock.total = built.total;
    sentimentBlock.ok =
      Object.keys(built.data).length > 0 ||
      built.total['Total Positive'] + built.total['Total Negative'] + built.total['Total Neutral'] > 0;
    if (!sentimentBlock.ok) sentimentBlock.error = `No sentiment data related to ${assetLabel}`;

    eventsBlock.items = flattenEvents(feed.events, EVENTS_LIMIT);
    eventsBlock.ok = eventsBlock.items.length > 0;
    if (!eventsBlock.ok) eventsBlock.error = `No events found related to ${assetLabel}`;
  } else {
    const feedError =
      feedSettled.reason instanceof Error ? feedSettled.reason.message : 'Feed unavailable';
    newsBlock.error = feedError;
    sentimentBlock.error = feedError;
    eventsBlock.error = feedError;
  }

  /** @type {{ ok: boolean; tradingSignal: string | null; strength: string | null; source: string | null; error?: string }} */
  const signalBlock = {
    ok: false,
    tradingSignal: null,
    strength: null,
    source: null,
  };
  if (signalSettled.status === 'fulfilled') {
    const norm = normalizeSignal(signalSettled.value);
    signalBlock.tradingSignal = norm.tradingSignal;
    signalBlock.strength = norm.strength;
    signalBlock.source = norm.source;
    signalBlock.ok = Boolean(norm.tradingSignal);
    if (!signalBlock.ok) signalBlock.error = 'No trading signal';
  } else {
    signalBlock.error =
      signalSettled.reason instanceof Error ? signalSettled.reason.message : 'Signal unavailable';
  }

  const data = {
    query: {
      assetId,
      ticker,
      signalToken: keys.signalToken,
      searchKeywords: keywordQuery.all,
      primaryKeywords: keywordQuery.primary,
      symbol: symbol || undefined,
      name: name || undefined,
      ref: ref || undefined,
      mint: mint || undefined,
    },
    news: newsBlock,
    sentiment: sentimentBlock,
    events: eventsBlock,
    signal: signalBlock,
    fetchedAt: new Date().toISOString(),
  };

  intelligenceCache.set(cacheKey, {
    data,
    expires: Date.now() + INTELLIGENCE_CACHE_TTL_MS,
  });

  return { ok: true, data };
}
