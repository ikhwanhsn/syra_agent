/**
 * Bounded in-memory TTL cache with periodic sweep and FIFO eviction.
 * Prevents unbounded Map growth (a common cause of Node heap OOM on long-running API processes).
 */

const DEFAULT_SWEEP_MS = 60_000;

/** @type {Set<{ name: string; sweep: () => void; size: () => number }>} */
const registry = new Set();

/**
 * @param {{ name: string; sweep: () => void; size: () => number }} cache
 */
export function registerCacheForSweep(cache) {
  registry.add(cache);
}

export function sweepAllRegisteredCaches() {
  let total = 0;
  for (const cache of registry) {
    try {
      const before = cache.size();
      cache.sweep();
      total += Math.max(0, before - cache.size());
    } catch {
      /* ignore per-cache sweep errors */
    }
  }
  return total;
}

/**
 * @param {number} [intervalMs]
 */
export function startGlobalCacheSweep(intervalMs = DEFAULT_SWEEP_MS) {
  const raw = Number.parseInt(process.env.API_CACHE_SWEEP_MS ?? "", 10);
  const ms = Number.isFinite(raw) && raw >= 15_000 ? raw : intervalMs;
  const id = setInterval(() => sweepAllRegisteredCaches(), ms);
  id.unref?.();
  return id;
}

/**
 * @param {{
 *   name?: string;
 *   maxEntries?: number;
 *   defaultTtlMs?: number;
 *   sweepIntervalMs?: number;
 * }} [options]
 */
export function createBoundedTtlCache(options = {}) {
  const name = options.name ?? "cache";
  const maxEntries =
    options.maxEntries != null
      ? Math.max(8, options.maxEntries)
      : 500;
  const defaultTtlMs = Math.max(1_000, options.defaultTtlMs ?? 60_000);
  const sweepIntervalMs = options.sweepIntervalMs ?? DEFAULT_SWEEP_MS;

  /** @type {Map<string, { value: unknown; expiresAt: number }>} */
  const store = new Map();

  function sweep() {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.expiresAt) store.delete(key);
    }
    while (store.size > maxEntries) {
      const oldest = store.keys().next().value;
      if (oldest === undefined) break;
      store.delete(oldest);
    }
  }

  /**
   * @param {string} key
   * @returns {unknown | null}
   */
  function get(key) {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() >= entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * @param {string} key
   * @param {unknown} value
   * @param {number} [ttlMs]
   */
  function set(key, value, ttlMs = defaultTtlMs) {
    if (store.size >= maxEntries && !store.has(key)) {
      sweep();
      while (store.size >= maxEntries) {
        const oldest = store.keys().next().value;
        if (oldest === undefined) break;
        store.delete(oldest);
      }
    }
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /**
   * @param {string} key
   */
  function del(key) {
    store.delete(key);
  }

  const handle = { name, get, set, del, sweep, size: () => store.size };
  registerCacheForSweep(handle);

  if (sweepIntervalMs > 0) {
    const id = setInterval(sweep, sweepIntervalMs);
    id.unref?.();
  }

  return handle;
}
