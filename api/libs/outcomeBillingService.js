/**
 * Outcome billing: performance/AUM/flat fees settled when job is proven done.
 */
import crypto from "node:crypto";
import OutcomeBillingEvent from "../models/OutcomeBillingEvent.js";
import OutcomeReport from "../models/OutcomeReport.js";
import { computeOutcomeFee } from "../config/outcomePricing.js";
import { recordX402Call } from "../utils/recordX402Call.js";
import { queueBuybackRevenue } from "../libs/buybackScheduler.js";
import { SOLANA_PAYTO, SOLANA_USDC_MINT } from "../config/settlement.js";
import { withSolanaRpcFallback } from "./solanaServerRpc.js";

function newBillingEventId() {
  return `bill_${crypto.randomBytes(12).toString("hex")}`;
}

/**
 * Verify a Solana USDC payment to the Syra merchant payTo for the expected USD amount.
 * @param {string} txSignature
 * @param {{ amountUsd: number; payer?: string | null }} opts
 */
async function verifyOutcomeBillingSolanaUsdcTx(txSignature, opts) {
  const signature = String(txSignature || "").trim();
  if (!signature) throw new Error("txSignature required");

  const amountUsd = Number(opts.amountUsd);
  if (!Number.isFinite(amountUsd) || amountUsd <= 0) {
    throw new Error("invalid_billing_amount");
  }
  // USDC 6 decimals; allow 1 micro-USDC tolerance for rounding
  const expectedMicro = Math.round(amountUsd * 1_000_000);
  const minMicro = Math.max(1, expectedMicro - 1);

  const tx = await withSolanaRpcFallback(
    (connection) =>
      connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      }),
    "outcome billing tx verify",
  );

  if (!tx) throw new Error("tx_not_found_or_unconfirmed");
  if (tx.meta?.err) throw new Error("tx_failed_onchain");

  const pre = tx.meta?.preTokenBalances || [];
  const post = tx.meta?.postTokenBalances || [];
  /** @type {Map<string, number>} */
  const preByIndex = new Map();
  for (const b of pre) {
    if (b.mint !== SOLANA_USDC_MINT) continue;
    preByIndex.set(String(b.accountIndex), Number(b.uiTokenAmount?.amount || 0));
  }

  let creditedToPayTo = 0;
  for (const b of post) {
    if (b.mint !== SOLANA_USDC_MINT) continue;
    const owner = b.owner || "";
    if (owner !== SOLANA_PAYTO) continue;
    const before = preByIndex.get(String(b.accountIndex)) ?? 0;
    const after = Number(b.uiTokenAmount?.amount || 0);
    const delta = after - before;
    if (delta > 0) creditedToPayTo += delta;
  }

  if (creditedToPayTo < minMicro) {
    throw new Error(
      `tx_amount_or_recipient_mismatch: expected>=${minMicro} microUSDC to ${SOLANA_PAYTO}, got ${creditedToPayTo}`,
    );
  }

  if (opts.payer) {
    const accountKeys = tx.transaction?.message?.accountKeys || [];
    const feePayer =
      typeof accountKeys[0]?.pubkey === "string"
        ? accountKeys[0].pubkey
        : accountKeys[0]?.pubkey?.toBase58?.() || null;
    if (feePayer && feePayer !== String(opts.payer).trim()) {
      // Soft check — x402 may use intermediate ATAs; do not hard-fail on fee payer alone
    }
  }

  return { signature, creditedMicroUsdc: creditedToPayTo };
}

/**
 * Create a billing event from a finalized outcome report.
 * @param {string} reportId
 * @param {{ billingPeriodDays?: number; waive?: boolean }} [opts]
 */
export async function createOutcomeBillingEvent(reportId, opts = {}) {
  const report = await OutcomeReport.findOne({ reportId }).lean();
  if (!report) throw new Error(`Report not found: ${reportId}`);

  const existing = await OutcomeBillingEvent.findOne({ reportId }).lean();
  if (existing) return existing;

  const fee = computeOutcomeFee(report.productId, {
    realizedPnlUsd: report.metrics?.realizedPnlUsd ?? 0,
    managedCapitalUsd: report.metrics?.managedCapitalUsd ?? 0,
    billingPeriodDays: opts.billingPeriodDays ?? 30,
  });

  if (opts.waive || fee.totalUsd <= 0) {
    const billingEventId = newBillingEventId();
    const doc = await OutcomeBillingEvent.create({
      billingEventId,
      reportId,
      jobId: report.jobId,
      mandateId: report.mandateId,
      productId: report.productId,
      anonymousId: report.anonymousId,
      status: "waived",
      amountUsd: 0,
      feeBreakdown: fee.breakdown,
      billingModel: fee.billingModel,
    });
    await OutcomeReport.updateOne({ reportId }, { $set: { billingEventId } });
    return doc.toObject();
  }

  const billingEventId = newBillingEventId();
  const doc = await OutcomeBillingEvent.create({
    billingEventId,
    reportId,
    jobId: report.jobId,
    mandateId: report.mandateId,
    productId: report.productId,
    anonymousId: report.anonymousId,
    status: "pending",
    amountUsd: fee.totalUsd,
    feeBreakdown: fee.breakdown,
    billingModel: fee.billingModel,
  });

  await OutcomeReport.updateOne({ reportId }, { $set: { billingEventId } });
  return doc.toObject();
}

/**
 * Mark billing event as paid after verified on-chain settlement.
 * Idempotent on the same txSignature; rejects unverified client-supplied signatures.
 * @param {string} billingEventId
 * @param {{ txSignature: string; network?: string; payer?: string }} settlement
 */
export async function markOutcomeBillingPaid(billingEventId, settlement) {
  const txSignature = String(settlement?.txSignature || "").trim();
  if (!txSignature) throw new Error("txSignature required");

  const existing = await OutcomeBillingEvent.findOne({ billingEventId }).lean();
  if (!existing) throw new Error(`Billing event not found: ${billingEventId}`);

  // Idempotency: same tx already recorded as paid
  if (existing.status === "paid") {
    if (existing.x402TxSignature && existing.x402TxSignature === txSignature) {
      return existing;
    }
    throw new Error(`Billing event already paid: ${billingEventId}`);
  }

  if (!["pending", "payment_required"].includes(existing.status)) {
    throw new Error(`Billing event not payable (status=${existing.status})`);
  }

  const network = String(settlement.network || "solana").toLowerCase();
  if (network !== "solana" && network !== "solana-mainnet" && network !== "solana:mainnet") {
    throw new Error(`unsupported_billing_network:${network}`);
  }

  // Unique tx reuse guard across billing events
  const reused = await OutcomeBillingEvent.findOne({
    x402TxSignature: txSignature,
    billingEventId: { $ne: billingEventId },
  }).lean();
  if (reused) {
    throw new Error("tx_signature_already_used");
  }

  await verifyOutcomeBillingSolanaUsdcTx(txSignature, {
    amountUsd: existing.amountUsd,
    payer: settlement.payer,
  });

  const doc = await OutcomeBillingEvent.findOneAndUpdate(
    { billingEventId, status: { $in: ["pending", "payment_required"] } },
    {
      $set: {
        status: "paid",
        x402TxSignature: txSignature,
        x402Network: "solana",
        payer: settlement.payer ?? null,
        paidAt: new Date(),
      },
    },
    { new: true },
  ).lean();

  if (!doc) throw new Error(`Billing event not found or already paid: ${billingEventId}`);

  await OutcomeReport.updateOne(
    { reportId: doc.reportId },
    { $set: { x402TxSignature: txSignature } },
  );

  recordX402Call({
    direction: "inbound",
    path: `/outcomes/billing/${billingEventId}/settle`,
    outcome: "paid",
    amountUsd: doc.amountUsd,
    network: "solana",
    payer: settlement.payer,
    txSignature,
    source: "outcome_billing",
  }).catch(() => {});

  queueBuybackRevenue(doc.amountUsd).catch(() => {});

  return doc;
}

/**
 * Transition billing to payment_required (402 challenge issued).
 */
export async function markOutcomeBillingPaymentRequired(billingEventId) {
  return OutcomeBillingEvent.findOneAndUpdate(
    { billingEventId, status: "pending" },
    { $set: { status: "payment_required" } },
    { new: true },
  ).lean();
}

/**
 * @param {string} billingEventId
 */
export async function getOutcomeBillingEvent(billingEventId) {
  return OutcomeBillingEvent.findOne({ billingEventId }).lean();
}

/**
 * @param {string} anonymousId
 */
export async function listOutcomeBillingEvents(anonymousId, limit = 20) {
  return OutcomeBillingEvent.find({ anonymousId })
    .sort({ createdAt: -1 })
    .limit(Math.min(100, limit))
    .lean();
}

/**
 * Full settle flow: report -> billing event -> ready for x402 payment.
 * @param {string} reportId
 */
export async function prepareOutcomeSettlement(reportId) {
  const billing = await createOutcomeBillingEvent(reportId);
  if (billing.status === "waived") {
    return { billing, paymentRequired: false, amountUsd: 0 };
  }
  await markOutcomeBillingPaymentRequired(billing.billingEventId);
  return {
    billing: { ...billing, status: "payment_required" },
    paymentRequired: true,
    amountUsd: billing.amountUsd,
    settlePath: `/outcomes/billing/${billing.billingEventId}/settle`,
  };
}
