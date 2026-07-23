import mongoose from "mongoose";

const lstLoopRealPositionSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    agentAddress: { type: String, required: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99, index: true },
    strategyName: { type: String, required: true },

    lstSymbol: { type: String, required: true, enum: ["mSOL", "JitoSOL"] },
    lstMint: { type: String, default: null, index: true },

    leverage: { type: Number, required: true, min: 1 },
    ltv: { type: Number, required: true, min: 0, max: 1 },
    healthFactor: { type: Number, default: null },

    depositSol: { type: Number, required: true, min: 0 },
    borrowedSol: { type: Number, required: true, min: 0 },

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

    openTxSigs: { type: [String], default: [] },
    closeTxSigs: { type: [String], default: [] },

    realNetPnlSol: { type: Number, default: null },
    realNetPnlUsd: { type: Number, default: null },

    /** Prevent concurrent resolve ticks from double-closing. */
    processing: { type: Boolean, default: false },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "lst_loop_real_positions" },
);

lstLoopRealPositionSchema.index({ status: 1, openedAt: -1 });
lstLoopRealPositionSchema.index({ experimentId: 1, strategyId: 1, status: 1 });
lstLoopRealPositionSchema.index({ experimentId: 1, lstMint: 1, status: 1, createdAt: -1 });

const LstLoopRealPosition =
  mongoose.models.LstLoopRealPosition ||
  mongoose.model("LstLoopRealPosition", lstLoopRealPositionSchema);

export default LstLoopRealPosition;
