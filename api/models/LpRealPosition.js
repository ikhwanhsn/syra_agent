import mongoose from "mongoose";

const lpRealPositionSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99, index: true },
    strategyName: { type: String, required: true },
    lpShape: { type: String, required: true, enum: ["spot", "bid_ask", "curve", "mixed"] },

    poolAddress: { type: String, required: true, index: true },
    poolName: { type: String, default: null },
    baseSymbol: { type: String, default: null },
    quoteSymbol: { type: String, default: null },
    baseMint: { type: String, default: null },
    quoteMint: { type: String, default: null },
    binStep: { type: Number, default: null },
    binsBelow: { type: Number, required: true, min: 0 },
    binsAbove: { type: Number, required: true, min: 0 },
    activeBinAtOpen: { type: Number, default: null },
    entryPriceUsd: { type: Number, default: null },

    /** Meteora position account pubkey (base58). */
    positionPubkey: { type: String, required: true, index: true },
    /** Encrypted position keypair secret (enc:v1:...) — required for open tx co-sign. */
    positionSecretEnc: { type: String, required: true, select: false },

    depositSol: { type: Number, required: true, min: 0 },
    depositUsd: { type: Number, required: true, min: 0 },

    /** Frozen exit rules from strategy at open. */
    exitRules: { type: mongoose.Schema.Types.Mixed, default: null },
    signalSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    screeningSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },

    status: {
      type: String,
      required: true,
      enum: [
        "opening",
        "open",
        "closing",
        "closed_win",
        "closed_loss",
        "claim_only",
        "error",
        "expired",
      ],
      index: true,
    },
    resolution: { type: String, default: null },
    errorMessage: { type: String, default: null },

    openTxSig: { type: String, default: null },
    closeTxSig: { type: String, default: null },
    claimTxSigs: { type: [String], default: [] },

    realFeesClaimedSol: { type: Number, default: 0 },
    realFinalSolOut: { type: Number, default: null },
    realNetPnlSol: { type: Number, default: null },
    realNetPnlUsd: { type: Number, default: null },

    /** Prevent concurrent resolve ticks from double-closing. */
    processing: { type: Boolean, default: false },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    lastEvaluatedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "lp_real_positions" },
);

lpRealPositionSchema.index({ status: 1, openedAt: -1 });
lpRealPositionSchema.index({ experimentId: 1, strategyId: 1, status: 1 });
lpRealPositionSchema.index({ experimentId: 1, poolAddress: 1, status: 1, createdAt: -1 });

const LpRealPosition =
  mongoose.models.LpRealPosition || mongoose.model("LpRealPosition", lpRealPositionSchema);

export default LpRealPosition;
