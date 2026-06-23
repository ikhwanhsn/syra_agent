/**
 * Simple in-memory TTL cache for live x402 scout endpoints.
 */
import { createBoundedTtlCache } from "../utils/boundedTtlCache.js";

const DEFAULT_TTL_MS = 60_000;
const SCOUT_CACHE_MAX = Math.min(
  2000,
  Math.max(64, Number.parseInt(process.env.SCOUT_CACHE_MAX_ENTRIES ?? "300", 10) || 300),
);

const store = createBoundedTtlCache({
  name: "scout",
  maxEntries: SCOUT_CACHE_MAX,
  defaultTtlMs: DEFAULT_TTL_MS,
});

/**
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} fn
 * @param {number} [ttlMs]
 * @returns {Promise<T>}
 */
export async function withScoutCache(key, fn, ttlMs = DEFAULT_TTL_MS) {
  const hit = store.get(key);
  if (hit !== null) {
    return /** @type {T} */ (hit);
  }
  const value = await fn();
  store.set(key, value, ttlMs);
  return value;
}

/**
 * @param {unknown} v
 * @param {number} lo
 * @param {number} hi
 * @param {number} fallback
 */
export function clampInt(v, lo, hi, fallback) {
  const n = Number.parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, n));
}

/**
 * @param {unknown} v
 */
export function parseBool(v) {
  if (v === true || v === "true" || v === "1") return true;
  if (v === false || v === "false" || v === "0") return false;
  return false;
}
