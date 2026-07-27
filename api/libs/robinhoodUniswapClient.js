/**
 * Robinhood Chain Uniswap pool client — GeckoTerminal primary, DexScreener fallback.
 * Normalizes EVM pools into the same shape the LP sim expects (Meteora-compatible fields).
 */
import { createBoundedTtlCache } from "../utils/boundedTtlCache.js";

const GECKO_BASE_URL = "https://api.geckoterminal.com/api/v2";
const DEXSCREENER_BASE_URL = "https://api.dexscreener.com";
const FETCH_TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 45_000;

export const ROBINHOOD_CHAIN_ID = 4663;
export const GECKO_NETWORK_SLUG = "robinhood";
export const DEXSCREENER_CHAIN_ID = "robinhood";

/** Primary Uniswap deployments on Robinhood Chain (GeckoTerminal dex ids). */
export const ROBINHOOD_UNISWAP_DEX_IDS = Object.freeze([
  "uniswap-v3-robinhood",
  "uniswap-v4-robinhood",
  "uniswap-v2-robinhood",
]);

export const ROBINHOOD_WETH_ADDRESS = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";
/** Canonical Global Dollar (USDG) from docs.robinhood.com/chain/contracts */
export const ROBINHOOD_USDG_ADDRESS = "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";
/** Optional bridged USDC — unset by default (no native USDC on Robinhood mainnet). */
export const ROBINHOOD_USDC_ADDRESS =
  (typeof process.env.ROBINHOOD_USDC === "string" && process.env.ROBINHOOD_USDC.trim()) || "";

const cache = createBoundedTtlCache({
  name: "robinhood-uniswap-pools",
  maxEntries: 300,
  defaultTtlMs: CACHE_TTL_MS,
});

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeAddress(addr) {
  return String(addr || "")
    .trim()
    .toLowerCase();
}

/**
 * Parse Uniswap fee tier from pool name, e.g. "TOKEN / WETH 0.3%" -> 0.003 decimal.
 * @param {string} poolName
 * @param {number} [fallback]
 */
export function parseUniswapFeeTierFromName(poolName, fallback = 0.003) {
  const match = String(poolName || "").match(/(\d+(?:\.\d+)?)\s*%/);
  if (!match) return fallback;
  const pct = toNum(match[1], 0);
  if (pct <= 0) return fallback;
  return pct / 100;
}

/**
 * Approximate Uniswap tick from USD price (for in-range / OOR simulation).
 * @param {number} priceUsd
 * @param {number} tickSpacing
 */
export function priceToSimTick(priceUsd, tickSpacing = 60) {
  const price = toNum(priceUsd);
  if (price <= 0) return 0;
  const rawTick = Math.log(price) / Math.log(1.0001);
  const spacing = Math.max(1, Math.floor(toNum(tickSpacing, 60)));
  return Math.round(rawTick / spacing) * spacing;
}

/**
 * Derive daily fee/TVL ratio from 24h volume and fee tier (GeckoTerminal lacks raw fees).
 * @param {{ volume24hUsd?: number; tvlUsd?: number; feeTier?: number }} params
 */
export function deriveFeeTvlRatio({ volume24hUsd, tvlUsd, feeTier = 0.003 }) {
  const tvl = toNum(tvlUsd);
  const vol = toNum(volume24hUsd);
  const tier = toNum(feeTier, 0.003);
  if (tvl <= 0 || vol <= 0) return 0;
  return (vol * tier) / tvl;
}

/**
 * @param {Record<string, unknown>} item
 * @param {Map<string, Record<string, unknown>>} tokenMap
 */
function normalizeGeckoPool(item, tokenMap = new Map()) {
  const attrs = item.attributes && typeof item.attributes === "object" ? item.attributes : {};
  const rel = item.relationships && typeof item.relationships === "object" ? item.relationships : {};
  const dexData = rel.dex?.data;
  const dexId =
    dexData && typeof dexData === "object" && typeof dexData.id === "string" ? dexData.id : null;

  const baseTokenId =
    rel.base_token?.data && typeof rel.base_token.data.id === "string"
      ? rel.base_token.data.id
      : null;
  const quoteTokenId =
    rel.quote_token?.data && typeof rel.quote_token.data.id === "string"
      ? rel.quote_token.data.id
      : null;

  const baseToken = baseTokenId ? tokenMap.get(baseTokenId) : null;
  const quoteToken = quoteTokenId ? tokenMap.get(quoteTokenId) : null;

  const poolName = typeof attrs.name === "string" ? attrs.name : "Unknown pool";
  const poolAddress =
    typeof attrs.address === "string"
      ? attrs.address
      : typeof item.id === "string"
        ? item.id.split("_").pop() || ""
        : "";

  const tvlUsd = toNum(attrs.reserve_in_usd);
  const volume24hUsd = toNum(attrs.volume_usd?.h24 ?? attrs.volume_usd);
  const currentPrice = toNum(attrs.base_token_price_usd);
  const feeTier = parseUniswapFeeTierFromName(poolName);
  const binStep = feeTier <= 0.0006 ? 10 : feeTier <= 0.0035 ? 60 : 200;
  const feeTvlRatio = deriveFeeTvlRatio({ volume24hUsd, tvlUsd, feeTier });

  return {
    poolAddress,
    poolName,
    baseSymbol:
      (baseToken?.attributes?.symbol && String(baseToken.attributes.symbol)) ||
      poolName.split("/")[0]?.trim() ||
      "TOKEN",
    quoteSymbol:
      (quoteToken?.attributes?.symbol && String(quoteToken.attributes.symbol)) ||
      poolName.split("/")[1]?.trim()?.split(/\s+/)[0] ||
      "QUOTE",
    baseMint:
      (baseToken?.attributes?.address && String(baseToken.attributes.address)) ||
      null,
    quoteMint:
      (quoteToken?.attributes?.address && String(quoteToken.attributes.address)) ||
      null,
    binStep,
    activeBinId: priceToSimTick(currentPrice, binStep),
    tvlUsd,
    fee24hUsd: volume24hUsd * feeTier,
    volume24hUsd,
    feeTvlRatio,
    feeTier,
    currentPrice,
    dexId,
    chainId: ROBINHOOD_CHAIN_ID,
    source: "geckoterminal",
  };
}

/**
 * @param {Record<string, unknown>} pair
 */
function normalizeDexScreenerPair(pair) {
  const base = pair.baseToken && typeof pair.baseToken === "object" ? pair.baseToken : {};
  const quote = pair.quoteToken && typeof pair.quoteToken === "object" ? pair.quoteToken : {};
  const poolName = `${base.symbol || "TOKEN"} / ${quote.symbol || "QUOTE"}`;
  const tvlUsd = toNum(pair.liquidityUsd ?? pair.liquidity?.usd);
  const volume24hUsd = toNum(pair.volume24h ?? pair.volume?.h24);
  const currentPrice = toNum(pair.priceUsd);
  const feeTier = parseUniswapFeeTierFromName(poolName);
  const binStep = feeTier <= 0.0006 ? 10 : feeTier <= 0.0035 ? 60 : 200;

  return {
    poolAddress: typeof pair.pairAddress === "string" ? pair.pairAddress : "",
    poolName,
    baseSymbol: typeof base.symbol === "string" ? base.symbol : "TOKEN",
    quoteSymbol: typeof quote.symbol === "string" ? quote.symbol : "QUOTE",
    baseMint: typeof base.address === "string" ? base.address : null,
    quoteMint: typeof quote.address === "string" ? quote.address : null,
    binStep,
    activeBinId: priceToSimTick(currentPrice, binStep),
    tvlUsd,
    fee24hUsd: volume24hUsd * feeTier,
    volume24hUsd,
    feeTvlRatio: deriveFeeTvlRatio({ volume24hUsd, tvlUsd, feeTier }),
    feeTier,
    currentPrice,
    dexId: typeof pair.dexId === "string" ? pair.dexId : null,
    chainId: ROBINHOOD_CHAIN_ID,
    source: "dexscreener",
  };
}

async function fetchGeckoJson(path) {
  const url = `${GECKO_BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`GeckoTerminal ${res.status}: ${body?.errors?.[0]?.title || "request failed"}`);
  }
  return body;
}

/**
 * @param {string} path
 * @param {number} [retries]
 */
async function fetchGeckoWithRetry(path, retries = 2) {
  let lastError = null;
  for (let i = 0; i <= retries; i += 1) {
    try {
      return await fetchGeckoJson(path);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < retries) await sleep(450 * (i + 1));
    }
  }
  throw lastError || new Error("GeckoTerminal request failed");
}

/**
 * @param {unknown} body
 */
function buildTokenMap(body) {
  const map = new Map();
  const included = Array.isArray(body?.included) ? body.included : [];
  for (const row of included) {
    if (row?.id && row?.type === "token") {
      map.set(String(row.id), row);
    }
  }
  return map;
}

/**
 * Fetch pools for one Uniswap dex on Robinhood Chain.
 * @param {{ dexId: string; page?: number; limit?: number }} params
 */
export async function fetchRobinhoodUniswapDexPools({ dexId, page = 1, limit = 50 } = {}) {
  const safeDex = String(dexId || "").trim();
  if (!safeDex) return [];
  const cacheKey = `dex:${safeDex}:${page}:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const body = await fetchGeckoWithRetry(
    `/networks/${GECKO_NETWORK_SLUG}/dexes/${encodeURIComponent(safeDex)}/pools?page=${page}`,
  );
  const tokenMap = buildTokenMap(body);
  const rows = Array.isArray(body?.data) ? body.data : [];
  const pools = rows
    .slice(0, limit)
    .map((row) => normalizeGeckoPool(row, tokenMap))
    .filter((p) => p.poolAddress);
  cache.set(cacheKey, pools);
  return pools;
}

/**
 * Fetch trending pools on Robinhood Chain, filtered to Uniswap dexes.
 * @param {{ pages?: number; limitPerPage?: number }} [opts]
 */
export async function fetchRobinhoodTrendingUniswapPools({ pages = 2, limitPerPage = 50 } = {}) {
  const cacheKey = `trending:${pages}:${limitPerPage}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const seen = new Map();
  for (let page = 1; page <= pages; page += 1) {
    try {
      const body = await fetchGeckoWithRetry(
        `/networks/${GECKO_NETWORK_SLUG}/trending_pools?page=${page}`,
      );
      const tokenMap = buildTokenMap(body);
      const rows = Array.isArray(body?.data) ? body.data : [];
      for (const row of rows) {
        const pool = normalizeGeckoPool(row, tokenMap);
        if (!pool.poolAddress) continue;
        const dex = String(pool.dexId || "").toLowerCase();
        if (!dex.includes("uniswap")) continue;
        seen.set(pool.poolAddress, pool);
      }
    } catch {
      break;
    }
  }
  const pools = [...seen.values()].slice(0, limitPerPage * pages);
  cache.set(cacheKey, pools);
  return pools;
}

async function fetchDexScreenerJson(url) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`DexScreener ${res.status}: ${text.slice(0, 200)}`);
  }
  return res.json();
}

/**
 * DexScreener fallback when GeckoTerminal is rate-limited.
 * @param {{ limit?: number }} [opts]
 */
export async function fetchDexScreenerRobinhoodUniswapPools({ limit = 80 } = {}) {
  const cacheKey = `dexscreener:uniswap:${limit}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const body = await fetchDexScreenerJson(
    `${DEXSCREENER_BASE_URL}/latest/dex/search?q=${encodeURIComponent("uniswap robinhood")}`,
  );
  const pairs = Array.isArray(body?.pairs) ? body.pairs : [];
  const pools = pairs
    .filter(
      (p) =>
        String(p.chainId || "").toLowerCase() === DEXSCREENER_CHAIN_ID &&
        String(p.dexId || "").toLowerCase().includes("uniswap"),
    )
    .slice(0, limit)
    .map(normalizeDexScreenerPair)
    .filter((p) => p.poolAddress);

  cache.set(cacheKey, pools);
  return pools;
}

/**
 * @param {{ pages?: number; limit?: number; sortKey?: string }} [opts]
 */
export async function fetchRobinhoodUniswapPoolPages({
  pages = 3,
  limit = 100,
  sortKey = "volume",
} = {}) {
  const seen = new Map();

  for (const dexId of ROBINHOOD_UNISWAP_DEX_IDS) {
    for (let page = 1; page <= pages; page += 1) {
      try {
        const batch = await fetchRobinhoodUniswapDexPools({
          dexId,
          page,
          limit: Math.ceil(limit / pages),
        });
        for (const pool of batch) {
          if (pool.poolAddress) seen.set(pool.poolAddress, pool);
        }
        if (batch.length === 0) break;
        await sleep(350);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("429") || msg.includes("Rate Limit")) break;
        break;
      }
    }
  }

  if (seen.size < 12) {
    try {
      const trending = await fetchRobinhoodTrendingUniswapPools({ pages: 2, limitPerPage: 60 });
      for (const pool of trending) {
        if (pool.poolAddress) seen.set(pool.poolAddress, pool);
      }
    } catch {
      // trending fallback optional
    }
  }

  if (seen.size < 8) {
    try {
      const dsPools = await fetchDexScreenerRobinhoodUniswapPools({ limit: Math.max(limit, 60) });
      for (const pool of dsPools) {
        if (pool.poolAddress) seen.set(pool.poolAddress, pool);
      }
    } catch {
      // DexScreener optional
    }
  }

  let pools = [...seen.values()];
  if (sortKey === "fee") {
    pools.sort((a, b) => toNum(b.feeTvlRatio) - toNum(a.feeTvlRatio));
  } else if (sortKey === "tvl") {
    pools.sort((a, b) => toNum(b.tvlUsd) - toNum(a.tvlUsd));
  } else {
    pools.sort((a, b) => toNum(b.volume24hUsd) - toNum(a.volume24hUsd));
  }
  return pools.slice(0, limit);
}

/** @param {{ page?: number; limit?: number; sortKey?: string }} [opts] */
export async function fetchRobinhoodUniswapPools(opts = {}) {
  return fetchRobinhoodUniswapPoolPages({ pages: 1, ...opts });
}

/**
 * @param {string} poolAddress
 */
export async function fetchRobinhoodUniswapPoolDetail(poolAddress) {
  const addr = String(poolAddress || "").trim();
  if (!addr) throw new Error("poolAddress is required");
  const cacheKey = `pool:${normalizeAddress(addr)}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const body = await fetchGeckoWithRetry(
      `/networks/${GECKO_NETWORK_SLUG}/pools/${encodeURIComponent(addr)}?include=base_token,quote_token,dex`,
    );
    const tokenMap = buildTokenMap(body);
    const row = body?.data;
    if (row) {
      const normalized = normalizeGeckoPool(row, tokenMap);
      cache.set(cacheKey, normalized);
      return normalized;
    }
  } catch {
    // fall through to DexScreener
  }

  const dsUrl = `${DEXSCREENER_BASE_URL}/latest/dex/pairs/${DEXSCREENER_CHAIN_ID}/${encodeURIComponent(addr)}`;
  const dsRes = await fetch(dsUrl, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const dsBody = await dsRes.json().catch(() => ({}));
  const pairs = Array.isArray(dsBody?.pairs) ? dsBody.pairs : [];
  const match = pairs.find((p) => normalizeAddress(p.pairAddress) === normalizeAddress(addr)) || pairs[0];
  if (!match) throw new Error(`Pool not found: ${addr}`);
  const normalized = normalizeDexScreenerPair(match);
  cache.set(cacheKey, normalized);
  return normalized;
}

export function isRobinhoodQuoteMint(mint) {
  const m = normalizeAddress(mint);
  if (!m) return false;
  const quotes = new Set([
    normalizeAddress(ROBINHOOD_WETH_ADDRESS),
    normalizeAddress(ROBINHOOD_USDG_ADDRESS),
  ]);
  if (ROBINHOOD_USDC_ADDRESS) quotes.add(normalizeAddress(ROBINHOOD_USDC_ADDRESS));
  return quotes.has(m);
}

export function isRobinhoodQuoteSymbol(symbol) {
  const s = String(symbol || "").trim().toUpperCase();
  return s === "WETH" || s === "ETH" || s === "USDC" || s === "USDG";
}

export function __clearRobinhoodUniswapCacheForTest() {
  cache.clear();
}
