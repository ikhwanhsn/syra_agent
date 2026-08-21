import mongoose from "mongoose";

const delphiRealPositionSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    agentAddress: { type: String, required: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99, index: true },
    strategyName: { type: String, required: true },

    symbol: { type: String, required: true, index: true },
    mint: { type: String, default: null },
    side: { type: String, required: true, enum: ["long"], default: "long" },

    entryPriceUsd: { type: Number, required: true, min: 0 },
    notionalUsd: { type: Number, required: true, min: 0 },

    signalSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },

    status: {
      type: String,
      required: true,
      enum: [
        "opening",
        "open",
        "closing",
        "closed_win",
        "closed_loss",
        "error",
        "expired",
      ],
      index: true,
    },
    resolution: { type: String, default: null },
    errorMessage: { type: String, default: null },

    openTxSig: { type: String, default: null },
    closeTxSig: { type: String, default: null },

    realNetPnlUsd: { type: Number, default: null },
    realExitPriceUsd: { type: Number, default: null },
    processing: { type: Boolean, default: false },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "delphi_real_positions" },
);

delphiRealPositionSchema.index({ status: 1, openedAt: -1 });
delphiRealPositionSchema.index({ experimentId: 1, strategyId: 1, status: 1 });

const DelphiRealPosition =
  mongoose.models.DelphiRealPosition ||
  mongoose.model("DelphiRealPosition", delphiRealPositionSchema);

export default DelphiRealPosition;
