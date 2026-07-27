import mongoose from "mongoose";

/**
 * Real Robinhood Chain LP position opened under Outcome Autopilot mandate.
 */
const robinhoodLpRealPositionSchema = new mongoose.Schema(
  {
    positionId: { type: String, required: true, unique: true, index: true },
    mandateId: { type: String, required: true, index: true },
    configId: { type: String, required: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, index: true },
    poolAddress: { type: String, required: true, index: true },
    poolName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["opening", "open", "closing", "closed", "claim_only", "error"],
      default: "opening",
      index: true,
    },
    depositUsd: { type: Number, required: true, min: 0 },
    entryPriceUsd: { type: Number, default: 0 },
    exitPriceUsd: { type: Number, default: null },
    realizedPnlUsd: { type: Number, default: 0 },
    feesEarnedUsd: { type: Number, default: 0 },
    feesClaimedUsd: { type: Number, default: 0 },
    gasUsdSpent: { type: Number, default: 0 },
    openTxHash: { type: String, default: null },
    closeTxHash: { type: String, default: null },
    claimTxHash: { type: String, default: null },
    /** Uniswap v3 NFT position id */
    tokenId: { type: String, default: null, index: true },
    tickLower: { type: Number, default: null },
    tickUpper: { type: Number, default: null },
    liquidity: { type: String, default: null },
    token0: { type: String, default: null },
    token1: { type: String, default: null },
    feeTier: { type: Number, default: null },
    binsBelow: { type: Number, default: null },
    binsAbove: { type: Number, default: null },
    activeTickAtOpen: { type: Number, default: null },
    peakPnlPct: { type: Number, default: 0 },
    exitRules: { type: mongoose.Schema.Types.Mixed, default: {} },
    closeReason: { type: String, default: null },
    dryRun: { type: Boolean, default: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    lastEvaluatedAt: { type: Date, default: null },
    screeningSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    error: { type: String, default: null },
  },
  { collection: "robinhood_lp_real_positions", timestamps: true },
);

robinhoodLpRealPositionSchema.index({ mandateId: 1, status: 1 });
robinhoodLpRealPositionSchema.index({ configId: 1, status: 1 });

if (mongoose.models.RobinhoodLpRealPosition) {
  delete mongoose.models.RobinhoodLpRealPosition;
}

const RobinhoodLpRealPosition = mongoose.model("RobinhoodLpRealPosition", robinhoodLpRealPositionSchema);

export default RobinhoodLpRealPosition;
