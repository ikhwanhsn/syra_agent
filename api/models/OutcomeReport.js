import mongoose from "mongoose";

/**
 * Verifiable outcome report: proof bundle an agent can audit after completed work.
 */
const outcomeReportSchema = new mongoose.Schema(
  {
    reportId: { type: String, required: true, unique: true, index: true },
    jobId: { type: String, required: true, index: true },
    mandateId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["draft", "final", "disputed"],
      default: "final",
      index: true,
    },
    /** Human-readable outcome summary. */
    summary: { type: String, required: true },
    /** Structured outcome metrics. */
    metrics: {
      realizedPnlUsd: { type: Number, default: 0 },
      managedCapitalUsd: { type: Number, default: 0 },
      feeUsd: { type: Number, default: 0 },
      positionsOpened: { type: Number, default: 0 },
      positionsClosed: { type: Number, default: 0 },
      feesCollectedUsd: { type: Number, default: 0 },
    },
    /** On-chain transaction proofs. */
    txProofs: [
      {
        chain: String,
        signature: String,
        action: String,
        amountUsd: Number,
        timestamp: Date,
        explorerUrl: String,
      },
    ],
    /** SHA-256 of canonical report payload for audit. */
    proofHash: { type: String, required: true, index: true },
    /** Full canonical payload (deterministic ordering). */
    proofPayload: { type: mongoose.Schema.Types.Mixed, required: true },
    billingEventId: { type: String, default: null },
    x402TxSignature: { type: String, default: null },
    generatedAt: { type: Date, default: Date.now, index: true },
  },
  { collection: "outcome_reports", timestamps: true },
);

outcomeReportSchema.index({ anonymousId: 1, generatedAt: -1 });
outcomeReportSchema.index({ mandateId: 1, generatedAt: -1 });

if (mongoose.models.OutcomeReport) {
  delete mongoose.models.OutcomeReport;
}

const OutcomeReport = mongoose.model("OutcomeReport", outcomeReportSchema);

export default OutcomeReport;
