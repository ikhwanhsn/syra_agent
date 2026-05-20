/**
 * Paper USD ledger for standard trading experiment lab agents (per suite + agentId).
 * User-custom wallet strategies are excluded.
 */
export const TRADING_EXPERIMENT_STARTING_USD = 1000;
export const TRADING_EXPERIMENT_TRADE_NOTIONAL_USD = 100;
/** Cull lab agents when equity falls to or below this (–10% from starting bank). */
export const TRADING_EXPERIMENT_CULL_EQUITY_USD = TRADING_EXPERIMENT_STARTING_USD * 0.9;
/** New agents spawned per suite per daily evolution tick. */
export const TRADING_EXPERIMENT_DAILY_SPAWN_COUNT = 15;
/** Max lab agents per suite (static 0–14 + dynamic overrides). */
export const TRADING_EXPERIMENT_MAX_AGENTS = 1000;
/** Highest allowed lab agentId (inclusive). */
export const TRADING_EXPERIMENT_MAX_AGENT_ID = 999;
/** Static base roster size per suite (ids 0–14). */
export const TRADING_EXPERIMENT_STATIC_AGENT_COUNT = 15;

/**
 * @param {unknown} cashUsd
 * @param {number} openPositions
 * @returns {number}
 */
export function computeAgentEquityUsd(cashUsd, openPositions) {
  const cash =
    Math.round((Number.isFinite(Number(cashUsd)) ? Number(cashUsd) : TRADING_EXPERIMENT_STARTING_USD) * 100) /
    100;
  const deployed = openPositions * TRADING_EXPERIMENT_TRADE_NOTIONAL_USD;
  return Math.round((cash + deployed + Number.EPSILON) * 100) / 100;
}
