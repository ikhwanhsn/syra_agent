/**
 * Pump.fun Alpha Scout — learns from past alpha runners to predict new ones.
 */

import { PUMPFUN_AGENTS_REFRESH_MS } from "./pumpfunAgentsRefreshConfig.js";

export const PUMPFUN_ALPHA_SCOUT_DB_ID = "pumpfun-alpha-scout:latest";

/** Scheduler interval (default 1h, shared with other pump.fun agents). Set 0 to disable. */
export const PUMPFUN_ALPHA_SCOUT_CRON_MS = PUMPFUN_AGENTS_REFRESH_MS;

/** Max past alpha records kept for learning. */
export const PUMPFUN_ALPHA_SCOUT_HISTORY_MAX = Math.min(
  200,
  Math.max(20, Number.parseInt(process.env.PUMPFUN_ALPHA_SCOUT_HISTORY_MAX || "80", 10)),
);

/** Top N learned-fit candidates sent to LLM. */
export const PUMPFUN_ALPHA_SCOUT_PREDICT_TOP_N = Math.min(
  16,
  Math.max(4, Number.parseInt(process.env.PUMPFUN_ALPHA_SCOUT_PREDICT_TOP_N || "10", 10)),
);

/** Minimum learned-fit score to surface a prediction. */
export const PUMPFUN_ALPHA_SCOUT_MIN_LEARNED_SCORE = Math.min(
  90,
  Math.max(35, Number.parseInt(process.env.PUMPFUN_ALPHA_SCOUT_MIN_LEARNED_SCORE || "52", 10)),
);
