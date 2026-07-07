/**
 * DexScreener public API — token pairs by chain/token or search query.
 * Free upstream; no API key required.
 */
import { createBoundedTtlCache } from '../utils/boundedTtlCache.js';

const BASE_URL = 'https://api.dexscreener.com';
const FETCH_TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 60_000;

const cache = createBoundedTtlCache({
  name: 'dexscreener-pairs',
  maxEntries: 400,
  defaultTtlMs: CACHE_TTL_MS,
});

/**
 * @param {unknown} v
 * @returns {number | null}
 */
function toNum(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {Record<string, unknown>} pair
 */
function normalizePair(pair) {
  const priceUsd = toNum(pair.priceUsd);
  const liquidityUsd = toNum(pair.liquidity?.usd ?? pair.liquidityUsd);
  const volume24h = toNum(pair.volume?.h24 ?? pair.volume24h);
  const txns24h =
    toNum(pair.txns?.h24?.buys) != null && toNum(pair.txns?.h24?.sells) != null
      ? (toNum(pair.txns.h24.buys) ?? 0) + (toNum(pair.txns.h24.sells) ?? 0)
      : toNum(pair.txns24h);
  const fdv = toNum(pair.fdv);
  const marketCap = toNum(pair.marketCap);

  return {
    chainId: typeof pair.chainId === 'string' ? pair.chainId : null,
    dexId: typeof pair.dexId === 'string' ? pair.dexId : null,
    pairAddress: typeof pair.pairAddress === 'string' ? pair.pairAddress : null,
    baseToken: pair.baseToken ?? null,
    quoteToken: pair.quoteToken ?? null,
    priceUsd,
    liquidityUsd,
    volume24h,
    txns24h,
    fdv,
    marketCap,
    priceChange24h: toNum(pair.priceChange?.h24),
    url: typeof pair.url === 'string' ? pair.url : null,
  };
}

/**
 * @param {unknown} raw
 * @returns {ReturnType<typeof normalizePair>[]}
 */
function extractPairs(raw) {
  if (Array.isArray(raw)) return raw.map((p) => normalizePair(p));
  if (raw && typeof raw === 'object' && Array.isArray(raw.pairs)) {
    return raw.pairs.map((p) => normalizePair(p));
  }
  return [];
}

/**
 * @param {string} url
 */
async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DexScreener upstream ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parseDexscreenerPairsRequest(req) {
  const source = req.method === 'POST' ? req.body ?? {} : req.query ?? {};
  const chainId = typeof source.chainId === 'string' ? source.chainId.trim() : '';
  const tokenAddress =
    typeof source.tokenAddress === 'string' ? source.tokenAddress.trim() : '';
  const q = typeof source.q === 'string' ? source.q.trim() : '';

  if (q) {
    return { mode: 'search', q };
  }
  if (chainId && tokenAddress) {
    return { mode: 'token', chainId, tokenAddress };
  }
  throw new Error('Provide q (search) OR chainId + tokenAddress');
}

/**
 * @param {{ mode: string; q?: string; chainId?: string; tokenAddress?: string }} params
 */
export async function fetchDexscreenerPairs(params) {
  const cacheKey =
    params.mode === 'search'
      ? `search:${params.q}`
      : `token:${params.chainId}:${params.tokenAddress}`;

  const cached = cache.get(cacheKey);
  if (cached) return cached;

  let url;
  if (params.mode === 'search') {
    url = `${BASE_URL}/latest/dex/search?q=${encodeURIComponent(params.q ?? '')}`;
  } else {
    url = `${BASE_URL}/token-pairs/v1/${encodeURIComponent(params.chainId ?? '')}/${encodeURIComponent(params.tokenAddress ?? '')}`;
  }

  const raw = await fetchJson(url);
  const pairs = extractPairs(raw);

  const data = {
    mode: params.mode,
    query: params.mode === 'search' ? { q: params.q } : { chainId: params.chainId, tokenAddress: params.tokenAddress },
    pairs,
    count: pairs.length,
    source: 'dexscreener',
    computedAt: new Date().toISOString(),
  };

  cache.set(cacheKey, data);
  return data;
}
