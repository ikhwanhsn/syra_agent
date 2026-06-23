/**
 * Long-running API memory hygiene: periodic cache sweep + heap pressure warnings.
 */
import { startGlobalCacheSweep, sweepAllRegisteredCaches } from "./boundedTtlCache.js";

const DEFAULT_MONITOR_MS = 60_000;
const DEFAULT_WARN_HEAP_MB = 1200;

function heapUsedMb() {
  return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
}

/**
 * Start global cache sweeps and optional heap monitoring.
 * Call once during API boot.
 */
export function startMemoryHygiene() {
  startGlobalCacheSweep();

  if (process.env.API_MEMORY_MONITOR === "0") return;

  const rawInterval = Number.parseInt(process.env.API_MEMORY_MONITOR_MS ?? "", 10);
  const intervalMs =
    Number.isFinite(rawInterval) && rawInterval >= 15_000 ? rawInterval : DEFAULT_MONITOR_MS;

  const rawWarn = Number.parseInt(process.env.API_MEMORY_WARN_HEAP_MB ?? "", 10);
  const warnHeapMb =
    Number.isFinite(rawWarn) && rawWarn >= 256 ? rawWarn : DEFAULT_WARN_HEAP_MB;

  const id = setInterval(() => {
    const usedMb = heapUsedMb();
    if (usedMb < warnHeapMb) return;

    const evicted = sweepAllRegisteredCaches();
    console.warn(
      `[memory] heap ${usedMb}MB >= ${warnHeapMb}MB — swept caches (evicted ~${evicted} entries, heap now ${heapUsedMb()}MB)`,
    );
  }, intervalMs);
  id.unref?.();
}
