import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema(
  {
    btcPct: { type: Number, default: 0 },
    usdcPct: { type: Number, default: 0 },
    totalUsd: { type: Number, default: 0 },
  },
  { _id: false },
);

const btc3RealRebalanceSchema = new mongoose.Schema(
  {
    experimentId: { type: String, default: null, index: true },
    decisionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Btc3AllocationDecision",
      default: null,
      index: true,
      sparse: true,
    },
    macroEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Btc3MacroEvent",
      default: null,
      index: true,
      sparse: true,
    },
    direction: {
      type: String,
      required: true,
      enum: ["buy_btc", "sell_btc", "hold"],
    },
    headline: { type: String, default: "" },
    confidence: { type: Number, default: null },
    btcPriceUsd: { type: Number, default: null },
    notionalUsd: { type: Number, default: 0 },
    usdcDelta: { type: Number, default: 0 },
    btcDelta: { type: Number, default: 0 },
    beforeAllocation: { type: allocationSchema, default: () => ({}) },
    afterAllocation: { type: allocationSchema, default: () => ({}) },
    equityUsd: { type: Number, default: null },
    targetBtcPct: { type: Number, default: null },
    inputMint: { type: String, default: null },
    outputMint: { type: String, default: null },
    amountRaw: { type: String, default: null },
    outAmountRaw: { type: String, default: null },
    txSig: { type: String, default: null, index: true },
    status: {
      type: String,
      required: true,
      enum: [
        "pending",
        "executed",
        "skipped_below_threshold",
        "skipped_no_change",
        "skipped_disabled",
        "skipped_insufficient",
        "error",
      ],
      index: true,
    },
    errorMessage: { type: String, default: null },
    realNetPnlUsd: { type: Number, default: null },
  },
  { timestamps: true, collection: "btc3_real_rebalances" },
);

btc3RealRebalanceSchema.index({ status: 1, createdAt: -1 });
btc3RealRebalanceSchema.index({ experimentId: 1, createdAt: -1 });
btc3RealRebalanceSchema.index({ experimentId: 1, status: 1, createdAt: -1 });

const Btc3RealRebalance =
  mongoose.models.Btc3RealRebalance ||
  mongoose.model("Btc3RealRebalance", btc3RealRebalanceSchema);

export default Btc3RealRebalance;
