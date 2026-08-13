import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

/**
 * Paper (sim) DLMM position for the Meridian experiment desk.
 * Shape matches LpExperimentRun — SOL-based economics, Meteora pool/bin fields — but
 * lives in the `meridian_runs` collection so the desk keeps its own history.
 */
const meridianRunSchema = new mongoose.Schema(
  {
    /** Cohort id — only the active cohort receives new opens from the signal tick. */
    experimentId: { type: String, default: null, index: true },

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
    /** Protocol / LP fee simulation (yield), not chain open/close costs. */
    simPriceDriftPct: { type: Number, default: 0 },
    simPnlPct: { type: Number, default: 0 },
    simPnlUsd: { type: Number, default: 0 },

    /** Estimated Solana + Meteora-style tx costs on notionals (bps per side). */
    simOpenFeeSol: { type: Number, default: 0 },
    simCloseFeeSol: { type: Number, default: 0 },
    /** Economic PnL on the position after open+close chain fees (SOL). */
    simNetPnlSol: { type: Number, default: 0 },

    openedAt: { type: Date, required: true, default: Date.now, index: true },
    lastEvaluatedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "meridian_runs" },
);

meridianRunSchema.index({ experimentId: 1, strategyId: 1, status: 1, createdAt: -1 });
meridianRunSchema.index({ experimentId: 1, status: 1 });
meridianRunSchema.index({ strategyId: 1, status: 1, createdAt: -1 });
meridianRunSchema.index({ status: 1, createdAt: -1 });
meridianRunSchema.index({ strategyId: 1, poolAddress: 1, status: 1, createdAt: -1 });
// TTL: purge settled runs after N days (default 45)
meridianRunSchema.index(
  { resolvedAt: 1 },
  {
    expireAfterSeconds: ttlExpireSeconds("MERIDIAN_RUN_TTL_DAYS", 45),
    partialFilterExpression: {
      status: { $in: ["win", "loss", "expired", "error"] },
      resolvedAt: { $type: "date" },
    },
  },
);

const MeridianRun =
  mongoose.models.MeridianRun || mongoose.model("MeridianRun", meridianRunSchema);

export default MeridianRun;
