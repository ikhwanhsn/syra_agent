import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

const mmRunSchema = new mongoose.Schema(
  {
    strategyId: {
      type: String,
      required: true,
      enum: ["tight", "wide", "adaptive"],
      index: true,
    },
    roundTripId: { type: String, default: null, index: true },
    side: { type: String, required: true, enum: ["buy", "sell"] },
    orderType: { type: String, default: "resting", enum: ["resting", "paired"] },

    limitPriceUsd: { type: Number, required: true, min: 0 },
    fillPriceUsd: { type: Number, default: null },
    notionalUsd: { type: Number, required: true, min: 0 },
    volumeUsd: { type: Number, default: 0 },
    syraAmountRaw: { type: String, default: null },
    impactBps: { type: Number, default: null },

    reservationPriceUsd: { type: Number, default: null },
    spreadBps: { type: Number, default: null },
    gridLevel: { type: Number, default: 0 },
    inventoryUsdAfter: { type: Number, default: null },
    midPriceUsd: { type: Number, default: null },
    volRegime: { type: String, enum: ["low", "normal", "high"], default: "normal" },

    status: {
      type: String,
      required: true,
      enum: ["resting", "filled", "closed", "cancelled", "error"],
      index: true,
    },
    resolution: { type: String, default: null },
    simPnlUsd: { type: Number, default: null },
    simPnlPct: { type: Number, default: null },
    pairedRunId: { type: mongoose.Schema.Types.ObjectId, default: null },
    errorMessage: { type: String, default: null },

    quotedAt: { type: Date, default: Date.now },
    filledAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "mm_runs" },
);

mmRunSchema.index({ status: 1, quotedAt: -1 });
mmRunSchema.index({ status: 1, strategyId: 1 });
mmRunSchema.index(
  { resolvedAt: 1 },
  {
    expireAfterSeconds: ttlExpireSeconds("MM_RUN_TTL_DAYS", 60),
    partialFilterExpression: {
      status: { $in: ["closed", "cancelled", "error"] },
      resolvedAt: { $type: "date" },
    },
  },
);

const MmRun = mongoose.models.MmRun || mongoose.model("MmRun", mmRunSchema);

export default MmRun;
