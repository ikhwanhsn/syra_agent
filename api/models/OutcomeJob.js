import mongoose from "mongoose";

/**
 * Managed outcome job: perceive -> decide -> execute -> settle -> report lifecycle.
 */
const outcomeJobSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    mandateId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: [
        "pending",
        "perceiving",
        "deciding",
        "executing",
        "settling",
        "completed",
        "failed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },
    phase: { type: String, default: "perceive" },
    chain: { type: String, required: true },
    /** Input context for this job cycle. */
    input: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** Decision output from the runtime handler. */
    decision: { type: mongoose.Schema.Types.Mixed, default: null },
    /** Execution receipts (tx sigs, position ids). */
    execution: { type: mongoose.Schema.Types.Mixed, default: null },
    /** Settlement / billing reference. */
    settlement: { type: mongoose.Schema.Types.Mixed, default: null },
    /** Link to OutcomeReport once proof is generated. */
    reportId: { type: String, default: null, index: true },
    error: { type: String, default: null },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    /** Realized PnL for this job (USD). */
    realizedPnlUsd: { type: Number, default: 0 },
    /** Fee charged for this completed job (USD). */
    feeUsd: { type: Number, default: 0 },
    dryRun: { type: Boolean, default: false },
  },
  { collection: "outcome_jobs", timestamps: true },
);

outcomeJobSchema.index({ mandateId: 1, status: 1, createdAt: -1 });
outcomeJobSchema.index({ productId: 1, status: 1, createdAt: -1 });

if (mongoose.models.OutcomeJob) {
  delete mongoose.models.OutcomeJob;
}

const OutcomeJob = mongoose.model("OutcomeJob", outcomeJobSchema);

export default OutcomeJob;
