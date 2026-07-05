import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

const scalperRunSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, index: true },
    mint: { type: String, required: true },
    assetClass: { type: String, enum: ["crypto", "equity"], default: "crypto" },
    side: { type: String, enum: ["long"], default: "long" },

    source: {
      type: String,
      required: true,
      enum: ["btc1", "btc2", "btc3", "stocks", "momentum"],
    },
    opportunityScore: { type: Number, default: 0 },
    rationale: { type: String, default: null },
    opportunitySnapshot: { type: mongoose.Schema.Types.Mixed, default: null },

    notionalUsd: { type: Number, required: true, min: 0 },
    entryPriceUsd: { type: Number, required: true, min: 0 },
    entryTokenAmountRaw: { type: String, default: null },
    entryFillSource: { type: String, default: "jupiter_quote" },
    entryImpactBps: { type: Number, default: null },
    entryMidPriceUsd: { type: Number, default: null },

    takeProfitPriceUsd: { type: Number, default: null },
    stopLossPriceUsd: { type: Number, default: null },
    maxHoldUntil: { type: Date, default: null },

    exitPriceUsd: { type: Number, default: null },
    exitFillSource: { type: String, default: null },
    exitImpactBps: { type: Number, default: null },

    status: {
      type: String,
      required: true,
      enum: ["open", "win", "loss", "expired", "error"],
      index: true,
    },
    resolution: { type: String, default: null },
    simPnlUsd: { type: Number, default: null },
    simPnlPct: { type: Number, default: null },
    errorMessage: { type: String, default: null },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    lastEvaluatedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "scalper_runs" },
);

scalperRunSchema.index({ status: 1, createdAt: -1 });
scalperRunSchema.index({ status: 1, openedAt: -1 });
scalperRunSchema.index(
  { resolvedAt: 1 },
  {
    expireAfterSeconds: ttlExpireSeconds("SCALPER_RUN_TTL_DAYS", 45),
    partialFilterExpression: {
      status: { $in: ["win", "loss", "expired", "error"] },
      resolvedAt: { $type: "date" },
    },
  },
);

const ScalperRun = mongoose.models.ScalperRun || mongoose.model("ScalperRun", scalperRunSchema);

export default ScalperRun;
