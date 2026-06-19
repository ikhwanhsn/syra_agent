/**
 * Shared in-memory cache for Binance REST klines (used by /signal and related paths).
 */

const DEFAULT_TTL_MS = Number.parseInt(process.env.BINANCE_KLINE_CACHE_TTL_MS || "120000", 10);

/** @type {Map<string, { data: unknown[][]; expiresAt: number }>} */
const cache = new Map();

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
 * @returns {number}
 */
export function getBinanceKlineCacheTtlMs() {
  return Number.isFinite(DEFAULT_TTL_MS) && DEFAULT_TTL_MS > 0 ? DEFAULT_TTL_MS : 120_000;
}

/**
 * @param {string} key
 * @returns {unknown[][] | null}
 */
export function getCachedBinanceKlines(key) {
  const entry = cache.get(key);
  if (!entry || Date.now() >= entry.expiresAt) return null;
  return entry.data;
}

/**
 * @param {string} key
 * @param {unknown[][]} data
 */
export function setCachedBinanceKlines(key, data) {
  if (!Array.isArray(data) || data.length === 0) return;
  cache.set(key, { data, expiresAt: Date.now() + getBinanceKlineCacheTtlMs() });
}
