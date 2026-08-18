/**
 * agenteconomy.to open feeds — on-chain measured + off-chain sourced.
 * Free upstream; no API key. Attribution required on every response.
 */
import { createBoundedTtlCache } from '../utils/boundedTtlCache.js';

export const AGENT_ECONOMY_SOURCE = 'agenteconomy.to';
export const AGENT_ECONOMY_BASE_URL = 'https://agenteconomy.to';
export const AGENT_ECONOMY_ON_CHAIN_URL = `${AGENT_ECONOMY_BASE_URL}/data.json`;
export const AGENT_ECONOMY_OFF_CHAIN_URL = `${AGENT_ECONOMY_BASE_URL}/web-sources.json`;
export const AGENT_ECONOMY_LICENSE =
  'Open data: free to use and cite (https://agenteconomy.to/about)';

const FETCH_TIMEOUT_MS = 15_000;
const CACHE_TTL_MS = 300_000;

const cache = createBoundedTtlCache({
  name: 'agent-economy',
  maxEntries: 16,
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
 * @param {string} url
 */
async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`agenteconomy upstream ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * @param {string} cacheKey
 * @param {string} url
 */
async function fetchCachedFeed(cacheKey, url) {
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const raw = await fetchJson(url);
  const wrapped = {
    source: AGENT_ECONOMY_SOURCE,
    upstreamUrl: url,
    license: AGENT_ECONOMY_LICENSE,
    fetchedAt: new Date().toISOString(),
    feed: raw,
  };
  cache.set(cacheKey, wrapped);
  return wrapped;
}

/** Full on-chain feed (`data.json`) with Syra attribution wrapper. */
export async function fetchOnChainFeed() {
  return fetchCachedFeed('on-chain', AGENT_ECONOMY_ON_CHAIN_URL);
}

/** Full off-chain feed (`web-sources.json`) with Syra attribution wrapper. */
export async function fetchOffChainFeed() {
  return fetchCachedFeed('off-chain', AGENT_ECONOMY_OFF_CHAIN_URL);
}

/**
 * Dual-feed freshness: top-level updatedAt + off-chain section asOf keys.
 */
export async function getFreshness() {
  const [onChain, offChain] = await Promise.all([fetchOnChainFeed(), fetchOffChainFeed()]);
  const onFeed = onChain.feed && typeof onChain.feed === 'object' ? onChain.feed : {};
  const offFeed = offChain.feed && typeof offChain.feed === 'object' ? offChain.feed : {};

  /** @type {Record<string, string | null>} */
  const sectionAsOf = {};
  for (const [key, value] of Object.entries(offFeed)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
    const asOf = /** @type {Record<string, unknown>} */ (value).asOf;
    if (typeof asOf === 'string') sectionAsOf[key] = asOf;
  }

  return {
    source: AGENT_ECONOMY_SOURCE,
    license: AGENT_ECONOMY_LICENSE,
    upstream: {
      onChain: AGENT_ECONOMY_ON_CHAIN_URL,
      offChain: AGENT_ECONOMY_OFF_CHAIN_URL,
      site: AGENT_ECONOMY_BASE_URL,
    },
    onChain: {
      updatedAt: typeof onFeed.updatedAt === 'string' ? onFeed.updatedAt : null,
      fetchedAt: onChain.fetchedAt,
    },
    offChain: {
      updatedAt: typeof offFeed.updatedAt === 'string' ? offFeed.updatedAt : null,
      schema: toNum(offFeed.schema),
      fetchedAt: offChain.fetchedAt,
      sectionAsOf,
    },
    computedAt: new Date().toISOString(),
  };
}

/**
 * Curated Syra-relevant headlines from both feeds (not Syra traction).
 */
export async function getSummary() {
  const [onChain, offChain] = await Promise.all([fetchOnChainFeed(), fetchOffChainFeed()]);
  const onFeed = onChain.feed && typeof onChain.feed === 'object' ? onChain.feed : {};
  const offFeed = offChain.feed && typeof offChain.feed === 'object' ? offChain.feed : {};

  const x402 = onFeed.x402 && typeof onFeed.x402 === 'object' ? onFeed.x402 : {};
  const erc8004 =
    onFeed.erc8004Registry && typeof onFeed.erc8004Registry === 'object'
      ? onFeed.erc8004Registry
      : {};
  const x402Services =
    offFeed.x402Services && typeof offFeed.x402Services === 'object' ? offFeed.x402Services : {};
  const agentSupply =
    offFeed.agentSupply && typeof offFeed.agentSupply === 'object' ? offFeed.agentSupply : {};
  const devAdoption =
    offFeed.devAdoption && typeof offFeed.devAdoption === 'object' ? offFeed.devAdoption : {};

  return {
    success: true,
    source: AGENT_ECONOMY_SOURCE,
    license: AGENT_ECONOMY_LICENSE,
    note: 'External ecosystem context from agenteconomy.to. Not Syra first-party traction (see GET /api/metrics).',
    upstream: {
      onChain: AGENT_ECONOMY_ON_CHAIN_URL,
      offChain: AGENT_ECONOMY_OFF_CHAIN_URL,
      site: AGENT_ECONOMY_BASE_URL,
    },
    updatedAt: {
      onChain: typeof onFeed.updatedAt === 'string' ? onFeed.updatedAt : null,
      offChain: typeof offFeed.updatedAt === 'string' ? offFeed.updatedAt : null,
    },
    x402: {
      totalTxs: toNum(x402.totalTxs),
      totalVolumeUsd: toNum(x402.totalVolume),
      facilitatorsTracked: toNum(x402.facilitatorsTracked),
      chainsTracked: toNum(x402.chainsTracked),
    },
    erc8004: {
      totalAgents: toNum(erc8004.totalAgents),
      chainsTracked: toNum(erc8004.chainsTracked),
    },
    x402Services: {
      uniqueProviders: toNum(x402Services.uniqueProviders),
      totalListings: toNum(x402Services.totalListings),
    },
    agentSupply: {
      officialMcpServers: toNum(agentSupply.officialMcpServers),
    },
    devAdoption: {
      totalWeeklyAvg4w: toNum(devAdoption.totalWeeklyAvg4w),
    },
    fetchedAt: {
      onChain: onChain.fetchedAt,
      offChain: offChain.fetchedAt,
    },
    computedAt: new Date().toISOString(),
  };
}

/** @internal test helper */
export function _clearAgentEconomyCacheForTests() {
  cache.del('on-chain');
  cache.del('off-chain');
}
