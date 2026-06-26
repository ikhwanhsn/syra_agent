import mongoose from "mongoose";

const executionSchema = new mongoose.Schema(
  {
    decisionId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3AllocationDecision", required: true, index: true },
    inputMint: { type: String, default: null },
    outputMint: { type: String, default: null },
    inputAmount: { type: String, default: null },
    outputAmount: { type: String, default: null },
    estimatedFeeUsd: { type: Number, default: null },
    route: { type: String, default: null },
    quote: { type: mongoose.Schema.Types.Mixed, default: null },
    status: {
      type: String,
      enum: ["quoted", "pending_approval", "approved", "executing", "completed", "failed", "stubbed"],
      default: "quoted",
    },
    txSignature: { type: String, default: null },
    error: { type: String, default: null },
  },
  { timestamps: true, collection: "btc3_executions" },
);

const Btc3Execution =
  mongoose.models.Btc3Execution || mongoose.model("Btc3Execution", executionSchema);

export default Btc3Execution;
