import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

const sniperRunSchema = new mongoose.Schema(
  {
    experimentId: { type: String, default: null, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99, index: true },
    strategyName: { type: String, required: true },

    mint: { type: String, required: true, index: true },
    symbol: { type: String, required: true, index: true },

    entryPriceUsd: { type: Number, required: true, min: 0 },
    notionalSol: { type: Number, required: true, min: 0 },
    notionalUsd: { type: Number, required: true, min: 0 },

    syraAlphaScore: { type: Number, default: null },
    rugcheckScore: { type: Number, default: null },

    signalSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },

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
    peakPnlPct: { type: Number, default: null },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    lastEvaluatedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "sniper_runs" },
);

sniperRunSchema.index({ experimentId: 1, strategyId: 1, status: 1, createdAt: -1 });
sniperRunSchema.index({ experimentId: 1, status: 1, createdAt: -1 });
sniperRunSchema.index({ strategyId: 1, status: 1, createdAt: -1 });
sniperRunSchema.index({ status: 1, createdAt: -1 });
sniperRunSchema.index(
  { resolvedAt: 1 },
  {
    expireAfterSeconds: ttlExpireSeconds("SNIPER_RUN_TTL_DAYS", 45),
    partialFilterExpression: {
      status: { $in: ["win", "loss", "expired", "error"] },
      resolvedAt: { $type: "date" },
    },
  },
);

const SniperRun = mongoose.models.SniperRun || mongoose.model("SniperRun", sniperRunSchema);

export default SniperRun;
