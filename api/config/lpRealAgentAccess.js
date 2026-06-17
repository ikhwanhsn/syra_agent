/**
 * LP Real Agent access defaults (no wallet allowlist — any funded agent wallet may enable).
 * Enable/entry gate uses min wallet for one pool slot; targetBankSol is a scale target only.
 * Future: SYRA stake gate for additional wallets.
 */

export const LP_REAL_DEFAULT_TARGET_BANK_SOL = 10;
export const LP_REAL_DEFAULT_MAX_POSITION_SOL = 1;
/** Fewer concurrent slots — concentrate capital in high-quality positions. */
export const LP_REAL_DEFAULT_MAX_CONCURRENT = 6;
export const LP_REAL_DEFAULT_RESERVE_SOL = 0.1;
/** Minimum SOL per Meteora LP slot when splitting capital. */
export const LP_REAL_DEFAULT_MIN_DEPOSIT_SOL = 0.4;
/** Upper bound per position when capital utilization requires larger slots. */
export const LP_REAL_DEFAULT_MAX_POSITION_CAP_SOL = 3;
/** Max new opens per signal cron tick (broker / RPC safety). */
export const LP_REAL_DEFAULT_MAX_OPENS_PER_TICK = 2;
/** Extra SOL kept liquid for open/close/claim tx fees (on top of reserveSolForFees). */
export const LP_REAL_DEFAULT_FEE_BUFFER_SOL = 0.25;
/** Minimum wallet SOL while positions are open (fees only — capital may be deployed). */
export const LP_REAL_DEFAULT_MIN_WALLET_WHILE_LIVE_SOL = 0.25;

/** Real pool screen: minimum TVL (USD). */
export const LP_REAL_DEFAULT_MIN_TVL_USD = 250_000;
/** Real pool screen: minimum 24h volume (USD). */
export const LP_REAL_DEFAULT_MIN_VOL_24H_USD = 150_000;
/** Real pool screen: max vol/TVL churn ratio — rejects hyper-volatile meme pools. */
export const LP_REAL_DEFAULT_MAX_VOL_TVL_RATIO = 8;
/** Real pool screen: max daily fee/TVL ratio — rejects one-off fee spikes. */
export const LP_REAL_DEFAULT_MAX_FEE_TVL_RATIO = 0.05;

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
  const n = Number(process.env.LP_AGENT_REAL_CAPITAL_UTILIZATION || 0.92);
  return Number.isFinite(n) && n > 0.5 && n <= 1 ? n : 0.92;
}

export function getLpRealMinTvlUsd() {
  const n = Number(process.env.LP_AGENT_REAL_MIN_TVL_USD || LP_REAL_DEFAULT_MIN_TVL_USD);
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_MIN_TVL_USD;
}

export function getLpRealMinVol24hUsd() {
  const n = Number(process.env.LP_AGENT_REAL_MIN_VOL_24H_USD || LP_REAL_DEFAULT_MIN_VOL_24H_USD);
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_MIN_VOL_24H_USD;
}

export function getLpRealMaxVolTvlRatio() {
  const n = Number(process.env.LP_AGENT_REAL_MAX_VOL_TVL_RATIO || LP_REAL_DEFAULT_MAX_VOL_TVL_RATIO);
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_MAX_VOL_TVL_RATIO;
}

export function getLpRealMaxFeeTvlRatio() {
  const n = Number(process.env.LP_AGENT_REAL_MAX_FEE_TVL_RATIO || LP_REAL_DEFAULT_MAX_FEE_TVL_RATIO);
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_MAX_FEE_TVL_RATIO;
}

/** Meridian-style token safety defaults (mirrors Agent Meridian user-config). */
export const LP_REAL_DEFAULT_MIN_HOLDERS = 500;
export const LP_REAL_DEFAULT_MAX_TOP10_PCT = 60;
export const LP_REAL_DEFAULT_MAX_BOT_HOLDERS_PCT = 30;
export const LP_REAL_DEFAULT_MIN_MCAP_USD = 150_000;
export const LP_REAL_DEFAULT_MAX_MCAP_USD = 10_000_000;

function envFlagOn(key, defaultOn = true) {
  const raw = (process.env[key] || "").trim().toLowerCase();
  if (!raw) return defaultOn;
  return raw === "true" || raw === "1" || raw === "on" || raw === "yes";
}

/** Use real on-chain/API signals instead of synthetic derivePoolSignals (default on). */
export function getLpRealUseRealSignals() {
  return envFlagOn("LP_AGENT_REAL_USE_REAL_SIGNALS", true);
}

/** Stricter exit discipline: real fees for TP, faster OOR, on-chain value stop (default on). */
export function getLpRealStrictExits() {
  return envFlagOn("LP_AGENT_REAL_STRICT_EXITS", true);
}

/** Dry-run: run screening/decisions but skip on-chain open/close (default off). */
export function getLpRealDryRun() {
  return envFlagOn("LP_AGENT_REAL_DRY_RUN", false);
}

export function getLpRealMinHolders() {
  const n = Number(process.env.LP_AGENT_REAL_MIN_HOLDERS || LP_REAL_DEFAULT_MIN_HOLDERS);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : LP_REAL_DEFAULT_MIN_HOLDERS;
}

export function getLpRealMaxTop10Pct() {
  const n = Number(process.env.LP_AGENT_REAL_MAX_TOP10_PCT || LP_REAL_DEFAULT_MAX_TOP10_PCT);
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_MAX_TOP10_PCT;
}

export function getLpRealMaxBotHoldersPct() {
  const n = Number(process.env.LP_AGENT_REAL_MAX_BOT_HOLDERS_PCT || LP_REAL_DEFAULT_MAX_BOT_HOLDERS_PCT);
  return Number.isFinite(n) && n >= 0 ? n : LP_REAL_DEFAULT_MAX_BOT_HOLDERS_PCT;
}

export function getLpRealMinMcapUsd() {
  const n = Number(process.env.LP_AGENT_REAL_MIN_MCAP_USD || LP_REAL_DEFAULT_MIN_MCAP_USD);
  return Number.isFinite(n) && n >= 0 ? n : LP_REAL_DEFAULT_MIN_MCAP_USD;
}

export function getLpRealMaxMcapUsd() {
  const n = Number(process.env.LP_AGENT_REAL_MAX_MCAP_USD || LP_REAL_DEFAULT_MAX_MCAP_USD);
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_MAX_MCAP_USD;
}

export function getLpRealBlockedLaunchpads() {
  const raw = (process.env.LP_AGENT_REAL_BLOCKED_LAUNCHPADS || "").trim();
  if (!raw) return [];
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/** Min sim runs that pass real pool screen before strategy can deploy live capital. */
export function getLpRealMinValidatedSimRuns() {
  const n = Number(process.env.LP_AGENT_REAL_MIN_REAL_VALIDATED || 3);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 3;
}

/** Real evolution: min closed positions before threshold nudge. */
export function getLpRealEvolutionMinClosed() {
  const n = Number(process.env.LP_AGENT_REAL_EVOLUTION_MIN_CLOSED || 10);
  return Number.isFinite(n) && n >= 5 ? Math.floor(n) : 10;
}

export function getLpRealSafetyThresholds() {
  return {
    useRealSignals: getLpRealUseRealSignals(),
    strictExits: getLpRealStrictExits(),
    dryRun: getLpRealDryRun(),
    minHolders: getLpRealMinHolders(),
    maxTop10Pct: getLpRealMaxTop10Pct(),
    maxBotHoldersPct: getLpRealMaxBotHoldersPct(),
    minMcapUsd: getLpRealMinMcapUsd(),
    maxMcapUsd: getLpRealMaxMcapUsd(),
    blockedLaunchpads: getLpRealBlockedLaunchpads(),
    minValidatedSimRuns: getLpRealMinValidatedSimRuns(),
  };
}
