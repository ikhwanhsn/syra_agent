import mongoose from "mongoose";

const lpRealConfigSchema = new mongoose.Schema(
  {
    /** Same as agent wallet public key (document _id). */
    agentAddress: { type: String, required: true, unique: true, index: true },
    /** Links to AgentWallet.anonymousId — updated when session migrates. */
    anonymousId: { type: String, required: true, index: true },
    /** Master kill switch — cron skips when false. */
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
      enum: ["dynamic_best_net_pnl"],
      default: "dynamic_best_net_pnl",
    },
    currentStrategyId: { type: Number, default: null, min: 0, max: 99 },
    lastSignalAt: { type: Date, default: null },
    lastResolveAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    lastEnabledBy: { type: String, default: null },
    closeAllRequested: { type: Boolean, default: false },
  },
  { collection: "lp_real_config", timestamps: true },
);

lpRealConfigSchema.index({ enabled: 1, agentAddress: 1 });

const LpRealConfig =
  mongoose.models.LpRealConfig || mongoose.model("LpRealConfig", lpRealConfigSchema);

export default LpRealConfig;
