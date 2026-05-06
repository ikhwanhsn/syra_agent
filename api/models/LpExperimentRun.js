import mongoose from "mongoose";

const lpExperimentRunSchema = new mongoose.Schema(
  {
    strategyId: { type: Number, required: true, min: 0, max: 99, index: true },
    strategyName: { type: String, required: true },
    lpShape: { type: String, required: true, enum: ["spot", "bid_ask", "curve", "mixed"] },

    poolAddress: { type: String, required: true, index: true },
    poolName: { type: String, default: null },
    baseSymbol: { type: String, default: null },
    quoteSymbol: { type: String, default: null },
    binStep: { type: Number, default: null },

    tvlUsd: { type: Number, default: null },
    volume24hUsd: { type: Number, default: null },
    organicScore: { type: Number, default: null },
    holderCount: { type: Number, default: null },
    mcapUsd: { type: Number, default: null },
    feeTvlRatio: { type: Number, default: null },

    binsBelow: { type: Number, required: true, min: 0 },
    binsAbove: { type: Number, required: true, min: 0 },
    activeBinAtOpen: { type: Number, default: null },

    entryPriceUsd: { type: Number, default: null },
    depositSol: { type: Number, required: true, min: 0 },
    depositUsd: { type: Number, required: true, min: 0 },

    signalSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    screeningSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },

    status: {
      type: String,
      required: true,
      enum: ["open", "win", "loss", "expired", "skipped", "error"],
      index: true,
    },
    resolution: { type: String, default: null },
    errorMessage: { type: String, default: null },

    simFeesEarnedSol: { type: Number, default: 0 },
    simPriceDriftPct: { type: Number, default: 0 },
    simPnlPct: { type: Number, default: 0 },
    simPnlUsd: { type: Number, default: 0 },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    lastEvaluatedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

lpExperimentRunSchema.index({ strategyId: 1, status: 1, createdAt: -1 });
lpExperimentRunSchema.index({ status: 1, createdAt: -1 });
lpExperimentRunSchema.index({ strategyId: 1, poolAddress: 1, status: 1, createdAt: -1 });

const LpExperimentRun =
  mongoose.models.LpExperimentRun || mongoose.model("LpExperimentRun", lpExperimentRunSchema);

export default LpExperimentRun;
