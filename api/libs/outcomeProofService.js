/**
 * Verifiable outcome proof reports: on-chain receipts + PnL statements agents can audit.
 */
import crypto from "node:crypto";
import OutcomeReport from "../models/OutcomeReport.js";
import OutcomeJob from "../models/OutcomeJob.js";

function newReportId() {
  return `report_${crypto.randomBytes(12).toString("hex")}`;
}

/**
 * Canonical JSON stringify with sorted keys for deterministic hashing.
 * @param {unknown} obj
 */
function canonicalStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(canonicalStringify).join(",")}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify(obj[k])}`).join(",")}}`;
}

function hashPayload(payload) {
  return crypto.createHash("sha256").update(canonicalStringify(payload)).digest("hex");
}

/**
 * Build explorer URL for a tx proof.
 * @param {string} chain
 * @param {string} signature
 */
function explorerUrl(chain, signature) {
  if (chain === "solana") return `https://solscan.io/tx/${signature}`;
  if (chain === "robinhood") return `https://explorer.robinhood.com/tx/${signature}`;
  if (chain === "base") return `https://basescan.org/tx/${signature}`;
  return null;
}

/**
 * @typedef {Object} GenerateReportInput
 * @property {string} jobId
 * @property {string} summary
 * @property {Object} [metrics]
 * @property {Array<{ chain: string; signature: string; action: string; amountUsd?: number; timestamp?: Date }>} [txProofs]
 */

/**
 * Generate a verifiable outcome report for a completed job.
 * @param {GenerateReportInput} input
 */
export async function generateOutcomeReport(input) {
  const job = await OutcomeJob.findOne({ jobId: input.jobId }).lean();
  if (!job) throw new Error(`Job not found: ${input.jobId}`);
  if (job.status !== "completed" && job.status !== "settling" && job.status !== "executing") {
    throw new Error(`Job not in completable state: ${job.status}`);
  }

  const reportId = newReportId();
  const txProofs = (input.txProofs ?? []).map((p) => ({
    chain: p.chain,
    signature: p.signature,
    action: p.action,
    amountUsd: p.amountUsd ?? 0,
    timestamp: p.timestamp ? new Date(p.timestamp) : new Date(),
    explorerUrl: explorerUrl(p.chain, p.signature),
  }));

  const metrics = {
    realizedPnlUsd: input.metrics?.realizedPnlUsd ?? job.realizedPnlUsd ?? 0,
    managedCapitalUsd: input.metrics?.managedCapitalUsd ?? 0,
    feeUsd: input.metrics?.feeUsd ?? job.feeUsd ?? 0,
    positionsOpened: input.metrics?.positionsOpened ?? 0,
    positionsClosed: input.metrics?.positionsClosed ?? 0,
    feesCollectedUsd: input.metrics?.feesCollectedUsd ?? 0,
  };

  const proofPayload = {
    reportId,
    jobId: job.jobId,
    mandateId: job.mandateId,
    productId: job.productId,
    anonymousId: job.anonymousId,
    summary: input.summary,
    metrics,
    txProofs: txProofs.map(({ chain, signature, action, amountUsd, timestamp }) => ({
      chain,
      signature,
      action,
      amountUsd,
      timestamp: timestamp?.toISOString?.() ?? timestamp,
    })),
    completedAt: job.completedAt?.toISOString?.() ?? new Date().toISOString(),
    dryRun: job.dryRun ?? false,
  };

  const proofHash = hashPayload(proofPayload);

  const report = await OutcomeReport.create({
    reportId,
    jobId: job.jobId,
    mandateId: job.mandateId,
    productId: job.productId,
    anonymousId: job.anonymousId,
    summary: input.summary,
    metrics,
    txProofs,
    proofHash,
    proofPayload,
    status: "final",
    generatedAt: new Date(),
  });

  await OutcomeJob.updateOne({ jobId: job.jobId }, { $set: { reportId } });

  return report.toObject();
}

/**
 * @param {string} reportId
 */
export async function getOutcomeReport(reportId) {
  return OutcomeReport.findOne({ reportId }).lean();
}

/**
 * Verify report integrity by recomputing proof hash.
 * @param {string} reportId
 */
export async function verifyOutcomeReport(reportId) {
  const report = await OutcomeReport.findOne({ reportId }).lean();
  if (!report) return { valid: false, reason: "not_found" };
  const recomputed = hashPayload(report.proofPayload);
  return {
    valid: recomputed === report.proofHash,
    proofHash: report.proofHash,
    recomputedHash: recomputed,
    reportId,
  };
}

/**
 * @param {string} anonymousId
 * @param {{ mandateId?: string; limit?: number }} [opts]
 */
export async function listOutcomeReports(anonymousId, opts = {}) {
  const q = { anonymousId };
  if (opts.mandateId) q.mandateId = opts.mandateId;
  const limit = Math.min(100, Math.max(1, Number(opts.limit) || 20));
  return OutcomeReport.find(q).sort({ generatedAt: -1 }).limit(limit).lean();
}

export { hashPayload, canonicalStringify };
