/**
 * Shared in-memory cache for Binance REST klines (used by /signal and related paths).
 */
import { createBoundedTtlCache } from "../utils/boundedTtlCache.js";

const DEFAULT_TTL_MS = Number.parseInt(process.env.BINANCE_KLINE_CACHE_TTL_MS || "120000", 10);
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

/**
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @param {number} [startTime]
 * @param {number} [endTime]
 * @returns {string}
 */
export function binanceKlineCacheKey(symbol, interval, limit, startTime, endTime) {
  const parts = [symbol, interval, String(limit)];
  if (startTime != null) parts.push(`s${startTime}`);
  if (endTime != null) parts.push(`e${endTime}`);
  return parts.join("|");
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
 * @param {string} key
 * @param {unknown[][]} data
 */
export function setCachedBinanceKlines(key, data) {
  if (!Array.isArray(data) || data.length === 0) return;
  cache.set(key, data, getBinanceKlineCacheTtlMs());
}
