/**
 * Outcome billing: performance/AUM/flat fees settled when job is proven done.
 */
import crypto from "node:crypto";
import OutcomeBillingEvent from "../models/OutcomeBillingEvent.js";
import OutcomeReport from "../models/OutcomeReport.js";
import { computeOutcomeFee } from "../config/outcomePricing.js";
import { recordX402Call } from "../utils/recordX402Call.js";
import { queueBuybackRevenue } from "../libs/buybackScheduler.js";

function newBillingEventId() {
  return `bill_${crypto.randomBytes(12).toString("hex")}`;
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
 * Mark billing event as paid after x402 settlement.
 * @param {string} billingEventId
 * @param {{ txSignature: string; network?: string; payer?: string }} settlement
 */
export async function markOutcomeBillingPaid(billingEventId, settlement) {
  const doc = await OutcomeBillingEvent.findOneAndUpdate(
    { billingEventId, status: { $in: ["pending", "payment_required"] } },
    {
      $set: {
        status: "paid",
        x402TxSignature: settlement.txSignature,
        x402Network: settlement.network ?? "solana",
        payer: settlement.payer ?? null,
        paidAt: new Date(),
      },
    },
    { new: true },
  ).lean();

  if (!doc) throw new Error(`Billing event not found or already paid: ${billingEventId}`);

  await OutcomeReport.updateOne(
    { reportId: doc.reportId },
    { $set: { x402TxSignature: settlement.txSignature } },
  );

  recordX402Call({
    direction: "inbound",
    path: `/outcomes/billing/${billingEventId}/settle`,
    outcome: "paid",
    amountUsd: doc.amountUsd,
    network: settlement.network ?? "solana",
    payer: settlement.payer,
    txSignature: settlement.txSignature,
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
