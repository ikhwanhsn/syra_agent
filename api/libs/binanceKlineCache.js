/**
 * Shared in-memory cache for Binance REST klines (used by /signal and related paths).
 * Keys are symbol|interval (limit-agnostic) so signal-report + ohlcv share one entry.
 */
import { createBoundedTtlCache } from "../utils/boundedTtlCache.js";

const DEFAULT_TTL_MS = Number.parseInt(process.env.BINANCE_KLINE_CACHE_TTL_MS || "120000", 10);
const STALE_MAX_AGE_MS = Number.parseInt(
  process.env.BINANCE_KLINE_STALE_MAX_AGE_MS || String(30 * 60 * 1000),
  10,
);
const KLINE_CACHE_MAX = Math.min(
  2000,
  Math.max(
    64,
    Number.parseInt(process.env.BINANCE_KLINE_CACHE_MAX_ENTRIES ?? "400", 10) || 400,
  ),
);

/**
 * @returns {number}
 */
export function getBinanceKlineCacheTtlMs() {
  return Number.isFinite(DEFAULT_TTL_MS) && DEFAULT_TTL_MS > 0 ? DEFAULT_TTL_MS : 120_000;
}

const cache = createBoundedTtlCache({
  name: "binance-klines",
  maxEntries: KLINE_CACHE_MAX,
  defaultTtlMs: getBinanceKlineCacheTtlMs(),
});

/** @type {Map<string, { data: unknown[][]; storedAt: number }>} */
const staleStore = new Map();

/**
 * Series key (no limit) — preferred for shared OHLCV across endpoints.
 * @param {string} symbol
 * @param {string} interval
 * @returns {string}
 */
export function binanceKlineSeriesKey(symbol, interval) {
  return `${String(symbol).toUpperCase()}|${interval}`;
}

/**
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @param {number} [startTime]
 * @param {number} [endTime]
 * @returns {string}
 */
export function binanceKlineCacheKey(symbol, interval, limit, startTime, endTime) {
  if (startTime == null && endTime == null) {
    return binanceKlineSeriesKey(symbol, interval);
  }
  const parts = [String(symbol).toUpperCase(), interval, String(limit)];
  if (startTime != null) parts.push(`s${startTime}`);
  if (endTime != null) parts.push(`e${endTime}`);
  return parts.join("|");
}

/**
 * @param {string} key
 * @param {unknown[][]} data
 */
function rememberStale(key, data) {
  if (!Array.isArray(data) || data.length === 0) return;
  staleStore.set(key, { data, storedAt: Date.now() });
  while (staleStore.size > KLINE_CACHE_MAX) {
    const oldest = staleStore.keys().next().value;
    if (oldest === undefined) break;
    staleStore.delete(oldest);
  }
}

/**
 * @param {string} key
 * @returns {unknown[][] | null}
 */
export function getCachedBinanceKlines(key) {
  const data = cache.get(key);
  return Array.isArray(data) ? data : null;
}

/**
 * Fresh series cache, sliced to `limit`.
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @returns {unknown[][] | null}
 */
export function getCachedBinanceKlineSeries(symbol, interval, limit) {
  const key = binanceKlineSeriesKey(symbol, interval);
  const data = getCachedBinanceKlines(key);
  if (!data?.length) return null;
  return data.slice(-Math.min(1000, Math.max(1, limit)));
}

/**
 * Expired-but-recent series for ban / outage fallback.
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @returns {unknown[][] | null}
 */
export function getStaleBinanceKlineSeries(symbol, interval, limit) {
  const key = binanceKlineSeriesKey(symbol, interval);
  const hit = staleStore.get(key);
  if (!hit?.data?.length) return null;
  const maxAge =
    Number.isFinite(STALE_MAX_AGE_MS) && STALE_MAX_AGE_MS > 0
      ? STALE_MAX_AGE_MS
      : 30 * 60 * 1000;
  if (Date.now() - hit.storedAt > maxAge) return null;
  return hit.data.slice(-Math.min(1000, Math.max(1, limit)));
}

/**
 * @param {unknown[][] | null | undefined} a
 * @param {unknown[][]} b
 * @returns {unknown[][]}
 */
function mergeKlineSeries(a, b) {
  /** @type {Map<number, unknown[]>} */
  const byOpen = new Map();
  for (const row of a ?? []) {
    if (Array.isArray(row) && row[0] != null) byOpen.set(Number(row[0]), row);
  }
  for (const row of b) {
    if (Array.isArray(row) && row[0] != null) byOpen.set(Number(row[0]), row);
  }
  return [...byOpen.entries()]
    .sort((x, y) => x[0] - y[0])
    .map(([, row]) => row)
    .slice(-1000);
}

/**
 * @param {string} key
 * @param {unknown[][]} data
 */
export function setCachedBinanceKlines(key, data) {
  if (!Array.isArray(data) || data.length === 0) return;
  const existing = getCachedBinanceKlines(key) ?? staleStore.get(key)?.data;
  const toStore = mergeKlineSeries(existing, data);
  cache.set(key, toStore, getBinanceKlineCacheTtlMs());
  rememberStale(key, toStore);
}

/**
 * @param {string} symbol
 * @param {string} interval
 * @param {unknown[][]} data
 */
export function setCachedBinanceKlineSeries(symbol, interval, data) {
  setCachedBinanceKlines(binanceKlineSeriesKey(symbol, interval), data);
}
