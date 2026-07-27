import mongoose from "mongoose";

/**
 * Outcome billing event: performance/AUM/flat fee settled via x402 when job is proven done.
 */
const outcomeBillingEventSchema = new mongoose.Schema(
  {
    billingEventId: { type: String, required: true, unique: true, index: true },
    reportId: { type: String, required: true, index: true },
    jobId: { type: String, required: true, index: true },
    mandateId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "payment_required", "paid", "waived", "failed"],
      default: "pending",
      index: true,
    },
    amountUsd: { type: Number, required: true, min: 0 },
    feeBreakdown: { type: mongoose.Schema.Types.Mixed, default: {} },
    billingModel: { type: String, default: "performance" },
    x402TxSignature: { type: String, default: null },
    x402Network: { type: String, default: null },
    payer: { type: String, default: null },
    paidAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { collection: "outcome_billing_events", timestamps: true },
);

outcomeBillingEventSchema.index({ status: 1, createdAt: -1 });

if (mongoose.models.OutcomeBillingEvent) {
  delete mongoose.models.OutcomeBillingEvent;
}

const OutcomeBillingEvent = mongoose.model("OutcomeBillingEvent", outcomeBillingEventSchema);

export default OutcomeBillingEvent;
