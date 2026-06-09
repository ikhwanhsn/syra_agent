/**
 * Shared refresh cadence for pump.fun alpha agents (radar, scouts).
 * Default: 1 hour. Set 0 to disable schedulers that honor this value.
 */

export const PUMPFUN_AGENTS_REFRESH_MS = Math.min(
  6 * 60 * 60 * 1000,
  Math.max(
    60_000,
    Number.parseInt(process.env.PUMPFUN_AGENTS_REFRESH_MS || String(60 * 60 * 1000), 10),
  ),
);
