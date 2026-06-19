/**
 * Simple in-memory TTL cache for live x402 scout endpoints.
 */

/** @type {Map<string, { at: number; value: unknown }>} */
const store = new Map();

const DEFAULT_TTL_MS = 60_000;

/**
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} fn
 * @param {number} [ttlMs]
 * @returns {Promise<T>}
 */
export async function withScoutCache(key, fn, ttlMs = DEFAULT_TTL_MS) {
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttlMs) {
    return /** @type {T} */ (hit.value);
  }
  const value = await fn();
  store.set(key, { at: Date.now(), value });
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
