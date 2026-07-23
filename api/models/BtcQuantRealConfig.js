import mongoose from "mongoose";

/**
 * Per-lane config for BTC quant real onchain agent (cbBTC via Jupiter).
 * _id matches lane stateId: "singleton" (btc1), "singleton-btc2" (btc2).
 */
const btcQuantRealConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    lane: { type: String, default: "btc1", index: true, enum: ["btc1", "btc2"] },
    enabled: { type: Boolean, default: false, index: true },
    experimentId: { type: String, required: true, index: true },
    title: { type: String, default: "BTC quant real (cbBTC)" },
    startedAt: { type: Date, default: null },
    /** Solana invest-wallet pubkey used for Jupiter swaps. */
    agentAddress: { type: String, default: null, index: true },
    anonymousId: { type: String, default: null, index: true },
    leaderStrategyId: { type: Number, default: null, min: 0, max: 999 },
    maxNotionalUsd: { type: Number, default: 200, min: 0 },
    reserveUsdc: { type: Number, default: 25, min: 0 },
    slippageBps: { type: Number, default: 50, min: 1, max: 500 },
    lastSignalAt: { type: Date, default: null },
    lastResolveAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    lastEnabledBy: { type: String, default: null },
    closeAllRequested: { type: Boolean, default: false },
    capitalBaselineUsd: { type: Number, default: null, min: 0 },
    /** Earn Yield public listing + fee/cap fields. */
    performanceFeeBps: { type: Number, default: 1000, min: 0, max: 5000 },
    publicMaxDepositUsdc: { type: Number, default: 200, min: 10, max: 5000 },
    publicEarnListed: { type: Boolean, default: false, index: true },
    depositsPaused: { type: Boolean, default: false },
  },
  { collection: "btc_quant_real_config", timestamps: true },
);

const BtcQuantRealConfig =
  mongoose.models.BtcQuantRealConfig ||
  mongoose.model("BtcQuantRealConfig", btcQuantRealConfigSchema);

export default BtcQuantRealConfig;
