import mongoose from "mongoose";

/**
 * Per-agent momentum rotator real config. _id is the Solana agent wallet pubkey (string), not ObjectId.
 */
const momentumRotatorRealConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    agentAddress: { type: String, required: true, unique: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    enabled: { type: Boolean, default: false, index: true },
    experimentId: { type: String, required: true, index: true },
    title: { type: String, default: "Momentum Rotator Real Agent" },
    startedAt: { type: Date, default: Date.now },
    targetBankUsd: { type: Number, default: 100, min: 0 },
    maxPositionUsd: { type: Number, default: 50, min: 0 },
    maxConcurrentPositions: { type: Number, default: 3, min: 1, max: 20 },
    reserveUsd: { type: Number, default: 5, min: 0 },
    currentStrategyId: { type: Number, default: null, min: 0, max: 99 },
    lastSignalAt: { type: Date, default: null },
    lastResolveAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    closeAllRequested: { type: Boolean, default: false },
    /** Wallet equity + deployed at first enable — used for total return / unrealized PnL. */
    capitalBaselineUsd: { type: Number, default: null, min: 0 },
    /** Public Earn Yield beta: performance fee on net-positive realized PnL (0–5000 bps). */
    performanceFeeBps: { type: Number, default: 1000, min: 0, max: 5000 },
    /** Cap deposit for public Earn Yield beta (USD). */
    publicMaxDepositUsd: { type: Number, default: 250, min: 0.1, max: 10000 },
    /** When true, agent is listed on the public Earn Yield board (beta allowlist). */
    publicEarnListed: { type: Boolean, default: false, index: true },
    /** Kill switch: refuse new deposits / opens even if enabled. */
    depositsPaused: { type: Boolean, default: false },
  },
  { collection: "momentum_rotator_real_config", timestamps: true },
);

momentumRotatorRealConfigSchema.index({ enabled: 1, agentAddress: 1 });

momentumRotatorRealConfigSchema.pre("validate", function syncIdFromAddress() {
  if (this.agentAddress) {
    this._id = this.agentAddress;
  }
});

if (mongoose.models.MomentumRotatorRealConfig) {
  delete mongoose.models.MomentumRotatorRealConfig;
}

const MomentumRotatorRealConfig = mongoose.model(
  "MomentumRotatorRealConfig",
  momentumRotatorRealConfigSchema,
);

export default MomentumRotatorRealConfig;
