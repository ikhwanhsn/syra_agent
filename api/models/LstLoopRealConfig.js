import mongoose from "mongoose";

/**
 * Per-agent LST loop real config. _id is the Solana agent wallet pubkey (string), not ObjectId.
 */
const lstLoopRealConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    agentAddress: { type: String, required: true, unique: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    enabled: { type: Boolean, default: false, index: true },
    experimentId: { type: String, required: true, index: true },
    title: { type: String, default: "LST Loop Real Agent" },
    startedAt: { type: Date, default: Date.now },
    targetBankSol: { type: Number, default: 5, min: 0 },
    maxPositionSol: { type: Number, default: 2, min: 0 },
    maxLeverage: { type: Number, default: 2.5, min: 1 },
    targetLtv: { type: Number, default: 0.5, min: 0, max: 1 },
    minHealthFactor: { type: Number, default: 1.3, min: 1 },
    maxConcurrentPositions: { type: Number, default: 3, min: 1, max: 20 },
    reserveSolForFees: { type: Number, default: 0.05, min: 0 },
    currentStrategyId: { type: Number, default: null, min: 0, max: 99 },
    lastSignalAt: { type: Date, default: null },
    lastResolveAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    closeAllRequested: { type: Boolean, default: false },
    /** Wallet equity + deployed at first enable — used for total return / unrealized PnL. */
    capitalBaselineSol: { type: Number, default: null, min: 0 },
    /** Public Earn Yield beta: performance fee on net-positive realized PnL (0–5000 bps). */
    performanceFeeBps: { type: Number, default: 1000, min: 0, max: 5000 },
    /** Cap deposit for public Earn Yield beta (SOL). */
    publicMaxDepositSol: { type: Number, default: 10, min: 0.1, max: 50 },
    /** When true, agent is listed on the public Earn Yield board (beta allowlist). */
    publicEarnListed: { type: Boolean, default: false, index: true },
    /** Kill switch: refuse new deposits / opens even if enabled. */
    depositsPaused: { type: Boolean, default: false },
  },
  { collection: "lst_loop_real_config", timestamps: true },
);

lstLoopRealConfigSchema.index({ enabled: 1, agentAddress: 1 });

lstLoopRealConfigSchema.pre("validate", function syncIdFromAddress() {
  if (this.agentAddress) {
    this._id = this.agentAddress;
  }
});

if (mongoose.models.LstLoopRealConfig) {
  delete mongoose.models.LstLoopRealConfig;
}

const LstLoopRealConfig = mongoose.model("LstLoopRealConfig", lstLoopRealConfigSchema);

export default LstLoopRealConfig;
