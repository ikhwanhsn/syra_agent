/**
 * Pyth Hermes public API — latest oracle prices for major feeds.
 * Free upstream; no API key required.
 */
import { createBoundedTtlCache } from '../utils/boundedTtlCache.js';
import { PYTH_BTC_USD_FEED_ID } from '../config/scalperConfig.js';

const HERMES_BASE = process.env.PYTH_HERMES_URL || 'https://hermes.pyth.network';
const FETCH_TIMEOUT_MS = 10_000;
const CACHE_TTL_MS = 5_000;

const cache = createBoundedTtlCache({
  name: 'pyth-hermes-price',
  maxEntries: 100,
  defaultTtlMs: CACHE_TTL_MS,
});

/** Common Pyth price feed IDs (hex without 0x prefix). */
const SYMBOL_FEED_MAP = {
  'BTC/USD': PYTH_BTC_USD_FEED_ID,
  'ETH/USD':
    process.env.PYTH_ETH_USD_FEED_ID ||
    '0xff61491a931112df1cfa4d0423bf0dfed99b88f620e794fa17fcc9dcc1f5a665',
  'SOL/USD':
    process.env.PYTH_SOL_USD_FEED_ID ||
    '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'USDC/USD':
    process.env.PYTH_USDC_USD_FEED_ID ||
    '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT/USD':
    process.env.PYTH_USDT_USD_FEED_ID ||
    '0x2b89b9dc8fdf9f34709a3b106b4c869ebf694e862d8cfb3d09d7c03bc5f7eb13',
};

/**
 * @param {{ price: string; expo: number; conf?: string }} parsed
 */
function pythPriceToUsd(parsed) {
  if (!parsed || parsed.price == null || parsed.expo == null) return null;
  const px = Number(parsed.price) * 10 ** Number(parsed.expo);
  return Number.isFinite(px) && px > 0 ? px : null;
}

/**
 * @param {{ price: string; expo: number; conf?: string }} parsed
 */
function pythConfToUsd(parsed) {
  if (!parsed || parsed.conf == null || parsed.expo == null) return null;
  const c = Number(parsed.conf) * 10 ** Number(parsed.expo);
  return Number.isFinite(c) && c >= 0 ? c : null;
}

/**
 * @param {string} symbol
 * @returns {string | null}
 */
function resolveFeedId(symbol) {
  const normalized = symbol.trim().toUpperCase();
  if (SYMBOL_FEED_MAP[normalized]) return SYMBOL_FEED_MAP[normalized];
  if (/^0x[0-9a-f]{64}$/i.test(symbol.trim())) return symbol.trim();
  return null;
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parsePythPriceRequest(req) {
  const source = req.method === 'POST' ? req.body ?? {} : req.query ?? {};
  const raw =
    typeof source.symbols === 'string'
      ? source.symbols
      : Array.isArray(source.symbols)
        ? source.symbols.join(',')
        : '';
  const symbols = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length === 0) {
    throw new Error('symbols is required (comma-separated, e.g. BTC/USD,SOL/USD)');
  }
  if (symbols.length > 10) {
    throw new Error('symbols max 10 per request');
  }

  const resolved = [];
  for (const sym of symbols) {
    const feedId = resolveFeedId(sym);
    if (!feedId) throw new Error(`Unknown Pyth symbol or feed id: ${sym}`);
    resolved.push({ symbol: sym.includes('/') ? sym.toUpperCase() : sym, feedId });
  }

  return { feeds: resolved };
}

/**
 * @param {string} id
 */
function normalizeFeedId(id) {
  return String(id || '').trim().toLowerCase().replace(/^0x/, '');
}

/**
 * @param {{ feeds: Array<{ symbol: string; feedId: string }> }} params
 */
export async function fetchPythPrices(params) {
  const cacheKey = params.feeds.map((f) => normalizeFeedId(f.feedId)).sort().join('|');
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const url = new URL(`${HERMES_BASE}/v2/updates/price/latest`);
  for (const feed of params.feeds) {
    url.searchParams.append('ids[]', feed.feedId);
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Pyth Hermes upstream ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const parsedList = Array.isArray(json?.parsed) ? json.parsed : [];

  /** @type {Record<string, { id?: string; price?: { price: string; expo: number; conf?: string; publish_time?: number } }>} */
  const byFeedId = {};
  for (const row of parsedList) {
    const id = typeof row.id === 'string' ? normalizeFeedId(row.id) : null;
    if (id) byFeedId[id] = row;
  }

  const prices = params.feeds.map((feed) => {
    const row = byFeedId[normalizeFeedId(feed.feedId)];
    const parsed = row?.price;
    const priceUsd = pythPriceToUsd(parsed);
    const confidenceUsd = pythConfToUsd(parsed);
    const publishTime =
      typeof parsed?.publish_time === 'number'
        ? parsed.publish_time
        : typeof parsed?.publishTime === 'number'
          ? parsed.publishTime
          : null;

    return {
      symbol: feed.symbol,
      feedId: feed.feedId,
      priceUsd,
      confidenceUsd,
      publishTime,
    };
  });

  const data = {
    prices,
    count: prices.length,
    source: 'pyth_hermes',
    computedAt: new Date().toISOString(),
  };

  cache.set(cacheKey, data);
  return data;
}
