/**
 * Alpha X batch (dashboard watchlist) — DB-backed snapshot refreshed by agent/cron.
 */

/** Default feed served on Alpha X tab and dashboard overview. */
export const ALPHA_X_DEFAULT_TYPE = "x402";

export const ALPHA_X_DEFAULT_MAX_RESULTS = 20;

export const ALPHA_X_DEFAULT_INCLUDE_AI_SUMMARY = false;

/** How often the batch pipeline re-scores all handles (default 24h). Set 0 to disable in-process scheduler. */
export const ALPHA_X_BATCH_CRON_MS = Math.min(
  7 * 24 * 60 * 60 * 1000,
  Math.max(
    60_000,
    Number.parseInt(
      process.env.ALPHA_X_BATCH_CRON_MS || String(24 * 60 * 60 * 1000),
      10,
    ),
  ),
);
