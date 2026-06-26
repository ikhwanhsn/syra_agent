import mongoose from "mongoose";

/**
 * Singleton config for BTC quant real onchain agent (cbBTC via Jupiter).
 */
const btcQuantRealConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    enabled: { type: Boolean, default: false, index: true },
    experimentId: { type: String, required: true, index: true },
    title: { type: String, default: "BTC quant real (cbBTC)" },
    startedAt: { type: Date, default: null },
    /** Solana invest-wallet pubkey used for Jupiter swaps. */
    agentAddress: { type: String, default: null, index: true },
    anonymousId: { type: String, default: null, index: true },
    leaderStrategyId: { type: Number, default: null, min: 0, max: 99 },
    maxNotionalUsd: { type: Number, default: 200, min: 0 },
    reserveUsdc: { type: Number, default: 25, min: 0 },
    slippageBps: { type: Number, default: 50, min: 1, max: 500 },
    lastSignalAt: { type: Date, default: null },
    lastResolveAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    lastEnabledBy: { type: String, default: null },
    closeAllRequested: { type: Boolean, default: false },
    capitalBaselineUsd: { type: Number, default: null, min: 0 },
  },
  { collection: "btc_quant_real_config", timestamps: true },
);

const BtcQuantRealConfig =
  mongoose.models.BtcQuantRealConfig ||
  mongoose.model("BtcQuantRealConfig", btcQuantRealConfigSchema);

export default BtcQuantRealConfig;
