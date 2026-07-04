import mongoose from "mongoose";

const btcQuantRealPositionSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    /** Paper-sim lane this position mirrors (btc1 / btc2). */
    lane: { type: String, default: "btc1", index: true, enum: ["btc1", "btc2"] },
    strategyId: { type: Number, required: true, min: 0, max: 999, index: true },
    strategyName: { type: String, required: true },
    bar: { type: String, required: true },
    /** Onchain market feed key (e.g. onchain_birdeye). Legacy docs may use cexSource. */
    dataSource: { type: String, required: true },

    /** Paper run link for audit trail. */
    simRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TradingExperimentRun",
      default: null,
      index: true,
      sparse: true,
    },

    inputMint: { type: String, required: true },
    outputMint: { type: String, required: true },
    entryPriceUsd: { type: Number, default: null },
    stopLoss: { type: Number, default: null },
    firstTarget: { type: Number, default: null },
    notionalUsd: { type: Number, required: true, min: 0 },

    cbbtcAmountRaw: { type: String, default: null },
    usdcSpentRaw: { type: String, default: null },

    openTxSig: { type: String, default: null, index: true },
    closeTxSig: { type: String, default: null },

    status: {
      type: String,
      required: true,
      enum: ["opening", "open", "closing", "closed_win", "closed_loss", "expired", "error"],
      index: true,
    },
    resolution: { type: String, default: null },
    errorMessage: { type: String, default: null },
    realNetPnlUsd: { type: Number, default: null },
    realExitPriceUsd: { type: Number, default: null },
    processing: { type: Boolean, default: false },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "btc_quant_real_positions" },
);

btcQuantRealPositionSchema.index({ status: 1, openedAt: -1 });
btcQuantRealPositionSchema.index({ experimentId: 1, strategyId: 1, status: 1 });
btcQuantRealPositionSchema.index({ experimentId: 1, lane: 1, status: 1 });

const BtcQuantRealPosition =
  mongoose.models.BtcQuantRealPosition ||
  mongoose.model("BtcQuantRealPosition", btcQuantRealPositionSchema);

export default BtcQuantRealPosition;
