import mongoose from "mongoose";

/**
 * Per-agent AyeLabs real config. _id is the Solana agent wallet pubkey (string), not ObjectId.
 * Ships disabled with hard caps — a separate live layer flips `enabled` only after the paper
 * desk graduates. Kept independent from LpRealConfig so AyeLabs never touches LP capital.
 */
const ayelabsRealConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    agentAddress: { type: String, required: true, unique: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    /** Ship disabled — live opens only after explicit graduation + enable. */
    enabled: { type: Boolean, default: false, index: true },
    experimentId: { type: String, required: true, index: true },
    title: { type: String, default: "AyeLabs Real Agent (Meteora DLMM)" },
    startedAt: { type: Date, default: Date.now },
    /** Hard cap: notional SOL per AyeLabs position. */
    maxPositionSol: { type: Number, default: 0.3, min: 0 },
    /** Hard cap: concurrent live AyeLabs positions. */
    maxConcurrentPositions: { type: Number, default: 2, min: 1, max: 20 },
    /** Circuit breaker: pause opens once realized session loss exceeds this (SOL). */
    dailyMaxLossSol: { type: Number, default: 0.5, min: 0 },
    /** SOL held back for priority fees / rent — never deployed. */
    gasReserve: { type: Number, default: 0.2, min: 0 },
    /** Minimum free SOL required before a new position may open. */
    minSolToOpen: { type: Number, default: 0.55, min: 0 },
    strategySelectionMode: {
      type: String,
      enum: ["dynamic_best_net_pnl", "multi_strategy_capital_optimized"],
      default: "dynamic_best_net_pnl",
    },
    currentStrategyId: { type: Number, default: null, min: 0, max: 99 },
    lastSignalAt: { type: Date, default: null },
    lastResolveAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    lastEnabledBy: { type: String, default: null },
    /** Kill switch: refuse new deposits / opens even if enabled. */
    depositsPaused: { type: Boolean, default: false },
    /** Operator request to unwind every open position; resolve loop honors it. */
    closeAllRequested: { type: Boolean, default: false },
    /** Wallet equity + deployed at first enable — used for total return / unrealized PnL. */
    capitalBaselineSol: { type: Number, default: null, min: 0 },
    /** Set when strategy selector finds no qualified leader — opens paused, resolve still runs. */
    pausedNoStrategyAt: { type: Date, default: null },
    /** Consecutive losses / session drawdown tripped — opens paused until re-enabled. */
    lossPausedAt: { type: Date, default: null },
    /** Public Earn beta: performance fee on net-positive realized PnL (basis points). */
    performanceFeeBps: { type: Number, default: 1000, min: 0, max: 5000 },
    /** When true, agent is listed on the public Earn board (beta allowlist). */
    publicEarnListed: { type: Boolean, default: false, index: true },
    /** Earn personal stats start at this timestamp. */
    publicEarnStartedAt: { type: Date, default: null, index: true },
    /** Bump to force a fresh earn-session cutover. */
    earnStatsEpoch: { type: Number, default: 0, min: 0 },
  },
  { collection: "ayelabs_real_config", timestamps: true },
);

ayelabsRealConfigSchema.index({ enabled: 1, agentAddress: 1 });

ayelabsRealConfigSchema.pre("validate", function syncIdFromAddress() {
  if (this.agentAddress) {
    this._id = this.agentAddress;
  }
});

if (mongoose.models.AyeLabsRealConfig) {
  delete mongoose.models.AyeLabsRealConfig;
}

const AyeLabsRealConfig = mongoose.model("AyeLabsRealConfig", ayelabsRealConfigSchema);

export default AyeLabsRealConfig;
