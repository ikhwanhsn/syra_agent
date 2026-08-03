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
export const LP_REAL_DEFAULT_MIN_DEPOSIT_SOL = 0.25;
/** Upper bound per position when capital utilization requires larger slots. */
export const LP_REAL_DEFAULT_MAX_POSITION_CAP_SOL = 3;
/** Max new opens per signal cron tick (broker / RPC safety). */
export const LP_REAL_DEFAULT_MAX_OPENS_PER_TICK = 2;
/** Extra SOL kept liquid for open/close/claim tx fees (on top of reserveSolForFees). */
export const LP_REAL_DEFAULT_FEE_BUFFER_SOL = 0.25;
/** Minimum wallet SOL while positions are open (fees only — capital may be deployed). */
export const LP_REAL_DEFAULT_MIN_WALLET_WHILE_LIVE_SOL = 0.25;

/** Real pool screen: minimum TVL (USD). Deeper pools reduce IL / slippage in beta. */
export const LP_REAL_DEFAULT_MIN_TVL_USD = 750_000;
/** Real pool screen: minimum 24h volume (USD). */
export const LP_REAL_DEFAULT_MIN_VOL_24H_USD = 150_000;
/** Real pool screen: max vol/TVL churn ratio — rejects hyper-volatile meme pools. */
export const LP_REAL_DEFAULT_MAX_VOL_TVL_RATIO = 2.5;
/** Real pool screen: max daily fee/TVL ratio — rejects one-off fee spikes. */
export const LP_REAL_DEFAULT_MAX_FEE_TVL_RATIO = 0.02;

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

/** Consecutive closed_loss rows (newest first) before auto-pause opens. */
export const LP_REAL_DEFAULT_MAX_CONSECUTIVE_LOSSES = 4;
/** Session realized drawdown (% of capitalBaselineSol) before auto-pause opens. */
export const LP_REAL_DEFAULT_MAX_SESSION_DRAWDOWN_PCT = 25;
/**
 * Absolute capital-kill floor (% of capitalBaselineSol). Independent of consecutive-loss counting.
 * At or above this drawdown → pause + force-close all open positions.
 */
export const LP_REAL_DEFAULT_ABSOLUTE_KILL_PCT = 20;
/** Max closed_loss on the same pool (per agent, recent window) before blocking re-entry. */
export const LP_REAL_DEFAULT_MAX_POOL_LOSSES_BEFORE_BLOCK = 2;
/** Lookback days for per-pool / per-token loss blocklist. */
export const LP_REAL_DEFAULT_POOL_LOSS_BLOCK_DAYS = 7;
/** Cap modeled peak PnL % used for trailing / TP decisions (guards thin-pool fee math explosions). */
export const LP_REAL_DEFAULT_MAX_MODELED_PEAK_PNL_PCT = 200;
/** Min real closed positions (net-after-cost) before a strategy can take live capital. */
export const LP_REAL_DEFAULT_MIN_REAL_CLOSED_FOR_DEPLOY = 5;
/** Min real win rate on closed positions before a strategy can take live capital. */
export const LP_REAL_DEFAULT_MIN_REAL_WIN_RATE = 0.55;

function envFlagOn(key, defaultOn = true) {
  const raw = (process.env[key] || "").trim().toLowerCase();
  if (!raw) return defaultOn;
  return raw === "true" || raw === "1" || raw === "on" || raw === "yes";
}

export function getLpRealMaxConsecutiveLosses() {
  const n = Number(process.env.LP_AGENT_REAL_MAX_CONSECUTIVE_LOSSES || LP_REAL_DEFAULT_MAX_CONSECUTIVE_LOSSES);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : LP_REAL_DEFAULT_MAX_CONSECUTIVE_LOSSES;
}

export function getLpRealMaxSessionDrawdownPct() {
  const n = Number(
    process.env.LP_AGENT_REAL_MAX_SESSION_DRAWDOWN_PCT || LP_REAL_DEFAULT_MAX_SESSION_DRAWDOWN_PCT,
  );
  return Number.isFinite(n) && n > 0 && n <= 100 ? n : LP_REAL_DEFAULT_MAX_SESSION_DRAWDOWN_PCT;
}

export function getLpRealAbsoluteKillPct() {
  const n = Number(process.env.LP_AGENT_REAL_ABSOLUTE_KILL_PCT || LP_REAL_DEFAULT_ABSOLUTE_KILL_PCT);
  return Number.isFinite(n) && n > 0 && n <= 100 ? n : LP_REAL_DEFAULT_ABSOLUTE_KILL_PCT;
}

export function getLpRealMaxPoolLossesBeforeBlock() {
  const n = Number(
    process.env.LP_AGENT_REAL_MAX_POOL_LOSSES_BEFORE_BLOCK ||
      LP_REAL_DEFAULT_MAX_POOL_LOSSES_BEFORE_BLOCK,
  );
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : LP_REAL_DEFAULT_MAX_POOL_LOSSES_BEFORE_BLOCK;
}

export function getLpRealPoolLossBlockDays() {
  const n = Number(
    process.env.LP_AGENT_REAL_POOL_LOSS_BLOCK_DAYS || LP_REAL_DEFAULT_POOL_LOSS_BLOCK_DAYS,
  );
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : LP_REAL_DEFAULT_POOL_LOSS_BLOCK_DAYS;
}

export function getLpRealMaxModeledPeakPnlPct() {
  const n = Number(
    process.env.LP_AGENT_REAL_MAX_MODELED_PEAK_PNL_PCT || LP_REAL_DEFAULT_MAX_MODELED_PEAK_PNL_PCT,
  );
  return Number.isFinite(n) && n > 0 ? n : LP_REAL_DEFAULT_MAX_MODELED_PEAK_PNL_PCT;
}

export function getLpRealMinRealClosedForDeploy() {
  const n = Number(
    process.env.LP_AGENT_REAL_MIN_REAL_CLOSED || LP_REAL_DEFAULT_MIN_REAL_CLOSED_FOR_DEPLOY,
  );
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : LP_REAL_DEFAULT_MIN_REAL_CLOSED_FOR_DEPLOY;
}

export function getLpRealMinRealWinRate() {
  const n = Number(process.env.LP_AGENT_REAL_MIN_REAL_WIN_RATE || LP_REAL_DEFAULT_MIN_REAL_WIN_RATE);
  return Number.isFinite(n) && n > 0 && n <= 1 ? n : LP_REAL_DEFAULT_MIN_REAL_WIN_RATE;
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

/**
 * Explicit env override for the open-signal cron.
 * - unset → null (caller falls back to LP_AGENT_REAL.enabled in settlement.js)
 * - true/1/on/yes → force on
 * - false/0/off/no → force off (kill-switch without redeploy)
 */
export function getLpRealCronEnabledOverride() {
  const raw = (process.env.LP_AGENT_REAL_ENABLED || "").trim().toLowerCase();
  if (!raw) return null;
  if (raw === "true" || raw === "1" || raw === "on" || raw === "yes") return true;
  if (raw === "false" || raw === "0" || raw === "off" || raw === "no") return false;
  return null;
}

/**
 * @deprecated Prefer getLpRealCronEnabledOverride() + isRealCronEnabled().
 * Kept for callers that treated unset as "off".
 */
export function getLpRealCronEnabled() {
  const override = getLpRealCronEnabledOverride();
  return override == null ? false : override;
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
