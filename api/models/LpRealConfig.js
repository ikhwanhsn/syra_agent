import mongoose from "mongoose";

/**
 * Per-agent LP real config. _id is the Solana agent wallet pubkey (string), not ObjectId.
 */
const lpRealConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    agentAddress: { type: String, required: true, unique: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    enabled: { type: Boolean, default: false, index: true },
    experimentId: { type: String, required: true, index: true },
    title: { type: String, default: "LP Real Agent (Meteora DLMM)" },
    startedAt: { type: Date, default: Date.now },
    targetBankSol: { type: Number, default: 10, min: 0 },
    maxPositionSol: { type: Number, default: 1, min: 0 },
    maxConcurrentPositions: { type: Number, default: 10, min: 1, max: 20 },
    reserveSolForFees: { type: Number, default: 0.05, min: 0 },
    strategySelectionMode: {
      type: String,
      enum: ["dynamic_best_net_pnl", "multi_strategy_capital_optimized"],
      default: "multi_strategy_capital_optimized",
    },
    currentStrategyId: { type: Number, default: null, min: 0, max: 99 },
    lastSignalAt: { type: Date, default: null },
    lastResolveAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    lastEnabledBy: { type: String, default: null },
    closeAllRequested: { type: Boolean, default: false },
    /** Wallet equity + deployed at first enable — used for total return / unrealized PnL. */
    capitalBaselineSol: { type: Number, default: null, min: 0 },
  },
  { collection: "lp_real_config", timestamps: true },
);

lpRealConfigSchema.index({ enabled: 1, agentAddress: 1 });

lpRealConfigSchema.pre("validate", function syncIdFromAddress() {
  if (this.agentAddress) {
    this._id = this.agentAddress;
  }
});

if (mongoose.models.LpRealConfig) {
  delete mongoose.models.LpRealConfig;
}

const LpRealConfig = mongoose.model("LpRealConfig", lpRealConfigSchema);

export default LpRealConfig;
