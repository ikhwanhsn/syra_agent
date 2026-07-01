import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

const stocksExperimentRunSchema = new mongoose.Schema(
  {
    experimentId: { type: String, default: null, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99, index: true },
    strategyName: { type: String, required: true },

    symbol: { type: String, required: true, index: true },
    mint: { type: String, default: null },
    nasdaqTicker: { type: String, default: null },

    entryPriceUsd: { type: Number, required: true, min: 0 },
    notionalUsd: { type: Number, required: true, min: 0 },

    signalSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    newsHeadline: { type: String, default: null },

    status: {
      type: String,
      required: true,
      enum: ["open", "win", "loss", "expired", "skipped", "error"],
      index: true,
    },
    resolution: { type: String, default: null },
    errorMessage: { type: String, default: null },

    simExitPrice: { type: Number, default: null },
    simPnlUsd: { type: Number, default: null },
    simPnlPct: { type: Number, default: null },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    lastEvaluatedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "stocks_experiment_runs" },
);

stocksExperimentRunSchema.index({ experimentId: 1, strategyId: 1, status: 1, createdAt: -1 });
stocksExperimentRunSchema.index({ strategyId: 1, status: 1, createdAt: -1 });
stocksExperimentRunSchema.index({ status: 1, createdAt: -1 });
stocksExperimentRunSchema.index(
  { resolvedAt: 1 },
  {
    expireAfterSeconds: ttlExpireSeconds("STOCKS_RUN_TTL_DAYS", 45),
    partialFilterExpression: {
      status: { $in: ["win", "loss", "expired", "error"] },
      resolvedAt: { $type: "date" },
    },
  },
);

const StocksExperimentRun =
  mongoose.models.StocksExperimentRun ||
  mongoose.model("StocksExperimentRun", stocksExperimentRunSchema);

export default StocksExperimentRun;
