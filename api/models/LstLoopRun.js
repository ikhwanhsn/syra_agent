import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

const lstLoopRunSchema = new mongoose.Schema(
  {
    experimentId: { type: String, default: null, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99, index: true },
    strategyName: { type: String, required: true },

    lstSymbol: { type: String, required: true, enum: ["mSOL", "JitoSOL"], index: true },

    leverage: { type: Number, required: true, min: 1 },
    entryLtv: { type: Number, required: true, min: 0, max: 1 },
    notionalSol: { type: Number, required: true, min: 0 },

    signalSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    healthFactor: { type: Number, default: null },
    borrowRateApr: { type: Number, default: null },
    lstApy: { type: Number, default: null },

    status: {
      type: String,
      required: true,
      enum: ["open", "win", "loss", "expired", "skipped", "error"],
      index: true,
    },
    resolution: { type: String, default: null },
    errorMessage: { type: String, default: null },

    simPnlSol: { type: Number, default: null },
    simPnlUsd: { type: Number, default: null },
    simPnlPct: { type: Number, default: null },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    lastEvaluatedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "lst_loop_runs" },
);

lstLoopRunSchema.index({ experimentId: 1, strategyId: 1, status: 1, createdAt: -1 });
lstLoopRunSchema.index({ experimentId: 1, status: 1, createdAt: -1 });
lstLoopRunSchema.index({ strategyId: 1, status: 1, createdAt: -1 });
lstLoopRunSchema.index({ status: 1, createdAt: -1 });
lstLoopRunSchema.index(
  { resolvedAt: 1 },
  {
    expireAfterSeconds: ttlExpireSeconds("LST_LOOP_RUN_TTL_DAYS", 45),
    partialFilterExpression: {
      status: { $in: ["win", "loss", "expired", "error"] },
      resolvedAt: { $type: "date" },
    },
  },
);

const LstLoopRun =
  mongoose.models.LstLoopRun || mongoose.model("LstLoopRun", lstLoopRunSchema);

export default LstLoopRun;
