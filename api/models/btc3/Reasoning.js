import mongoose from "mongoose";

const reasoningSchema = new mongoose.Schema(
  {
    macroEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3MacroEvent", required: true, index: true },
    summary: { type: String, required: true },
    bullishFactors: { type: [String], default: [] },
    bearishFactors: { type: [String], default: [] },
    historicalEvidence: {
      type: [
        {
          eventTitle: String,
          similarityScore: Number,
          btcReturn: Number,
          durationDays: Number,
        },
      ],
      default: [],
    },
    confidence: { type: Number, default: 0, min: 0, max: 1 },
    recommendedAllocation: {
      btcPct: { type: Number, default: 40 },
      usdcPct: { type: Number, default: 60 },
    },
    timeHorizon: { type: String, default: "7d" },
    model: { type: String, default: null },
    status: { type: String, enum: ["pending", "complete", "failed", "unavailable"], default: "pending" },
  },
  { timestamps: true, collection: "btc3_reasoning" },
);

const Btc3Reasoning =
  mongoose.models.Btc3Reasoning || mongoose.model("Btc3Reasoning", reasoningSchema);

export default Btc3Reasoning;
