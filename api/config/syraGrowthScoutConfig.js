/**
 * Syra Growth Scout — user acquisition + TVL growth recommendations.
 */

export const SYRA_GROWTH_SCOUT_DB_ID = "syra-growth-scout-latest";

export const SYRA_GROWTH_SCOUT_CRON_SECRET_ENV = "SYRA_GROWTH_SCOUT_CRON_SECRET";

/** Daily run — 30 minutes after Trend Scout (06:00 WIB). */
export const SYRA_GROWTH_SCOUT_WIB_HOUR = 6;
export const SYRA_GROWTH_SCOUT_WIB_MINUTE = 30;

/** X search cache TTL (ms) — one search per query per run window. */
export const GROWTH_SCOUT_X_CACHE_MS = 6 * 60 * 60 * 1000;
