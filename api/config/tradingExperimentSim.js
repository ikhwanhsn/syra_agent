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

/** @param {number} n */
export function roundUsd(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Paper equity = starting bank + realized P/L from closed runs (open capital is cost-basis in deployed).
 * @param {number} realizedPnlUsd
 * @returns {number}
 */
export function computeAgentEquityFromRealizedPnl(realizedPnlUsd) {
  const pnl = Number.isFinite(realizedPnlUsd) ? realizedPnlUsd : 0;
  return roundUsd(TRADING_EXPERIMENT_STARTING_USD + pnl);
}

/**
 * Total return vs starting bank (%). Null when inputs are invalid.
 * @param {number} equityUsd
 * @param {number} [startingBankUsd]
 * @returns {number | null}
 */
export function computeAgentReturnPct(equityUsd, startingBankUsd = TRADING_EXPERIMENT_STARTING_USD) {
  if (!Number.isFinite(equityUsd) || !(startingBankUsd > 0)) return null;
  return roundUsd((equityUsd / startingBankUsd - 1) * 100);
}

/**
 * Free cash = equity minus notional reserved in open positions.
 * @param {number} equityUsd
 * @param {number} deployedUsd
 * @returns {number}
 */
export function computeAgentCashFromEquity(equityUsd, deployedUsd) {
  return roundUsd(equityUsd - deployedUsd);
}

/**
 * @param {unknown} cashUsd
 * @param {number} openPositions
 * @param {number} [deployedUsd] — when set, used instead of openPositions × default notional
 * @returns {number}
 */
export function computeAgentEquityUsd(cashUsd, openPositions, deployedUsd) {
  const cash =
    roundUsd(Number.isFinite(Number(cashUsd)) ? Number(cashUsd) : TRADING_EXPERIMENT_STARTING_USD);
  const deployed =
    deployedUsd != null && Number.isFinite(deployedUsd)
      ? roundUsd(deployedUsd)
      : openPositions * TRADING_EXPERIMENT_TRADE_NOTIONAL_USD;
  return roundUsd(cash + deployed);
}
