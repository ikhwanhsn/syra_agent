/**
 * Shared Sentinel storage and dashboard for audit data.
 * Use the same storage in wrapWithSentinel so SentinelDashboard can query it.
 * @see https://sentinel.valeocash.com/docs/dashboard/overview
 */
import { MemoryStorage } from "@x402sentinel/x402";
import { SentinelDashboard } from "@x402sentinel/x402/dashboard";

const DEFAULT_MAX_RECORDS = 50_000;

let sharedStorage = null;
let dashboardInstance = null;

/**
 * Get the singleton StorageBackend used by all Sentinel-wrapped fetches.
 * Pass this to wrapWithSentinel via audit: { storage: getSentinelStorage() }.
 * @param {{ maxRecords?: number }} [opts] - Optional. maxRecords for MemoryStorage (default 50000).
 * @returns {import("@x402sentinel/x402").StorageBackend}
 */
export function getSentinelStorage(opts = {}) {
  if (!sharedStorage) {
    const envMax = Number(process.env.SENTINEL_STORAGE_MAX_RECORDS);
    const maxRecords = opts.maxRecords ?? (Number.isFinite(envMax) ? envMax : DEFAULT_MAX_RECORDS);
    sharedStorage = new MemoryStorage(maxRecords);
  }
  return sharedStorage;
}

/**
 * Get the SentinelDashboard instance that queries the shared storage.
 * Use for getSpend(), getAgents(), getAlerts().
 * @returns {import("@x402sentinel/x402/dashboard").SentinelDashboard}
 */
export function getSentinelDashboard() {
  if (!dashboardInstance) {
    dashboardInstance = new SentinelDashboard({
      storage: getSentinelStorage(),
    });
  }
  return dashboardInstance;
}
