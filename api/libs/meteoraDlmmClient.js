const METEORA_BASE_URL = (
  process.env.METEORA_DLMM_API_BASE_URL || "https://dlmm.datapi.meteora.ag"
).replace(/\/$/, "");

/** Common quote mints when resolving all DLMM pools for a base token. */
export const METEORA_DEFAULT_QUOTE_MINTS = [
  "So11111111111111111111111111111111111111112", // WSOL
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
];

const REQUEST_TIMEOUT_MS = 12_000;
const RETRY_DELAY_MS = 400;
const MAX_RETRIES = 2;
const CACHE_TTL_MS = 20_000;

const cache = new Map();

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCached(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function setCached(key, data) {
  cache.set(key, { ts: Date.now(), data });
}

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Daily fee yield as a decimal ratio (e.g. 0.00448 = 0.448%/day on deployed TVL).
 * Meteora fee_tvl_ratio["24h"] is the same number in percent points (0.448 = 0.448%/day).
 * Prefer fees_24h / TVL when both are present — always the correct decimal.
 */
export function resolvePoolFeeTvlRatio(raw, fee24hUsd, tvlUsd) {
  const tvl = toNum(tvlUsd);
  const fee24 = toNum(fee24hUsd);
  if (tvl > 0 && fee24 > 0) {
    return fee24 / tvl;
  }
  const apiPct =
    toNum(raw?.fee_tvl_ratio?.["24h"]) ||
    toNum(raw?.fee_tvl?.["24h"]) ||
    toNum(raw?.feeTvlRatio?.["24h"]);
  if (apiPct > 0) {
    return apiPct / 100;
  }
  return 0;
}

async function fetchJson(path, init = {}) {
  const url = `${METEORA_BASE_URL}${path}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      ...init,
      signal: ctrl.signal,
      headers: {
        Accept: "application/json",
        ...(init.headers || {}),
      },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`Meteora ${res.status}: ${body?.message || body?.error || "request failed"}`);
    }
    return body;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(path, options = {}) {
  let lastError = null;
  for (let i = 0; i <= MAX_RETRIES; i += 1) {
    try {
      return await fetchJson(path, options);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (i < MAX_RETRIES) await sleep(RETRY_DELAY_MS * (i + 1));
    }
  }
  throw lastError || new Error("Meteora request failed");
}

function normalizePool(raw) {
  const fee24hUsd =
    toNum(raw?.fees?.["24h"]) ||
    toNum(raw?.fees_24h) ||
    toNum(raw?.fees24h) ||
    toNum(raw?.fee_24h) ||
    toNum(raw?.fee24h) ||
    0;
  const tvlUsd = toNum(raw?.liquidity) || toNum(raw?.tvl) || toNum(raw?.tvlUsd) || 0;
  const volume24hUsd =
    toNum(raw?.volume?.["24h"]) ||
    toNum(raw?.trade_volume_24h) ||
    toNum(raw?.volume_24h) ||
    toNum(raw?.volume24h) ||
    toNum(raw?.volume24hUsd) ||
    0;
  const feeTvlRatio = resolvePoolFeeTvlRatio(raw, fee24hUsd, tvlUsd);
  const currentPrice =
    toNum(raw?.current_price) || toNum(raw?.price) || toNum(raw?.spotPrice) || toNum(raw?.lastPrice) || 0;

  return {
    poolAddress: raw?.address || raw?.pubkey || raw?.poolAddress || "",
    poolName: raw?.name || raw?.pair_name || raw?.pairName || "Unknown pool",
    baseSymbol:
      raw?.token_x?.symbol || raw?.mint_x_symbol || raw?.base_symbol || raw?.baseSymbol || "TOKEN_X",
    quoteSymbol:
      raw?.token_y?.symbol || raw?.mint_y_symbol || raw?.quote_symbol || raw?.quoteSymbol || "TOKEN_Y",
    baseMint:
      raw?.token_x?.address ||
      raw?.mint_x ||
      raw?.mintX ||
      raw?.baseMint ||
      raw?.token_x_mint ||
      null,
    quoteMint:
      raw?.token_y?.address ||
      raw?.mint_y ||
      raw?.mintY ||
      raw?.quoteMint ||
      raw?.token_y_mint ||
      null,
    binStep: toNum(raw?.pool_config?.bin_step || raw?.bin_step || raw?.binStep, 0),
    activeBinId: toNum(raw?.active_bin || raw?.activeBin || raw?.activeBinId, 0),
    tvlUsd,
    fee24hUsd,
    volume24hUsd,
    feeTvlRatio,
    currentPrice,
    raw,
  };
}

export async function fetchMeteoraPoolPages({
  pages = 4,
  limit = 100,
  sortKey = "fee",
  order = "desc",
  hideLowTvl = false,
} = {}) {
  const seen = new Map();
  for (let page = 1; page <= pages; page += 1) {
    const batch = await fetchMeteoraPools({ page, limit, sortKey, order, hideLowTvl });
    if (!batch.length) break;
    for (const pool of batch) {
      if (pool.poolAddress) seen.set(pool.poolAddress, pool);
    }
  }
  return [...seen.values()];
}

export async function fetchMeteoraPools({
  page = 1,
  limit = 100,
  sortKey = "fee",
  order = "desc",
  hideLowTvl = true,
} = {}) {
  const key = `pools:${page}:${limit}:${sortKey}:${order}:${hideLowTvl}`;
  const cached = getCached(key);
  if (cached) return cached;

  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort_key: sortKey,
    order_by: order,
    hide_low_tvl_pools: String(Boolean(hideLowTvl)),
  });
  let body;
  try {
    body = await fetchWithRetry(`/pools?${q.toString()}`);
  } catch {
    body = await fetchWithRetry(`/pair/all_with_pagination?${q.toString()}`);
  }
  const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  const normalized = rows.map(normalizePool).filter((p) => p.poolAddress);
  setCached(key, normalized);
  return normalized;
}

export function lexicalOrderMints(mintA, mintB) {
  const a = String(mintA || "").trim();
  const b = String(mintB || "").trim();
  if (!a || !b) throw new Error("Both mints are required");
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}

function poolIncludesMint(pool, mint) {
  const m = String(mint || "").trim();
  if (!m) return false;
  return pool.baseMint === m || pool.quoteMint === m;
}

function poolMatchesText(pool, text) {
  const q = String(text || "").trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    pool.poolName,
    pool.baseSymbol,
    pool.quoteSymbol,
    pool.baseMint,
    pool.quoteMint,
    pool.poolAddress,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function ingestPoolRows(rows, mint, seen, { trustSearchResults = false, textQuery = "" } = {}) {
  for (const raw of rows) {
    const normalized = normalizePool(raw);
    if (!normalized.poolAddress) continue;
    const mintOk = !mint || poolIncludesMint(normalized, mint);
    const textOk = !textQuery || poolMatchesText(normalized, textQuery);
    if (trustSearchResults) {
      if (textQuery ? textOk : true) {
        seen.set(normalized.poolAddress, normalized);
      }
      continue;
    }
    if (mintOk && textOk) {
      seen.set(normalized.poolAddress, normalized);
    }
  }
}

/**
 * Paginate Meteora /pools search and ingest rows.
 * @param {string} query
 * @param {Map<string, object>} seen
 * @param {{ mint?: string; trustSearchResults?: boolean; maxPages?: number }} [opts]
 */
async function paginateMeteoraSearch(query, seen, opts = {}) {
  const q = String(query || "").trim();
  if (!q) return;
  const mint = opts.mint ? String(opts.mint).trim() : "";
  const maxPages = opts.maxPages ?? 15;

  for (let page = 1; page <= maxPages; page += 1) {
    try {
      const params = new URLSearchParams({
        query: q,
        page: String(page),
        page_size: "100",
        sort_by: "tvl:desc",
      });
      const body = await fetchWithRetry(`/pools?${params.toString()}`);
      const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
      ingestPoolRows(rows, mint, seen, {
        trustSearchResults: Boolean(opts.trustSearchResults),
        textQuery: opts.trustSearchResults && q.length <= 12 ? q : "",
      });
      const totalPages = toNum(body?.pages, 1);
      if (page >= totalPages || !rows.length) break;
    } catch {
      break;
    }
  }
}

/**
 * Fetch all DLMM pools that include a token mint.
 * Primary: Meteora /pools search by mint + symbol text (Meteora search already filters).
 * Fallback: legacy /pools/groups/{lexical_order_mints} per quote mint.
 * @param {string} tokenMint
 * @param {{ quoteMints?: string[]; textQueries?: string[]; maxPages?: number }} [opts]
 */
export async function fetchMeteoraPoolsByTokenMint(
  tokenMint,
  { quoteMints = METEORA_DEFAULT_QUOTE_MINTS, textQueries = [], maxPages = 15 } = {},
) {
  const mint = String(tokenMint || "").trim();
  if (!mint) throw new Error("tokenMint is required");

  const textTerms = [
    ...new Set(textQueries.map((t) => String(t || "").trim()).filter(Boolean)),
  ];
  const key = `mint:${mint}:${textTerms.join(",")}:${quoteMints.join(",")}`;
  const cached = getCached(key);
  if (cached) return cached;

  const seen = new Map();

  await paginateMeteoraSearch(mint, seen, { mint, trustSearchResults: true, maxPages });

  for (const term of textTerms) {
    if (term === mint) continue;
    await paginateMeteoraSearch(term, seen, {
      mint,
      trustSearchResults: true,
      maxPages,
    });
  }

  if (!seen.size) {
    for (const quoteMint of quoteMints) {
      const quote = String(quoteMint || "").trim();
      if (!quote || quote === mint) continue;
      try {
        const groupKey = lexicalOrderMints(mint, quote);
        const body = await fetchWithRetry(`/pools/groups/${encodeURIComponent(groupKey)}`);
        const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
        ingestPoolRows(rows, mint, seen);
      } catch {
        // Pair group may not exist on Meteora — skip.
      }
    }
  }

  const pools = [...seen.values()];
  setCached(key, pools);
  return pools;
}

export async function fetchMeteoraPoolDetail(poolAddress) {
  const addr = String(poolAddress || "").trim();
  if (!addr) throw new Error("poolAddress is required");
  const key = `pool:${addr}`;
  const cached = getCached(key);
  if (cached) return cached;
  let body;
  try {
    body = await fetchWithRetry(`/pools/${encodeURIComponent(addr)}`);
  } catch {
    body = await fetchWithRetry(`/pair/${encodeURIComponent(addr)}`);
  }
  const normalized = normalizePool(body?.data || body);
  setCached(key, normalized);
  return normalized;
}

export async function fetchMeteoraPositionsByWallet(walletAddress) {
  const wallet = String(walletAddress || "").trim();
  if (!wallet) throw new Error("walletAddress is required");
  const key = `positions:${wallet}`;
  const cached = getCached(key);
  if (cached) return cached;
  const body = await fetchWithRetry(`/position/${encodeURIComponent(wallet)}`);
  const data = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  setCached(key, data);
  return data;
}

export function __clearMeteoraCacheForTest() {
  cache.clear();
}
