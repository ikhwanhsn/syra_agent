/**
 * CoinGecko API utilities.
 * Fetches and caches the coin list for ticker/token name resolution (e.g. news, sentiment, price).
 */

import { btcRateLimitedFetch } from '../libs/btcProviderRateLimiter.js';

const DEFAULT_COINGECKO_DATA_API = 'https://api.coingecko.com/api/v3';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const LIST_FETCH_MAX_ATTEMPTS = 3;
const LIST_FETCH_BASE_DELAY_MS = 800;

/** Static fallback for top tickers when CoinGecko list is unavailable. */
const COMMON_TICKER_MAP = Object.freeze({
  bitcoin: { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
  btc: { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
  ethereum: { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
  eth: { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
  solana: { id: 'solana', symbol: 'sol', name: 'Solana' },
  sol: { id: 'solana', symbol: 'sol', name: 'Solana' },
  ripple: { id: 'ripple', symbol: 'xrp', name: 'XRP' },
  xrp: { id: 'ripple', symbol: 'xrp', name: 'XRP' },
  dogecoin: { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin' },
  doge: { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin' },
  cardano: { id: 'cardano', symbol: 'ada', name: 'Cardano' },
  ada: { id: 'cardano', symbol: 'ada', name: 'Cardano' },
  binancecoin: { id: 'binancecoin', symbol: 'bnb', name: 'BNB' },
  bnb: { id: 'binancecoin', symbol: 'bnb', name: 'BNB' },
  avalanche: { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche' },
  avax: { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche' },
  chainlink: { id: 'chainlink', symbol: 'link', name: 'Chainlink' },
  link: { id: 'chainlink', symbol: 'link', name: 'Chainlink' },
  polkadot: { id: 'polkadot', symbol: 'dot', name: 'Polkadot' },
  dot: { id: 'polkadot', symbol: 'dot', name: 'Polkadot' },
  polygon: { id: 'matic-network', symbol: 'matic', name: 'Polygon' },
  matic: { id: 'matic-network', symbol: 'matic', name: 'Polygon' },
  litecoin: { id: 'litecoin', symbol: 'ltc', name: 'Litecoin' },
  ltc: { id: 'litecoin', symbol: 'ltc', name: 'Litecoin' },
  tron: { id: 'tron', symbol: 'trx', name: 'TRON' },
  trx: { id: 'tron', symbol: 'trx', name: 'TRON' },
  'shiba-inu': { id: 'shiba-inu', symbol: 'shib', name: 'Shiba Inu' },
  shib: { id: 'shiba-inu', symbol: 'shib', name: 'Shiba Inu' },
  tether: { id: 'tether', symbol: 'usdt', name: 'Tether' },
  usdt: { id: 'tether', symbol: 'usdt', name: 'Tether' },
  usdc: { id: 'usd-coin', symbol: 'usdc', name: 'USD Coin' },
  general: { id: 'general', symbol: 'general', name: 'General' },
});

/**
 * Base URL for CoinGecko **data** calls (OHLC, chart, contract lookup). Pro plans use
 * `https://pro-api.coingecko.com/api/v3` with `x-cg-pro-api-key`; demo/public use
 * `https://api.coingecko.com/api/v3` with `x-cg-demo-api-key`.
 * @returns {string}
 */
export function getCoingeckoDataApiBaseUrl() {
  const raw = String(process.env.COINGECKO_API_BASE_URL || '').trim();
  if (raw) return raw.replace(/\/$/, '');
  const keyType = String(process.env.COINGECKO_API_KEY_TYPE || '').trim().toLowerCase();
  if (keyType === 'pro' || keyType === 'paid') {
    return 'https://pro-api.coingecko.com/api/v3';
  }
  return DEFAULT_COINGECKO_DATA_API;
}

/**
 * @returns {boolean}
 */
export function isCoingeckoProDataApiUrl() {
  return getCoingeckoDataApiBaseUrl().toLowerCase().includes('pro-api.coingecko.com');
}

/**
 * Headers for authenticated CoinGecko data API requests. Wrong header + host pairs return
 * invalid API key (e.g. Pro key sent as demo header on api.coingecko.com).
 * @returns {Record<string, string>}
 */
export function coingeckoDataApiHeaders() {
  const key = String(process.env.COINGECKO_API_KEY || process.env.COINGECKO_DEMO_API_KEY || '').trim();
  const h = { Accept: 'application/json' };
  if (!key) return h;
  if (isCoingeckoProDataApiUrl()) {
    h['x-cg-pro-api-key'] = key;
  } else {
    h['x-cg-demo-api-key'] = key;
  }
  return h;
}

/** @type {{ list: Array<{ id: string; symbol: string; name: string }>; fetchedAt: number } | null } */
let cache = null;

/** @type {Promise<Array<{ id: string; symbol: string; name: string }>> | null} */
let inflightList = null;

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @param {string} input
 * @returns {{ id: string; symbol: string; name: string } | null}
 */
function resolveFromStaticMap(input) {
  if (!input || typeof input !== 'string') return null;
  const key = input.trim().toLowerCase();
  return COMMON_TICKER_MAP[key] ?? null;
}

/**
 * @returns {string}
 */
function getCoinListUrl() {
  return `${getCoingeckoDataApiBaseUrl()}/coins/list`;
}

/**
 * @returns {Promise<Array<{ id: string; symbol: string; name: string }>>}
 */
async function fetchCoinListFromApi() {
  const url = getCoinListUrl();
  const headers = coingeckoDataApiHeaders();
  let lastError;

  for (let attempt = 0; attempt < LIST_FETCH_MAX_ATTEMPTS; attempt++) {
    try {
      const listSignal =
        typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
          ? AbortSignal.timeout(12_000)
          : undefined;
      const res = await btcRateLimitedFetch(url, {
        headers,
        ...(listSignal ? { signal: listSignal } : {}),
      });

      if (res.status === 429 && attempt < LIST_FETCH_MAX_ATTEMPTS - 1) {
        const retryAfter = Number.parseInt(res.headers.get('retry-after') || '', 10);
        const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : LIST_FETCH_BASE_DELAY_MS * 2 ** attempt;
        await sleepMs(waitMs);
        continue;
      }

      if (!res.ok) {
        throw new Error(`CoinGecko list failed: ${res.status}`);
      }

      const list = await res.json();
      if (!Array.isArray(list)) {
        throw new Error('CoinGecko list response is not an array');
      }

      return list
        .filter((c) => c && typeof c.id === 'string' && typeof c.symbol === 'string' && typeof c.name === 'string')
        .map((c) => ({ id: c.id, symbol: (c.symbol || '').toLowerCase(), name: c.name || '' }));
    } catch (err) {
      lastError = err;
      if (attempt < LIST_FETCH_MAX_ATTEMPTS - 1) {
        await sleepMs(LIST_FETCH_BASE_DELAY_MS * 2 ** attempt);
        continue;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError ?? 'CoinGecko list failed'));
}

/**
 * Fetch the full coin list from CoinGecko. Uses in-memory cache with TTL.
 * @returns {Promise<Array<{ id: string; symbol: string; name: string }>>}
 */
export async function getCoinList() {
  const now = Date.now();
  if (cache && cache.list && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.list;
  }

  if (inflightList) {
    return inflightList;
  }

  inflightList = (async () => {
    try {
      const normalized = await fetchCoinListFromApi();
      cache = { list: normalized, fetchedAt: Date.now() };
      return cache.list;
    } catch (err) {
      if (cache && cache.list) {
        return cache.list;
      }
      throw err;
    } finally {
      inflightList = null;
    }
  })();

  return inflightList;
}

/**
 * Get a coin by CoinGecko id.
 * @param {string} id - CoinGecko id (e.g. 'bitcoin', 'ethereum')
 * @returns {Promise<{ id: string; symbol: string; name: string } | null>}
 */
export async function getCoinById(id) {
  if (!id || typeof id !== 'string') return null;
  const staticHit = resolveFromStaticMap(id);
  if (staticHit && staticHit.id === id.toLowerCase().trim()) return staticHit;
  try {
    const list = await getCoinList();
    const lower = id.toLowerCase().trim();
    return list.find((c) => c.id === lower) || staticHit;
  } catch {
    return resolveFromStaticMap(id);
  }
}

/**
 * Get coin(s) by symbol. CoinGecko has multiple coins per symbol; returns first match
 * or the one with the most common id (e.g. 'bitcoin' for 'btc').
 * @param {string} symbol - Ticker symbol (e.g. 'BTC', 'ETH', 'SOL')
 * @returns {Promise<{ id: string; symbol: string; name: string } | null>}
 */
export async function getCoinBySymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return null;
  const staticHit = resolveFromStaticMap(symbol);
  try {
    const list = await getCoinList();
    const lower = symbol.toLowerCase().trim();
    const matches = list.filter((c) => c.symbol === lower);
    if (matches.length === 0) return staticHit;
    if (matches.length === 1) return matches[0];
    const preferred = ['bitcoin', 'ethereum', 'solana', 'tether', 'binancecoin', 'ripple', 'cardano', 'dogecoin', 'avalanche-2', 'polkadot', 'chainlink', 'polygon'];
    const byPreferred = matches.find((c) => preferred.includes(c.id));
    return byPreferred || matches[0];
  } catch {
    return staticHit;
  }
}

/**
 * Search coins by query (matches id, symbol, or name).
 * @param {string} query - Search string
 * @param {number} [limit=20] - Max results
 * @returns {Promise<Array<{ id: string; symbol: string; name: string }>>}
 */
export async function searchCoins(query, limit = 20) {
  if (!query || typeof query !== 'string' || !query.trim()) return [];
  const staticHit = resolveFromStaticMap(query);
  try {
    const list = await getCoinList();
    const q = query.toLowerCase().trim();
    const results = list.filter(
      (c) => c.id.includes(q) || c.symbol.includes(q) || (c.name && c.name.toLowerCase().includes(q))
    );
    if (results.length === 0 && staticHit) return [staticHit];
    return results.slice(0, Math.min(limit, 50));
  } catch {
    return staticHit ? [staticHit] : [];
  }
}

/**
 * Resolve a ticker or token name to a symbol using CoinGecko list.
 * Use this when calling tools that need a ticker/token name from CoinGecko (e.g. news, sentiment).
 * @param {string} tickerOrName - User input: ticker (BTC, btc) or name (Bitcoin) or CoinGecko id (bitcoin)
 * @returns {Promise<{ symbol: string; id: string; name: string } | null>} Resolved coin or null
 */
export async function resolveTickerFromCoingecko(tickerOrName) {
  if (!tickerOrName || typeof tickerOrName !== 'string' || !tickerOrName.trim()) return null;
  const input = tickerOrName.trim();
  const staticHit = resolveFromStaticMap(input);
  if (staticHit && staticHit.id !== 'general') {
    return staticHit;
  }
  try {
    const byId = await getCoinById(input);
    if (byId) return byId;
    const bySymbol = await getCoinBySymbol(input);
    if (bySymbol) return bySymbol;
    const search = await searchCoins(input, 1);
    return search.length > 0 ? search[0] : staticHit;
  } catch {
    return staticHit;
  }
}
