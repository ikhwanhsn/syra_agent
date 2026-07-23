import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

const momentumRotatorRunSchema = new mongoose.Schema(
  {
    experimentId: { type: String, default: null, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99, index: true },
    strategyName: { type: String, required: true },

    symbol: { type: String, required: true, index: true },
    mint: { type: String, default: null },

    entryPriceUsd: { type: Number, required: true, min: 0 },
    notionalUsd: { type: Number, required: true, min: 0 },

    signalSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },

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
  { timestamps: true, collection: "momentum_rotator_runs" },
);

momentumRotatorRunSchema.index({ experimentId: 1, strategyId: 1, status: 1, createdAt: -1 });
momentumRotatorRunSchema.index({ experimentId: 1, status: 1, createdAt: -1 });
momentumRotatorRunSchema.index({ strategyId: 1, status: 1, createdAt: -1 });
momentumRotatorRunSchema.index({ status: 1, createdAt: -1 });
momentumRotatorRunSchema.index(
  { resolvedAt: 1 },
  {
    expireAfterSeconds: ttlExpireSeconds("MOMENTUM_ROTATOR_RUN_TTL_DAYS", 45),
    partialFilterExpression: {
      status: { $in: ["win", "loss", "expired", "error"] },
      resolvedAt: { $type: "date" },
    },
  },
);

const MomentumRotatorRun =
  mongoose.models.MomentumRotatorRun ||
  mongoose.model("MomentumRotatorRun", momentumRotatorRunSchema);

export default MomentumRotatorRun;
