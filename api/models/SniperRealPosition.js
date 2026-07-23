import mongoose from "mongoose";

const sniperRealPositionSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    agentAddress: { type: String, required: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99, index: true },
    strategyName: { type: String, required: true },

    mint: { type: String, required: true, index: true },
    symbol: { type: String, required: true, index: true },

    depositSol: { type: Number, required: true, min: 0 },
    entryPriceUsd: { type: Number, required: true, min: 0 },

    syraAlphaScore: { type: Number, default: null },

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

    realNetPnlSol: { type: Number, default: null },
    realNetPnlUsd: { type: Number, default: null },

    /** Prevent concurrent resolve ticks from double-closing. */
    processing: { type: Boolean, default: false },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "sniper_real_positions" },
);

sniperRealPositionSchema.index({ status: 1, openedAt: -1 });
sniperRealPositionSchema.index({ experimentId: 1, strategyId: 1, status: 1 });
sniperRealPositionSchema.index({ experimentId: 1, mint: 1, status: 1, createdAt: -1 });

const SniperRealPosition =
  mongoose.models.SniperRealPosition ||
  mongoose.model("SniperRealPosition", sniperRealPositionSchema);

export default SniperRealPosition;
