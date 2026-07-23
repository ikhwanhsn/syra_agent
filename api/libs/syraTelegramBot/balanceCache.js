/**
 * Short-TTL in-memory cache for Telegram wallet balance reads.
 */

const DEFAULT_TTL_MS = 10_000;

/**
 * @typedef {{
 *   usdcBalance: number;
 *   solBalance: number;
 *   agentAddress: string;
 *   custody?: string;
 * }} CachedBalances
 */

/** @type {Map<string, { expiresAt: number; value: CachedBalances }>} */
const cache = new Map();

/**
 * @param {string} key
 * @returns {CachedBalances | null}
 */
export function getCachedBalances(key) {
  const k = String(key || '').trim();
  if (!k) return null;
  const hit = cache.get(k);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(k);
    return null;
  }
  return hit.value;
}

/**
 * @param {string} key
 * @param {CachedBalances} value
 * @param {number} [ttlMs]
 */
export function setCachedBalances(key, value, ttlMs = DEFAULT_TTL_MS) {
  const k = String(key || '').trim();
  if (!k || !value) return;
  cache.set(k, {
    expiresAt: Date.now() + Math.max(1_000, ttlMs),
    value,
  });
}

/**
 * Invalidate by anonymousId and/or wallet address.
 * @param {string} [anonymousId]
 * @param {string} [agentAddress]
 */
export function invalidateBalanceCache(anonymousId, agentAddress) {
  const id = String(anonymousId || '').trim();
  const addr = String(agentAddress || '').trim();
  if (id) cache.delete(id);
  if (addr) cache.delete(addr);
}

/**
 * Test helper.
 */
export function resetBalanceCacheForTests() {
  cache.clear();
}

export { DEFAULT_TTL_MS as BALANCE_CACHE_TTL_MS };
