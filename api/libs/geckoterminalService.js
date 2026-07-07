/**
 * GeckoTerminal public API — trending or new DEX pools.
 * Free upstream (~30 req/min); aggressive TTL caching.
 */
import { createBoundedTtlCache } from '../utils/boundedTtlCache.js';

const BASE_URL = 'https://api.geckoterminal.com/api/v2';
const FETCH_TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 120_000;

const cache = createBoundedTtlCache({
  name: 'geckoterminal-pools',
  maxEntries: 200,
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
 * @param {Record<string, unknown>} item
 */
function normalizePool(item) {
  const attrs = item.attributes && typeof item.attributes === 'object' ? item.attributes : {};
  const rel = item.relationships && typeof item.relationships === 'object' ? item.relationships : {};
  const dexData = rel.dex?.data;
  const dexId =
    dexData && typeof dexData === 'object' && typeof dexData.id === 'string' ? dexData.id : null;

  return {
    poolAddress: typeof item.id === 'string' ? item.id : null,
    name: typeof attrs.name === 'string' ? attrs.name : null,
    address: typeof attrs.address === 'string' ? attrs.address : null,
    priceUsd: toNum(attrs.base_token_price_usd),
    priceChange24h: toNum(attrs.price_change_percentage?.h24 ?? attrs.price_change_percentage),
    volume24h: toNum(attrs.volume_usd?.h24),
    reserveUsd: toNum(attrs.reserve_in_usd),
    fdvUsd: toNum(attrs.fdv_usd),
    marketCapUsd: toNum(attrs.market_cap_usd),
    dex: dexId,
    poolCreatedAt: typeof attrs.pool_created_at === 'string' ? attrs.pool_created_at : null,
  };
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parseGeckoterminalPoolsRequest(req) {
  const source = req.method === 'POST' ? req.body ?? {} : req.query ?? {};
  const network =
    typeof source.network === 'string' && source.network.trim()
      ? source.network.trim().toLowerCase()
      : 'solana';
  const kindRaw = typeof source.kind === 'string' ? source.kind.trim().toLowerCase() : 'trending';
  const kind = kindRaw === 'new' ? 'new' : 'trending';
  const limitRaw = Number(source.limit ?? 20);
  const limit = Number.isFinite(limitRaw) ? Math.min(50, Math.max(1, Math.floor(limitRaw))) : 20;

  return { network, kind, limit };
}

/**
 * @param {{ network: string; kind: string; limit: number }} params
 */
export async function fetchGeckoterminalPools(params) {
  const cacheKey = `${params.network}:${params.kind}:${params.limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const endpoint = params.kind === 'new' ? 'new_pools' : 'trending_pools';
  const url = `${BASE_URL}/networks/${encodeURIComponent(params.network)}/${endpoint}?page=1`;

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GeckoTerminal upstream ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = await res.json();
  const rawPools = Array.isArray(json?.data) ? json.data : [];
  const pools = rawPools.slice(0, params.limit).map((p) => normalizePool(p));

  const data = {
    network: params.network,
    kind: params.kind,
    pools,
    count: pools.length,
    source: 'geckoterminal',
    computedAt: new Date().toISOString(),
  };

  cache.set(cacheKey, data);
  return data;
}
