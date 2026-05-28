/**
 * LP Real Agent access defaults (no wallet allowlist — any funded agent wallet may enable).
 * Enable/entry gate uses min wallet for one pool slot; targetBankSol is a scale target only.
 * Future: SYRA stake gate for additional wallets.
 */

export const LP_REAL_DEFAULT_TARGET_BANK_SOL = 10;
export const LP_REAL_DEFAULT_MAX_POSITION_SOL = 1;
export const LP_REAL_DEFAULT_MAX_CONCURRENT = 10;
export const LP_REAL_DEFAULT_RESERVE_SOL = 0.05;
/** Minimum SOL per Meteora LP slot when splitting capital. */
export const LP_REAL_DEFAULT_MIN_DEPOSIT_SOL = 0.25;
/** Upper bound per position when capital utilization requires larger slots. */
export const LP_REAL_DEFAULT_MAX_POSITION_CAP_SOL = 5;
/** Max new opens per signal cron tick (broker / RPC safety). */
export const LP_REAL_DEFAULT_MAX_OPENS_PER_TICK = 3;
/** Extra SOL kept liquid for open/close/claim tx fees (on top of reserveSolForFees). */
export const LP_REAL_DEFAULT_FEE_BUFFER_SOL = 0.15;
/** Minimum wallet SOL while positions are open (fees only — capital may be deployed). */
export const LP_REAL_DEFAULT_MIN_WALLET_WHILE_LIVE_SOL = 0.2;

export function getLpRealDefaultTargetBankSol() {
  const n = Number(process.env.LP_AGENT_REAL_MIN_BANK_SOL || LP_REAL_DEFAULT_TARGET_BANK_SOL);
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_TARGET_BANK_SOL;
}

export function getLpRealFeeBufferSol() {
  const n = Number(process.env.LP_AGENT_REAL_FEE_BUFFER_SOL || LP_REAL_DEFAULT_FEE_BUFFER_SOL);
  return Number.isFinite(n) && n >= 0 ? n : LP_REAL_DEFAULT_FEE_BUFFER_SOL;
}

export function getLpRealMinWalletWhileLiveSol() {
  const n = Number(
    process.env.LP_AGENT_REAL_MIN_WALLET_LIVE_SOL || LP_REAL_DEFAULT_MIN_WALLET_WHILE_LIVE_SOL,
  );
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_MIN_WALLET_WHILE_LIVE_SOL;
}

export function getLpRealMinDepositSol() {
  const n = Number(process.env.LP_AGENT_REAL_MIN_DEPOSIT_SOL || LP_REAL_DEFAULT_MIN_DEPOSIT_SOL);
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_MIN_DEPOSIT_SOL;
}

export function getLpRealMaxPositionCapSol() {
  const n = Number(process.env.LP_AGENT_REAL_MAX_POSITION_SOL || LP_REAL_DEFAULT_MAX_POSITION_CAP_SOL);
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_MAX_POSITION_CAP_SOL;
}

export function getLpRealMaxOpensPerTick() {
  const n = Number(process.env.LP_AGENT_REAL_MAX_OPENS_PER_TICK || LP_REAL_DEFAULT_MAX_OPENS_PER_TICK);
  return Number.isFinite(n) && n >= 1 ? Math.min(8, Math.floor(n)) : LP_REAL_DEFAULT_MAX_OPENS_PER_TICK;
}

/** Target fraction of available wallet SOL to deploy across open slots (rest stays as fee dust). */
export function getLpRealCapitalUtilization() {
  const n = Number(process.env.LP_AGENT_REAL_CAPITAL_UTILIZATION || 0.98);
  return Number.isFinite(n) && n > 0.5 && n <= 1 ? n : 0.98;
}
