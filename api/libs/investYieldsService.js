/**
 * Live APY/TVL for Invest catalog entries — DefiLlama yields + protocol TVL.
 * Validates and normalizes upstream data; never trusts raw responses blindly.
 */
import { createBoundedTtlCache } from '../utils/boundedTtlCache.js';
import { INVEST_CATALOG } from '../config/investCatalog.js';
import { fetchDefillamaTvl } from './defillamaService.js';

const YIELDS_URL = 'https://yields.llama.fi/pools';
const FETCH_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 300_000;

const cache = createBoundedTtlCache({
  name: 'invest-yields',
  maxEntries: 8,
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
 * @param {unknown} pool
 * @returns {{ project: string; chain: string; symbol: string; apy: number | null; tvlUsd: number | null } | null}
 */
function normalizePool(pool) {
  if (!pool || typeof pool !== 'object') return null;
  const p = /** @type {Record<string, unknown>} */ (pool);
  const project = typeof p.project === 'string' ? p.project.trim().toLowerCase() : '';
  const chain = typeof p.chain === 'string' ? p.chain.trim() : '';
  const symbol = typeof p.symbol === 'string' ? p.symbol.trim() : '';
  if (!project || !chain) return null;
  const apy = toNum(p.apy ?? p.apyBase);
  const tvlUsd = toNum(p.tvlUsd);
  if (apy != null && (apy < -50 || apy > 10_000)) return null;
  if (tvlUsd != null && tvlUsd < 0) return null;
  return { project, chain, symbol, apy, tvlUsd };
}

/**
 * Pick the best Solana pool for a DefiLlama project slug.
 * Prefer positive APY with meaningful TVL; fall back to highest TVL.
 * @param {Array<{ project: string; chain: string; symbol: string; apy: number | null; tvlUsd: number | null }>} pools
 * @param {string} projectSlug
 */
function pickBestPool(pools, projectSlug) {
  const slug = projectSlug.toLowerCase();
  let matches = pools.filter(
    (p) => p.chain.toLowerCase() === 'solana' && p.project === slug,
  );
  if (matches.length === 0) {
    matches = pools.filter(
      (p) =>
        p.chain.toLowerCase() === 'solana' &&
        (p.project.startsWith(slug) || slug.startsWith(p.project) || p.project.includes(slug)),
    );
  }
  if (matches.length === 0) return null;

  const meaningful = matches.filter((p) => (p.apy ?? 0) >= 1 && (p.tvlUsd ?? 0) >= 1_000_000);
  const poolSet = meaningful.length > 0 ? meaningful : matches;
  // Prefer largest TVL among meaningful-APY pools (more representative than a tiny high-APY farm)
  poolSet.sort((a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0));
  return poolSet[0];
}

async function fetchYieldPools() {
  const cached = cache.get('pools');
  if (cached) return cached;

  const res = await fetch(YIELDS_URL, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`DefiLlama yields upstream ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const raw = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];
  const pools = [];
  for (const row of raw) {
    const n = normalizePool(row);
    if (n) pools.push(n);
  }
  cache.set('pools', pools);
  return pools;
}

/**
 * @returns {Promise<Record<string, { apyPct: number | null; tvlUsd: number | null; source: string; symbol: string | null; fetchedAt: string }>>}
 */
export async function fetchInvestYieldsByAdapter() {
  const cacheKey = 'by-adapter';
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const fetchedAt = new Date().toISOString();
  /** @type {Record<string, { apyPct: number | null; tvlUsd: number | null; source: string; symbol: string | null; fetchedAt: string }>} */
  const out = {};

  let pools = [];
  try {
    pools = await fetchYieldPools();
  } catch (err) {
    console.warn('[investYields] yields fetch failed:', err?.message || err);
  }

  await Promise.all(
    INVEST_CATALOG.map(async (entry) => {
      const best = pickBestPool(pools, entry.defillamaProject);
      let apyPct = best?.apy ?? null;
      let tvlUsd = best?.tvlUsd ?? null;
      let source = best ? 'defillama-yields' : 'unavailable';
      let symbol = best?.symbol || null;

      if (tvlUsd == null || tvlUsd <= 0) {
        try {
          const tvl = await fetchDefillamaTvl({
            mode: 'protocol',
            protocol: entry.defillamaProtocol,
          });
          const protocolTvl = toNum(tvl?.currentTvlUsd);
          if (protocolTvl != null && protocolTvl > 0) {
            tvlUsd = protocolTvl;
            source = best ? 'defillama-yields+tvl' : 'defillama-tvl';
          }
        } catch (err) {
          console.warn(
            `[investYields] TVL fallback failed for ${entry.id}:`,
            err?.message || err,
          );
        }
      }

      out[entry.id] = {
        apyPct: apyPct != null ? Math.round(apyPct * 100) / 100 : null,
        tvlUsd: tvlUsd != null ? Math.round(tvlUsd) : null,
        source,
        symbol,
        fetchedAt,
      };
    }),
  );

  cache.set(cacheKey, out);
  return out;
}
