/**
 * LP Real Agent access defaults (no wallet allowlist — any agent with min bank may enable).
 * Future: SYRA stake gate for additional wallets.
 */

export const LP_REAL_DEFAULT_TARGET_BANK_SOL = 10;
export const LP_REAL_DEFAULT_MAX_POSITION_SOL = 1;
export const LP_REAL_DEFAULT_MAX_CONCURRENT = 10;
export const LP_REAL_DEFAULT_RESERVE_SOL = 0.05;

export function getLpRealDefaultTargetBankSol() {
  const n = Number(process.env.LP_AGENT_REAL_MIN_BANK_SOL || LP_REAL_DEFAULT_TARGET_BANK_SOL);
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_TARGET_BANK_SOL;
}
