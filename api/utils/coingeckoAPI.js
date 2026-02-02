/**
 * CoinGecko API utilities.
 * Fetches and caches the coin list from https://api.coingecko.com/api/v3/coins/list
 * for use by tools that need ticker or token name resolution (e.g. news, sentiment, price).
 */

const COINGECKO_LIST_URL = 'https://api.coingecko.com/api/v3/coins/list';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** @type {{ list: Array<{ id: string; symbol: string; name: string }>; fetchedAt: number } | null } */
let cache = null;

/**
 * Fetch the full coin list from CoinGecko. Uses in-memory cache with TTL.
 * @returns {Promise<Array<{ id: string; symbol: string; name: string }>>}
 */
export async function getCoinList() {
  const now = Date.now();
  if (cache && cache.list && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.list;
  }
  try {
    const res = await fetch(COINGECKO_LIST_URL);
    if (!res.ok) {
      throw new Error(`CoinGecko list failed: ${res.status}`);
    }
    const list = await res.json();
    if (!Array.isArray(list)) {
      throw new Error('CoinGecko list response is not an array');
    }
    const normalized = list
      .filter((c) => c && typeof c.id === 'string' && typeof c.symbol === 'string' && typeof c.name === 'string')
      .map((c) => ({ id: c.id, symbol: (c.symbol || '').toLowerCase(), name: c.name || '' }));
    cache = { list: normalized, fetchedAt: now };
    return cache.list;
  } catch (err) {
    if (cache && cache.list) {
      return cache.list;
    }
    throw err;
  }
}

/**
 * Get a coin by CoinGecko id.
 * @param {string} id - CoinGecko id (e.g. 'bitcoin', 'ethereum')
 * @returns {Promise<{ id: string; symbol: string; name: string } | null>}
 */
export async function getCoinById(id) {
  if (!id || typeof id !== 'string') return null;
  const list = await getCoinList();
  const lower = id.toLowerCase().trim();
  return list.find((c) => c.id === lower) || null;
}

/**
 * Get coin(s) by symbol. CoinGecko has multiple coins per symbol; returns first match
 * or the one with the most common id (e.g. 'bitcoin' for 'btc').
 * @param {string} symbol - Ticker symbol (e.g. 'BTC', 'ETH', 'SOL')
 * @returns {Promise<{ id: string; symbol: string; name: string } | null>}
 */
export async function getCoinBySymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return null;
  const list = await getCoinList();
  const lower = symbol.toLowerCase().trim();
  const matches = list.filter((c) => c.symbol === lower);
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0];
  // Prefer well-known ids: bitcoin, ethereum, solana, etc.
  const preferred = ['bitcoin', 'ethereum', 'solana', 'tether', 'binancecoin', 'ripple', 'cardano', 'dogecoin', 'avalanche-2', 'polkadot', 'chainlink', 'polygon'];
  const byPreferred = matches.find((c) => preferred.includes(c.id));
  return byPreferred || matches[0];
}

/**
 * Search coins by query (matches id, symbol, or name).
 * @param {string} query - Search string
 * @param {number} [limit=20] - Max results
 * @returns {Promise<Array<{ id: string; symbol: string; name: string }>>}
 */
export async function searchCoins(query, limit = 20) {
  if (!query || typeof query !== 'string' || !query.trim()) return [];
  const list = await getCoinList();
  const q = query.toLowerCase().trim();
  const results = list.filter(
    (c) => c.id.includes(q) || c.symbol.includes(q) || (c.name && c.name.toLowerCase().includes(q))
  );
  return results.slice(0, Math.min(limit, 50));
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
  const byId = await getCoinById(input);
  if (byId) return byId;
  const bySymbol = await getCoinBySymbol(input);
  if (bySymbol) return bySymbol;
  const search = await searchCoins(input, 1);
  return search.length > 0 ? search[0] : null;
}
