import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

const robinhoodLpExperimentRunSchema = new mongoose.Schema(
  {
    experimentId: { type: String, default: null, index: true },
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

    simFeesEarnedUsd: { type: Number, default: 0 },
    simPriceDriftPct: { type: Number, default: 0 },
    simPnlPct: { type: Number, default: 0 },
    simPnlUsd: { type: Number, default: 0 },
    simOpenFeeUsd: { type: Number, default: 0 },
    simCloseFeeUsd: { type: Number, default: 0 },
    simNetPnlUsd: { type: Number, default: 0 },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    lastEvaluatedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },

    /**
     * When set, this run belongs to a culled strategy generation.
     * Kept for lineage / credit assignment; excluded from active ranking.
     */
    archivedAt: { type: Date, default: null, index: true },
    archiveReason: { type: String, default: null },
  },
  { timestamps: true, collection: "robinhood_lp_experiment_runs" },
);

robinhoodLpExperimentRunSchema.index({ experimentId: 1, strategyId: 1, status: 1, createdAt: -1 });
robinhoodLpExperimentRunSchema.index({ experimentId: 1, status: 1 });
robinhoodLpExperimentRunSchema.index({ strategyId: 1, poolAddress: 1, status: 1, createdAt: -1 });
robinhoodLpExperimentRunSchema.index(
  { resolvedAt: 1 },
  {
    expireAfterSeconds: ttlExpireSeconds("ROBINHOOD_LP_RUN_TTL_DAYS", 45),
    partialFilterExpression: {
      status: { $in: ["win", "loss", "expired", "error"] },
      resolvedAt: { $type: "date" },
    },
  },
);

const RobinhoodLpExperimentRun =
  mongoose.models.RobinhoodLpExperimentRun ||
  mongoose.model("RobinhoodLpExperimentRun", robinhoodLpExperimentRunSchema);

export default RobinhoodLpExperimentRun;
