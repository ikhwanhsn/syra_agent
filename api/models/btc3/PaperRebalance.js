import mongoose from "mongoose";

const paperRebalanceSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    decisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Btc3AllocationDecision",
      default: null,
      index: true,
    },
    macroEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Btc3MacroEvent",
      default: null,
    },
    direction: {
      type: String,
      enum: ["buy_btc", "sell_btc", "hold"],
      required: true,
    },
    headline: { type: String, default: "" },
    confidence: { type: Number, default: 0 },
    btcPriceUsd: { type: Number, required: true },
    usdcDelta: { type: Number, default: 0 },
    btcDelta: { type: Number, default: 0 },
    notionalUsd: { type: Number, default: 0 },
    beforeAllocation: {
      btcPct: { type: Number, default: 0 },
      usdcPct: { type: Number, default: 0 },
      totalUsd: { type: Number, default: 0 },
    },
    afterAllocation: {
      btcPct: { type: Number, default: 0 },
      usdcPct: { type: Number, default: 0 },
      totalUsd: { type: Number, default: 0 },
    },
    equityUsd: { type: Number, default: 0 },
    returnPct: { type: Number, default: null },
    status: {
      type: String,
      enum: ["executed", "skipped_no_change", "skipped_below_threshold", "error"],
      default: "executed",
    },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true, collection: "btc3_paper_rebalances" },
);

paperRebalanceSchema.index({ experimentId: 1, createdAt: -1 });

const Btc3PaperRebalance =
  mongoose.models.Btc3PaperRebalance ||
  mongoose.model("Btc3PaperRebalance", paperRebalanceSchema);

export default Btc3PaperRebalance;
