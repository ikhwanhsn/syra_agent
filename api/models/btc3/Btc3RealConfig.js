import mongoose from "mongoose";

/**
 * Singleton config for BTC3 macro real agent (USDC ↔ cbBTC allocation via Jupiter).
 */
const btc3RealConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    enabled: { type: Boolean, default: false, index: true },
    experimentId: { type: String, default: null, index: true },
    title: { type: String, default: "BTC3 macro real (cbBTC allocation)" },
    startedAt: { type: Date, default: null },
    agentAddress: { type: String, default: null, index: true },
    anonymousId: { type: String, default: null, index: true },
    /** Max USD notional per rebalance swap. */
    maxNotionalUsd: { type: Number, default: 200, min: 0 },
    /** Keep this much USDC unspent as fee/gas reserve. */
    reserveUsdc: { type: Number, default: 25, min: 0 },
    /** Minimum allocation drift (%) before executing a real rebalance. */
    minRebalancePct: { type: Number, default: 5, min: 0.5, max: 50 },
    slippageBps: { type: Number, default: 50, min: 1, max: 500 },
    lastRebalanceAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    lastEnabledBy: { type: String, default: null },
    capitalBaselineUsd: { type: Number, default: null, min: 0 },
    processing: { type: Boolean, default: false },
  },
  { collection: "btc3_real_config", timestamps: true },
);

const Btc3RealConfig =
  mongoose.models.Btc3RealConfig || mongoose.model("Btc3RealConfig", btc3RealConfigSchema);

export default Btc3RealConfig;
