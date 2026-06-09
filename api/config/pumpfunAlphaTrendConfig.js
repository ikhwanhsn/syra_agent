/**
 * Pump.fun Alpha / Beta Play Radar — persisted snapshots per period + mode.
 */

import { PUMPFUN_AGENTS_REFRESH_MS } from "./pumpfunAgentsRefreshConfig.js";

export const PUMPFUN_ALPHA_TREND_CRON_MS = PUMPFUN_AGENTS_REFRESH_MS;

export const PUMPFUN_ALPHA_TREND_PERIODS = ["today", "week", "month"];

export const PUMPFUN_ALPHA_TREND_MODES = ["trend", "experiment"];

/**
 * @param {string} period
 * @param {string} [mode]
 */
export function pumpfunAlphaTrendDbId(period, mode = "trend") {
  return `pumpfun-alpha-trend:${String(period).trim().toLowerCase()}:${String(mode).trim().toLowerCase()}`;
}
