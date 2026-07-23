/**
 * Shared helpers for Earn Yield product adapters.
 */
import { buildSettlementHealth } from "../settlementHealthService.js";
import {
  isEarnYieldBetaAllowed,
  isEarnYieldBetaOpen,
} from "../../config/earnProducts.js";
import { isAdminWalletAddress } from "../adminWallet.js";

export function round(n, d = 4) {
  const x = Number(n);
  if (!Number.isFinite(x)) return 0;
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

export function roundPct(n) {
  return round(Number(n) * 100, 2);
}

/**
 * Standard settlement health windows (Solana-scoped for all current products).
 */
export async function fetchSolanaSettlementWindows() {
  const [settlement1h, settlement24h] = await Promise.all([
    buildSettlementHealth(new Date(Date.now() - 60 * 60 * 1000), {
      networkRegex: /^solana/i,
    }).catch(() => null),
    buildSettlementHealth(new Date(Date.now() - 24 * 60 * 60 * 1000), {
      networkRegex: /^solana/i,
    }).catch(() => null),
  ]);
  return { settlement1h, settlement24h };
}

/**
 * Build readiness from normalized stats + product guard config.
 *
 * @param {object} stats - from adapter getStats()
 * @param {import('../../config/earnProducts.js').EarnProductDef} product
 * @param {{
 *   netPositive: boolean;
 *   errorRateForGuards: number;
 *   sampleOk: boolean;
 *   errorKill: boolean;
 *   settlement1h?: object|null;
 *   settlement24h?: object|null;
 *   extraBlockers?: string[];
 * }} opts
 */
export function buildReadinessFromGuards(stats, product, opts) {
  const {
    netPositive,
    errorRateForGuards,
    sampleOk,
    errorKill,
    settlement1h = null,
    settlement24h = null,
    extraBlockers = [],
  } = opts;

  const errorOk = !sampleOk || errorRateForGuards <= product.maxErrorRate;

  const settleWindow =
    (settlement1h?.settleAttempted ?? 0) >= product.minSample
      ? settlement1h
      : settlement24h || settlement1h;
  const settleAttempted = settleWindow?.settleAttempted ?? 0;
  const settleOk =
    settleAttempted < product.minSample ||
    (settleWindow?.settleSuccessRate ?? 1) >= product.minSettleSuccessRate;

  const ready = errorOk && netPositive && settleOk && !errorKill && extraBlockers.length === 0;
  const blockers = [...extraBlockers];
  if (!netPositive) blockers.push("realized_net_pnl_not_positive");
  if (!errorOk) {
    blockers.push(
      `error_rate_${roundPct(errorRateForGuards)}pct_above_${roundPct(product.maxErrorRate)}pct`,
    );
  }
  if (errorKill) blockers.push("error_rate_kill_threshold");
  if (!settleOk) {
    blockers.push(
      `solana_settlement_success_${roundPct(settleWindow?.settleSuccessRate ?? 0)}pct_below_${roundPct(product.minSettleSuccessRate)}pct`,
    );
  }

  return {
    ready,
    blockers,
    guards: {
      maxErrorRate: product.maxErrorRate,
      killErrorRate: product.killErrorRate,
      minSettleSuccessRate: product.minSettleSuccessRate,
      minSample: product.minSample,
      settlementNetworkScope: "solana",
      denom: product.denom,
    },
    stats,
    settlement1h: settlement1h
      ? {
          settleSuccessRate: settlement1h.settleSuccessRate,
          settleAttempted: settlement1h.settleAttempted,
          meetsLaunchGuardrail: settlement1h.meetsLaunchGuardrail,
          networkScope: "solana",
        }
      : null,
    settlement24hSolana: settlement24h
      ? {
          settleSuccessRate: settlement24h.settleSuccessRate,
          settleAttempted: settlement24h.settleAttempted,
          meetsLaunchGuardrail: settlement24h.meetsLaunchGuardrail,
        }
      : null,
    depositsShouldPause: errorKill || !netPositive,
  };
}

/**
 * Clamp deposit cap to product min/max.
 * @param {import('../../config/earnProducts.js').EarnProductDef} product
 * @param {number|undefined|null} requested
 */
export function clampDepositCap(product, requested) {
  const n = Number(requested);
  const fallback = product.maxDeposit;
  const raw = Number.isFinite(n) ? n : fallback;
  return Math.min(product.maxDeposit, Math.max(product.minDeposit, raw));
}

/**
 * Beta allow check for enable paths.
 * @param {string|null|undefined} ownerWallet
 * @param {string|null|undefined} anonymousId
 */
export function assertBetaAllowed(ownerWallet, anonymousId) {
  const isAdmin = isAdminWalletAddress(ownerWallet);
  if (
    !isEarnYieldBetaAllowed(ownerWallet, { isAdmin }) &&
    !isEarnYieldBetaAllowed(anonymousId, { isAdmin })
  ) {
    const err = new Error("earn_yield_beta_not_allowed");
    err.code = "earn_yield_beta_not_allowed";
    throw err;
  }
  return { isAdmin, betaOpen: isEarnYieldBetaOpen() };
}

/**
 * Throw if deposits paused / not ready.
 * @param {{ depositsShouldPause?: boolean; ready?: boolean; blockers?: string[] }} readiness
 */
export function assertDepositsOpen(readiness) {
  if (readiness.depositsShouldPause || !readiness.ready) {
    const err = new Error(
      `earn_yield_deposits_paused:${(readiness.blockers || []).join(",") || "not_ready"}`,
    );
    err.code = "earn_yield_deposits_paused";
    err.blockers = readiness.blockers;
    throw err;
  }
}

/**
 * Format settlement24h slice for stats payloads.
 * @param {object|null} settlement
 */
export function settlementSlice(settlement) {
  if (!settlement) return null;
  return {
    settleSuccessRate: settlement.settleSuccessRate,
    settleFailRate: settlement.settleFailRate,
    settleAttempted: settlement.settleAttempted,
    meetsLaunchGuardrail: settlement.meetsLaunchGuardrail,
  };
}
