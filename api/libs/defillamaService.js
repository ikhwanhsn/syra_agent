/**
 * DefiLlama public API — protocol or chain TVL.
 * Free upstream; no API key required.
 */
import { createBoundedTtlCache } from '../utils/boundedTtlCache.js';

const BASE_URL = 'https://api.llama.fi';
const FETCH_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 300_000;

const cache = createBoundedTtlCache({
  name: 'defillama-tvl',
  maxEntries: 300,
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
 * @param {Array<{ date: number; totalLiquidityUSD?: number }>} series
 */
function summarizeTvlHistory(series) {
  if (!Array.isArray(series) || series.length === 0) {
    return { points: 0, oldestTvlUsd: null, newestTvlUsd: null, changePct: null };
  }
  const sorted = [...series].sort((a, b) => a.date - b.date);
  const oldest = toNum(sorted[0]?.totalLiquidityUSD);
  const newest = toNum(sorted[sorted.length - 1]?.totalLiquidityUSD);
  const changePct =
    oldest != null && newest != null && oldest > 0 ? ((newest / oldest - 1) * 100) : null;
  return {
    points: sorted.length,
    oldestTvlUsd: oldest,
    newestTvlUsd: newest,
    changePct,
  };
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} req
 */
export function parseDefillamaTvlRequest(req) {
  const source = req.method === 'POST' ? req.body ?? {} : req.query ?? {};
  const protocol =
    typeof source.protocol === 'string' ? source.protocol.trim().toLowerCase() : '';
  const chain = typeof source.chain === 'string' ? source.chain.trim() : '';

  if (protocol) return { mode: 'protocol', protocol };
  if (chain) return { mode: 'chain', chain };
  throw new Error('Provide protocol (slug e.g. aave) OR chain (e.g. Solana, Ethereum)');
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
    throw new Error(`DefiLlama upstream ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * @param {{ mode: string; protocol?: string; chain?: string }} params
 */
export async function fetchDefillamaTvl(params) {
  const cacheKey = params.mode === 'protocol' ? `protocol:${params.protocol}` : `chain:${params.chain}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  if (params.mode === 'protocol') {
    const json = await fetchJson(`${BASE_URL}/protocol/${encodeURIComponent(params.protocol ?? '')}`);
    const tvlSeries = Array.isArray(json.tvl) ? json.tvl : [];
    const currentTvlUsd = toNum(json.tvl?.at?.(-1)?.totalLiquidityUSD) ?? toNum(json.currentChainTvls
      ? Object.values(json.currentChainTvls).reduce((a, b) => a + (Number(b) || 0), 0)
      : null);

    const data = {
      mode: 'protocol',
      protocol: params.protocol,
      name: typeof json.name === 'string' ? json.name : params.protocol,
      category: typeof json.category === 'string' ? json.category : null,
      chains: Array.isArray(json.chains) ? json.chains : [],
      currentTvlUsd,
      tvlHistory: summarizeTvlHistory(tvlSeries),
      source: 'defillama',
      computedAt: new Date().toISOString(),
    };
    cache.set(cacheKey, data);
    return data;
  }

  const chains = await fetchJson(`${BASE_URL}/v2/chains`);
  const match = Array.isArray(chains)
    ? chains.find(
        (c) =>
          typeof c.name === 'string' &&
          c.name.toLowerCase() === String(params.chain).toLowerCase(),
      )
    : null;

  if (!match) {
    throw new Error(`Chain not found on DefiLlama: ${params.chain}`);
  }

  const data = {
    mode: 'chain',
    chain: match.name,
    chainId: typeof match.gecko_id === 'string' ? match.gecko_id : null,
    currentTvlUsd: toNum(match.tvl),
    tokenSymbol: typeof match.tokenSymbol === 'string' ? match.tokenSymbol : null,
    source: 'defillama',
    computedAt: new Date().toISOString(),
  };

  cache.set(cacheKey, data);
  return data;
}
