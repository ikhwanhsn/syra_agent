/**
 * Polymarket smart-money signals for the Delphi paper desk.
 *
 * Rank crypto traders, read live positions, map each market to { asset, direction },
 * then emit per-asset bias in [-1, 1] plus consensus and sample size.
 *
 * Network calls are injectable (`fetchImpl`) so unit tests stay offline.
 */
import { createBoundedTtlCache } from "../utils/boundedTtlCache.js";
import { fetchWithRetry } from "../utils/resilientFetch.js";

export const POLYMARKET_GAMMA_BASE =
  process.env.POLYMARKET_GAMMA_BASE || "https://gamma-api.polymarket.com";
export const POLYMARKET_DATA_BASE =
  process.env.POLYMARKET_DATA_BASE || "https://data-api.polymarket.com";

export const DELPHI_SIGNAL_ASSETS = Object.freeze(["BTC", "ETH", "SOL"]);

const FETCH_TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 10 * 60_000;
const TOP_TRADER_LIMIT = 25;
const MIN_POSITION_USD = 10;
const DEFAULT_MIN_RESOLVED = 3;

const cache = createBoundedTtlCache({
  name: "polymarket-trader-signals",
  maxEntries: 32,
  defaultTtlMs: CACHE_TTL_MS,
});

const ASSET_PATTERNS = Object.freeze([
  { symbol: "BTC", re: /\b(bitcoin|btc|\$btc)\b/i },
  { symbol: "ETH", re: /\b(ethereum|ether|\beth|\$eth)\b/i },
  { symbol: "SOL", re: /\b(solana|\bsol\b|\$sol)\b/i },
]);

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.positions)) return payload.positions;
  if (Array.isArray(payload?.markets)) return payload.markets;
  if (Array.isArray(payload?.events)) return payload.events;
  if (Array.isArray(payload?.holders)) return payload.holders;
  return [];
}

function walletOf(row) {
  return String(
    row?.proxyWallet ||
      row?.user ||
      row?.address ||
      row?.wallet ||
      row?.holder ||
      "",
  )
    .trim()
    .toLowerCase();
}

/**
 * Parse the underlying crypto asset from a Polymarket title/question/ticker.
 * @param {string} [text]
 * @returns {"BTC"|"ETH"|"SOL"|null}
 */
export function parseMarketAsset(text) {
  const raw = String(text || "");
  if (!raw.trim()) return null;
  for (const row of ASSET_PATTERNS) {
    if (row.re.test(raw)) return row.symbol;
  }
  return null;
}

/**
 * Map a held outcome to a directional view: +1 long / -1 short.
 * Returns null when the market structure is ambiguous (ranges, unrelated).
 *
 * @param {{ title?: string, question?: string, outcome?: string, slug?: string }} row
 * @returns {1|-1|null}
 */
export function inferDirectionFromOutcome(row = {}) {
  const text = `${row.title || ""} ${row.question || ""} ${row.slug || ""}`.toLowerCase();
  const out = String(row.outcome || "").trim().toLowerCase();
  if (!out) return null;

  const isUp = out === "up" || out === "higher" || out === "bull" || out === "yes";
  const isDown = out === "down" || out === "lower" || out === "bear" || out === "no";
  if (!isUp && !isDown) return null;

  if (/\bup[\s/-]*or[\s/-]*down\b/.test(text) || /\bup\/down\b/.test(text)) {
    if (out === "up" || out === "yes" || out === "higher") return 1;
    if (out === "down" || out === "no" || out === "lower") return -1;
  }
  if (/\bbelow\b/.test(text) || /\bunder\b/.test(text)) {
    return isUp ? -1 : 1;
  }
  if (/\b(above|over|hit|reach|rally|ath|moon)\b/.test(text)) {
    return isUp ? 1 : -1;
  }
  if (out === "up" || out === "higher" || out === "bull") return 1;
  if (out === "down" || out === "lower" || out === "bear") return -1;
  if (out === "yes") return 1;
  if (out === "no") return -1;
  return null;
}

/**
 * @param {Record<string, unknown>} position
 * @param {{ allowedAssets?: string[] }} [opts]
 * @returns {{
 *   asset: string,
 *   direction: 1|-1,
 *   notionalUsd: number,
 *   marketTitle: string,
 *   outcome: string,
 * } | null}
 */
export function parsePositionView(position, opts = {}) {
  const allowed = new Set(
    (opts.allowedAssets || DELPHI_SIGNAL_ASSETS).map((s) => String(s).toUpperCase()),
  );
  const title = String(
    position?.title || position?.question || position?.eventTitle || position?.slug || "",
  );
  const asset = parseMarketAsset(title);
  if (!asset || !allowed.has(asset)) return null;
  const direction = inferDirectionFromOutcome({
    title,
    question: position?.question,
    outcome: position?.outcome,
    slug: position?.slug,
  });
  if (direction !== 1 && direction !== -1) return null;
  const notionalUsd = Math.max(
    toNum(position?.currentValue, 0),
    toNum(position?.size, 0) * toNum(position?.curPrice ?? position?.avgPrice, 0),
    toNum(position?.initialValue, 0),
  );
  if (notionalUsd < MIN_POSITION_USD) return null;
  return {
    asset,
    direction,
    notionalUsd,
    marketTitle: title,
    outcome: String(position?.outcome || ""),
  };
}

/**
 * Quality in [0, 1] from realized PnL, win rate, and resolved-market sample.
 *
 * @param {{ pnl?: number, winRate?: number, resolvedCount?: number, volume?: number }} stats
 */
export function scoreTraderQuality(stats = {}) {
  const pnl = toNum(stats.pnl, 0);
  const winRate = clamp(toNum(stats.winRate, 0.5), 0, 1);
  const resolved = Math.max(0, toNum(stats.resolvedCount, 0));
  const volume = Math.max(0, toNum(stats.volume, 0));
  const pnlScore = clamp(0.5 + Math.tanh(pnl / 25_000) * 0.5, 0, 1);
  const sampleScore = clamp(resolved / 20, 0, 1);
  const volScore = clamp(Math.log1p(volume) / Math.log1p(250_000), 0, 1);
  return clamp(pnlScore * 0.4 + winRate * 0.35 + sampleScore * 0.15 + volScore * 0.1, 0, 1);
}

/**
 * @param {Array<{ address: string, pnl?: number, winRate?: number, resolvedCount?: number, volume?: number }>} rows
 * @param {{ minResolved?: number, minPnl?: number, limit?: number }} [opts]
 */
export function rankTraders(rows, opts = {}) {
  const minResolved = opts.minResolved ?? DEFAULT_MIN_RESOLVED;
  const minPnl = opts.minPnl ?? 0;
  const limit = opts.limit ?? TOP_TRADER_LIMIT;
  return (Array.isArray(rows) ? rows : [])
    .filter((row) => toNum(row.resolvedCount, 0) >= minResolved && toNum(row.pnl, 0) >= minPnl)
    .map((row) => ({
      ...row,
      address: String(row.address || "").toLowerCase(),
      quality: scoreTraderQuality(row),
    }))
    .filter((row) => row.address)
    .sort((a, b) => b.quality - a.quality || toNum(b.pnl) - toNum(a.pnl))
    .slice(0, limit);
}

/**
 * Weighted directional bias per asset.
 *
 * @param {{
 *   views: Array<{ address: string, asset: string, direction: 1|-1, notionalUsd: number }>,
 *   traders: Array<{ address: string, quality?: number }>,
 *   allowedAssets?: string[],
 * }} input
 */
export function aggregateAssetBias(input) {
  const allowed = (input.allowedAssets || DELPHI_SIGNAL_ASSETS).map((s) =>
    String(s).toUpperCase(),
  );
  const qualityByAddr = new Map(
    (input.traders || []).map((t) => [String(t.address).toLowerCase(), toNum(t.quality, 0.5)]),
  );
  /** @type {Map<string, { longW: number, shortW: number, longN: number, shortN: number, traders: Set<string> }>} */
  const byAsset = new Map();
  for (const asset of allowed) {
    byAsset.set(asset, { longW: 0, shortW: 0, longN: 0, shortN: 0, traders: new Set() });
  }

  for (const view of input.views || []) {
    const asset = String(view.asset || "").toUpperCase();
    const bucket = byAsset.get(asset);
    if (!bucket) continue;
    const addr = String(view.address || "").toLowerCase();
    const quality = qualityByAddr.get(addr) ?? 0.5;
    const weight = Math.max(0, quality) * Math.max(0, toNum(view.notionalUsd, 0));
    if (!(weight > 0)) continue;
    bucket.traders.add(addr);
    if (view.direction === 1) {
      bucket.longW += weight;
      bucket.longN += 1;
    } else if (view.direction === -1) {
      bucket.shortW += weight;
      bucket.shortN += 1;
    }
  }

  return allowed
    .map((symbol) => {
      const bucket = byAsset.get(symbol);
      const totalW = (bucket?.longW || 0) + (bucket?.shortW || 0);
      const sampleSize = bucket?.traders.size || 0;
      const bias = totalW > 0 ? ((bucket.longW - bucket.shortW) / totalW) : 0;
      const majority = Math.max(bucket?.longN || 0, bucket?.shortN || 0);
      const votes = (bucket?.longN || 0) + (bucket?.shortN || 0);
      const consensus = votes > 0 ? majority / votes : 0;
      const traderQuality =
        sampleSize > 0
          ? [...bucket.traders].reduce((sum, addr) => sum + (qualityByAddr.get(addr) ?? 0.5), 0) /
            sampleSize
          : 0;
      return {
        symbol,
        bias: clamp(bias, -1, 1),
        consensus: clamp(consensus, 0, 1),
        sampleSize,
        traderQuality: clamp(traderQuality, 0, 1),
        longWeight: bucket?.longW || 0,
        shortWeight: bucket?.shortW || 0,
        side: bias >= 0 ? "long" : "short",
      };
    })
    .filter((row) => row.sampleSize > 0);
}

export function invalidatePolymarketSignalCache() {
  cache.del("signals:v1");
}

async function defaultFetch(url, init) {
  return fetchWithRetry(
    url,
    { ...init, signal: init?.signal ?? AbortSignal.timeout(FETCH_TIMEOUT_MS) },
    { retries: 2, retryDelayMs: 400 },
  );
}

async function fetchJson(fetchImpl, url) {
  const res = await fetchImpl(url, { headers: { Accept: "application/json" } });
  if (!res?.ok) {
    const status = res?.status ?? 0;
    throw new Error(`Polymarket fetch ${status}: ${url}`);
  }
  return res.json();
}

function mapLeaderboardRow(row) {
  const address = walletOf(row);
  if (!address) return null;
  const wins = toNum(row.wins ?? row.winCount, 0);
  const losses = toNum(row.losses ?? row.lossCount, 0);
  const resolved = toNum(
    row.resolvedCount ?? row.marketsTraded ?? row.numMarkets ?? wins + losses,
    wins + losses,
  );
  const winRate =
    row.winRate != null
      ? toNum(row.winRate)
      : resolved > 0
        ? wins / resolved
        : 0.5;
  return {
    address,
    pnl: toNum(row.pnl ?? row.realizedPnl ?? row.profit, 0),
    volume: toNum(row.vol ?? row.volume, 0),
    winRate: winRate > 1 ? winRate / 100 : winRate,
    resolvedCount: resolved,
    userName: String(row.userName || row.name || ""),
  };
}

async function fetchCryptoMarkets(fetchImpl) {
  const urls = [
    `${POLYMARKET_GAMMA_BASE}/events?tag_slug=crypto&active=true&closed=false&limit=100`,
    `${POLYMARKET_GAMMA_BASE}/markets?closed=false&limit=100`,
  ];
  const markets = [];
  for (const url of urls) {
    try {
      const payload = await fetchJson(fetchImpl, url);
      const rows = asArray(payload);
      for (const row of rows) {
        const nested = Array.isArray(row?.markets) ? row.markets : [row];
        for (const m of nested) {
          const title = String(m?.question || m?.title || row?.title || "");
          const asset = parseMarketAsset(title);
          if (!asset) continue;
          markets.push({
            asset,
            title,
            conditionId: m?.conditionId || m?.condition_id || m?.id,
            slug: m?.slug || row?.slug,
            closed: Boolean(m?.closed ?? row?.closed),
          });
        }
      }
      if (markets.length) break;
    } catch {
      /* try next endpoint */
    }
  }
  return markets;
}

async function fetchLeaderboard(fetchImpl) {
  const urls = [
    `${POLYMARKET_DATA_BASE}/v1/leaderboard?category=CRYPTO&timePeriod=MONTH&orderBy=PNL&limit=50`,
    `${POLYMARKET_DATA_BASE}/leaderboard?category=CRYPTO&timePeriod=MONTH&orderBy=PNL&limit=50`,
    `${POLYMARKET_DATA_BASE}/v1/leaderboard?timePeriod=MONTH&orderBy=PNL&limit=50`,
  ];
  for (const url of urls) {
    try {
      const payload = await fetchJson(fetchImpl, url);
      const mapped = asArray(payload).map(mapLeaderboardRow).filter(Boolean);
      if (mapped.length) return mapped;
    } catch {
      /* try next */
    }
  }
  return [];
}

async function fetchHoldersForMarkets(fetchImpl, markets) {
  const out = [];
  const seen = new Set();
  for (const market of markets.slice(0, 8)) {
    const id = market.conditionId;
    if (!id) continue;
    try {
      const payload = await fetchJson(
        fetchImpl,
        `${POLYMARKET_DATA_BASE}/holders?market=${encodeURIComponent(id)}&limit=20`,
      );
      for (const row of asArray(payload)) {
        const address = walletOf(row);
        if (!address || seen.has(address)) continue;
        seen.add(address);
        out.push({
          address,
          pnl: toNum(row.pnl ?? row.realizedPnl, 0),
          volume: toNum(row.amount ?? row.size ?? row.volume, 0),
          winRate: 0.5,
          resolvedCount: toNum(row.resolvedCount, 5),
        });
      }
    } catch {
      /* skip market */
    }
  }
  return out;
}

async function fetchUserPositions(fetchImpl, address) {
  try {
    const payload = await fetchJson(
      fetchImpl,
      `${POLYMARKET_DATA_BASE}/positions?user=${encodeURIComponent(address)}&sizeThreshold=1`,
    );
    return asArray(payload);
  } catch {
    return [];
  }
}

/**
 * @param {{
 *   fetchImpl?: typeof fetch,
 *   allowedAssets?: string[],
 *   minResolved?: number,
 *   skipCache?: boolean,
 * }} [opts]
 */
export async function fetchPolymarketTraderSignals(opts = {}) {
  const allowedAssets = (opts.allowedAssets || DELPHI_SIGNAL_ASSETS).map((s) =>
    String(s).toUpperCase(),
  );
  const cacheKey = `signals:v1:${allowedAssets.join(",")}`;
  if (!opts.skipCache) {
    const cached = cache.get(cacheKey);
    if (cached) return cached;
  }

  const fetchImpl = opts.fetchImpl || defaultFetch;
  const [markets, leaderboard] = await Promise.all([
    fetchCryptoMarkets(fetchImpl),
    fetchLeaderboard(fetchImpl),
  ]);
  const holders = leaderboard.length >= 8 ? [] : await fetchHoldersForMarkets(fetchImpl, markets);
  const merged = new Map();
  for (const row of [...leaderboard, ...holders]) {
    if (!row?.address) continue;
    const prev = merged.get(row.address);
    merged.set(row.address, prev ? { ...prev, ...row, address: row.address } : row);
  }
  const traders = rankTraders([...merged.values()], {
    minResolved: opts.minResolved ?? DEFAULT_MIN_RESOLVED,
    minPnl: 0,
    limit: TOP_TRADER_LIMIT,
  });

  const views = [];
  for (const trader of traders) {
    const positions = await fetchUserPositions(fetchImpl, trader.address);
    for (const pos of positions) {
      const view = parsePositionView(pos, { allowedAssets });
      if (!view) continue;
      views.push({ address: trader.address, ...view });
    }
  }

  const assets = aggregateAssetBias({ views, traders, allowedAssets });
  const payload = {
    computedAt: new Date().toISOString(),
    source: "polymarket",
    traders: traders.map((t) => ({
      address: t.address,
      userName: t.userName || "",
      quality: t.quality,
      pnl: t.pnl,
      winRate: t.winRate,
      resolvedCount: t.resolvedCount,
    })),
    views,
    assets,
    marketCount: markets.length,
  };
  cache.set(cacheKey, payload);
  return payload;
}
