/**
 * Pump.fun Utility Scout — tech / real-utility project discovery.
 */

import { PUMPFUN_AGENTS_REFRESH_MS } from "./pumpfunAgentsRefreshConfig.js";

export const PUMPFUN_UTILITY_SCOUT_DB_ID = "pumpfun-utility-scout:latest";

/** Scheduler interval (default 1h, shared with other pump.fun agents). Set 0 to disable. */
export const PUMPFUN_UTILITY_SCOUT_CRON_MS = PUMPFUN_AGENTS_REFRESH_MS;

export const PUMPFUN_UTILITY_SCOUT_HISTORY_MAX = Math.min(
  150,
  Math.max(20, Number.parseInt(process.env.PUMPFUN_UTILITY_SCOUT_HISTORY_MAX || "60", 10)),
);

export const PUMPFUN_UTILITY_SCOUT_CANDIDATE_TOP_N = Math.min(
  20,
  Math.max(6, Number.parseInt(process.env.PUMPFUN_UTILITY_SCOUT_CANDIDATE_TOP_N || "14", 10)),
);

export const PUMPFUN_UTILITY_SCOUT_MIN_SCORE = Math.min(
  90,
  Math.max(30, Number.parseInt(process.env.PUMPFUN_UTILITY_SCOUT_MIN_SCORE || "48", 10)),
);
