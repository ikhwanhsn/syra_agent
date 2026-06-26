import mongoose from "mongoose";

const allocationDecisionSchema = new mongoose.Schema(
  {
    macroEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3MacroEvent", default: null },
    reasoningId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3Reasoning", default: null },
    predictionId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3Prediction", default: null },
    currentAllocation: {
      btcPct: { type: Number, required: true },
      usdcPct: { type: Number, required: true },
    },
    targetAllocation: {
      btcPct: { type: Number, required: true },
      usdcPct: { type: Number, required: true },
    },
    confidence: { type: Number, default: 0 },
    headline: { type: String, default: "" },
    headlineHash: { type: String, default: null },
    reasonHash: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "executed", "expired"],
      default: "pending",
    },
    approvedAt: { type: Date, default: null },
    approvedBy: { type: String, default: null },
  },
  { timestamps: true, collection: "btc3_allocation_decisions" },
);

const Btc3AllocationDecision =
  mongoose.models.Btc3AllocationDecision ||
  mongoose.model("Btc3AllocationDecision", allocationDecisionSchema);

export default Btc3AllocationDecision;
