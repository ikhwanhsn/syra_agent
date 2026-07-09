/**
 * SYRA buyback scheduler — batch x402 revenue into a single Jupiter swap every 24h.
 */

export const BUYBACK_SCHEDULER_CRON_SECRET_ENV = "BUYBACK_CRON_SECRET";

const DEFAULT_CRON_MS = 24 * 60 * 60 * 1000;

/** In-process interval (default 24h). Set 0 to disable scheduler (use external cron only). */
export const BUYBACK_SCHEDULER_CRON_MS = Math.max(
  0,
  Number.parseInt(
    process.env.BUYBACK_CRON_MS || String(DEFAULT_CRON_MS),
    10,
  ) || DEFAULT_CRON_MS,
);

export const BUYBACK_ACCUMULATOR_ID = "singleton";
