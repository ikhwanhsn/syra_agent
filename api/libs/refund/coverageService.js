/**
 * Hosted Refund-as-a-Service: allowlist, SSRF, caps, classify, executeRefund.
 * Server observes the upstream outcome (relay or re-probe). Client reports are not trusted.
 */
import { isIP } from "node:net";
import RefundLedger from "../../models/RefundLedger.js";
import { classifyCallOutcome } from "./failureClassifier.js";
import { executeRefund } from "./refundService.js";
import { paymentMetaFromHeaders } from "./outboundRefundGuard.js";
import {
  clampRefundAmountUsd,
  getHostedDailyCapUsd,
  getMaxRefundUsd,
  getPerWalletDailyRefundCapUsd,
  getPoolMinBalanceUsd,
  isHostedHostnameEligible,
  isHostedRefundEnabled,
  networkToRefundChain,
} from "../../config/refund.js";

const PRIVATE_V4 =
  /^(127\.|10\.|0\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.)/;

/**
 * @param {number} spentUsd
 * @param {number} amountUsd
 * @param {number} capUsd
 */
export function wouldExceedCap(spentUsd, amountUsd, capUsd) {
  const spent = Number(spentUsd) || 0;
  const amount = Number(amountUsd) || 0;
  const cap = Number(capUsd);
  if (!Number.isFinite(cap) || cap <= 0) return false;
  return spent + amount > cap + 1e-12;
}

/**
 * Remaining pool after a payout must stay at/above minBalance.
 * @param {number} remainingUsd
 * @param {number} amountUsd
 * @param {number} minBalanceUsd
 */
export function wouldBreachPoolMin(remainingUsd, amountUsd, minBalanceUsd) {
  const remaining = Number(remainingUsd);
  const amount = Number(amountUsd) || 0;
  const min = Number(minBalanceUsd);
  if (!Number.isFinite(remaining) || remaining < 0) return false;
  if (!Number.isFinite(min) || min < 0) return false;
  return remaining - amount + 1e-12 < min;
}

/**
 * HTTPS-only public hosts. Host allowlist is the primary control; this blocks obvious SSRF.
 * @param {string} raw
 * @returns {{ ok: true; url: URL; host: string } | { ok: false; reason: string }}
 */
export function parseSafeRelayTarget(raw) {
  let url;
  try {
    url = new URL(String(raw || "").trim());
  } catch {
    return { ok: false, reason: "invalid_url" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, reason: "https_only" };
  }
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (!host) return { ok: false, reason: "invalid_url" };
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) {
    return { ok: false, reason: "ssrf_blocked" };
  }
  if (host === "metadata.google.internal" || host.endsWith(".internal")) {
    return { ok: false, reason: "ssrf_blocked" };
  }
  const ipVersion = isIP(host);
  if (ipVersion === 4 && PRIVATE_V4.test(host)) {
    return { ok: false, reason: "ssrf_blocked" };
  }
  if (ipVersion === 6) {
    const n = host.toLowerCase();
    if (n === "::1" || n.startsWith("fc") || n.startsWith("fd") || n.startsWith("fe80")) {
      return { ok: false, reason: "ssrf_blocked" };
    }
  }
  return { ok: true, url, host };
}

/**
 * Pure eligibility for a hosted payout (no ledger / no send).
 * @param {{
 *   enabled?: boolean;
 *   host?: string;
 *   toWallet?: string;
 *   amountUsd?: number | null;
 *   classified?: { refundable: boolean; reason: string };
 *   settleSuccess?: boolean | null;
 *   chain?: string | null;
 * }} input
 */
export function evaluateHostedEligibility(input = {}) {
  if (!input.enabled) {
    return { ok: false, skipped: true, reason: "disabled" };
  }
  if (!isHostedHostnameEligible(input.host)) {
    return { ok: false, skipped: true, reason: "host_not_allowlisted" };
  }
  if (input.classified && !input.classified.refundable) {
    return { ok: false, skipped: true, reason: input.classified.reason };
  }
  if (input.settleSuccess === false) {
    return { ok: false, skipped: true, reason: "settle_not_success" };
  }
  const toWallet = String(input.toWallet || "").trim();
  if (!toWallet) {
    return { ok: false, skipped: true, reason: "no_refund_wallet" };
  }
  if (!input.chain) {
    return { ok: false, skipped: true, reason: "unsupported_chain" };
  }
  const amountUsd = Number(input.amountUsd);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    return { ok: false, skipped: true, reason: "amount_unknown" };
  }
  return { ok: true, toWallet, amountUsd, chain: input.chain };
}

function startOfUtcDay(now = new Date()) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * @param {{ toWallet: string; amountUsd: number; now?: Date }} input
 * @param {{ RefundLedger?: typeof RefundLedger }} [deps]
 */
export async function assertHostedPayoutAllowed(input, deps = {}) {
  const Model = deps.RefundLedger || RefundLedger;
  const toWallet = String(input.toWallet || "").trim();
  const amountUsd = Number(input.amountUsd);
  const since = startOfUtcDay(input.now);

  const [walletAgg, globalAgg] = await Promise.all([
    Model.aggregate([
      {
        $match: {
          source: "hosted",
          status: "sent",
          toWallet,
          createdAt: { $gte: since },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountUsd" } } },
    ]),
    Model.aggregate([
      {
        $match: {
          source: "hosted",
          status: "sent",
          createdAt: { $gte: since },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountUsd" } } },
    ]),
  ]);

  const walletSpent = Number(walletAgg?.[0]?.total) || 0;
  const globalSpent = Number(globalAgg?.[0]?.total) || 0;
  const walletCap = getPerWalletDailyRefundCapUsd();
  const dailyCap = getHostedDailyCapUsd();
  const poolMin = getPoolMinBalanceUsd();

  if (wouldExceedCap(walletSpent, amountUsd, walletCap)) {
    return {
      ok: false,
      reason: "wallet_daily_cap",
      walletSpent,
      cap: walletCap,
    };
  }
  if (wouldExceedCap(globalSpent, amountUsd, dailyCap)) {
    return {
      ok: false,
      reason: "pool_daily_cap",
      globalSpent,
      cap: dailyCap,
    };
  }
  const remaining = dailyCap - globalSpent;
  if (wouldBreachPoolMin(remaining, amountUsd, poolMin)) {
    return {
      ok: false,
      reason: "pool_min_balance",
      remaining,
      min: poolMin,
    };
  }
  return { ok: true, walletSpent, globalSpent };
}

/**
 * Idempotency key for hosted payouts. Prefer the premium tx, then the upstream payment tx.
 * @param {{ premiumTx?: string | null; paymentTx?: string | null; mode?: string; toWallet?: string; url?: string; httpStatus?: number | null }} input
 */
export function hostedIdempotencyKey(input = {}) {
  const premiumTx = String(input.premiumTx || "").trim();
  if (premiumTx) return `hosted:${premiumTx}`;
  const paymentTx = String(input.paymentTx || "").trim();
  if (paymentTx) return `hosted:pay:${paymentTx}`;
  return `hosted:${input.mode || "relay"}:${input.toWallet || ""}:${input.url || ""}:${input.httpStatus || "throw"}`;
}

/**
 * Classify + cap + payout for a Syra-observed hosted call.
 * @param {{
 *   mode: 'relay' | 'reprobe';
 *   url: string;
 *   host: string;
 *   httpStatus?: number | null;
 *   errorMessage?: string | null;
 *   reqHeaders?: HeadersInit;
 *   resHeaders?: HeadersInit;
 *   toWallet?: string | null;
 *   coveredUsd?: number | null;
 *   premiumUsd?: number | null;
 *   premiumTx?: string | null;
 *   payerWallet?: string | null;
 *   chain?: string | null;
 * }} args
 */
export async function coverHostedCall(args) {
  if (!isHostedRefundEnabled()) {
    return { ok: false, skipped: true, reason: "disabled" };
  }

  const parsed = parseSafeRelayTarget(args.url);
  const host = args.host || (parsed.ok ? parsed.host : "");
  const meta = await paymentMetaFromHeaders(args.reqHeaders, args.resHeaders);
  const classified = classifyCallOutcome({
    httpStatus: args.httpStatus,
    errorMessage: args.errorMessage,
    hadPayment: meta.hadPayment,
  });

  const toWallet = String(args.toWallet || meta.payer || "").trim();
  const chain = networkToRefundChain(meta.network) || networkToRefundChain(args.chain) || "solana";
  const amountUsd = clampRefundAmountUsd(
    Number.isFinite(args.coveredUsd) && args.coveredUsd > 0 ? args.coveredUsd : meta.amountUsd,
    getMaxRefundUsd(),
  );

  const eligibility = evaluateHostedEligibility({
    enabled: true,
    host,
    toWallet,
    amountUsd,
    classified,
    settleSuccess: meta.settleSuccess,
    chain,
  });
  if (!eligibility.ok) return eligibility;

  const caps = await assertHostedPayoutAllowed({
    toWallet: eligibility.toWallet,
    amountUsd: eligibility.amountUsd,
  });
  if (!caps.ok) {
    return { ok: false, skipped: true, reason: caps.reason };
  }

  const premiumTx = String(args.premiumTx || "").trim();
  const paymentTx = meta.paymentTx || "";
  const idempotencyKey = hostedIdempotencyKey({
    premiumTx,
    paymentTx,
    mode: args.mode,
    toWallet: eligibility.toWallet,
    url: args.url,
    httpStatus: args.httpStatus,
  });

  return executeRefund({
    direction: "outbound",
    chain: eligibility.chain,
    toWallet: eligibility.toWallet,
    amountUsd: eligibility.amountUsd,
    reason: classified.reason,
    paymentTxSignature: meta.paymentTx,
    payer: eligibility.toWallet,
    providerHost: host,
    path: args.url,
    httpStatus: args.httpStatus,
    idempotencyKey,
    source: "hosted",
    premiumUsd: args.premiumUsd,
    premiumTx: premiumTx || null,
    coveredUrl: args.url,
    payerWallet: args.payerWallet || eligibility.toWallet,
    mode: args.mode,
  });
}

export { paymentMetaFromHeaders };
