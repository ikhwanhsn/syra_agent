import mongoose from "mongoose";

/**
 * Per-mandate Robinhood Chain LP Autopilot config (real execution pilot).
 */
const robinhoodLpRealConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    mandateId: { type: String, required: true, unique: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    agentAddress: { type: String, required: true, index: true },
    /** Privy ethereum server wallet id used for Robinhood Chain signing. */
    privyWalletId: { type: String, default: null, index: true },
    enabled: { type: Boolean, default: false, index: true },
    dryRun: { type: Boolean, default: true },
    targetBankUsd: { type: Number, default: 25, min: 0 },
    maxPositionUsd: { type: Number, default: 5, min: 0 },
    maxConcurrentPositions: { type: Number, default: 2, min: 1, max: 5 },
    currentStrategyId: { type: Number, default: null },
    lastSignalAt: { type: Date, default: null },
    lastResolveAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    capitalBaselineUsd: { type: Number, default: null },
    closeAllRequested: { type: Boolean, default: false },
    performanceFeeBps: { type: Number, default: 2000, min: 0, max: 5000 },
  },
  { collection: "robinhood_lp_real_config", timestamps: true },
);

robinhoodLpRealConfigSchema.index({ enabled: 1, dryRun: 1 });

if (mongoose.models.RobinhoodLpRealConfig) {
  delete mongoose.models.RobinhoodLpRealConfig;
}

const RobinhoodLpRealConfig = mongoose.model("RobinhoodLpRealConfig", robinhoodLpRealConfigSchema);

export default RobinhoodLpRealConfig;
