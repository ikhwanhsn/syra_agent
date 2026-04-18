/**
 * Runtime overrides for standard lab agents (primary / secondary / multi_resource).
 * Wallet-owned agents live in {@link UserCustomStrategy} + suite `user_custom` — never stored here.
 */
import mongoose from "mongoose";

const experimentGateSchema = new mongoose.Schema(
  {
    minConfidence: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], required: true },
  },
  { _id: false },
);

const tradingExperimentLabAgentOverrideSchema = new mongoose.Schema(
  {
    suite: { type: String, required: true, index: true },
    agentId: { type: Number, required: true, min: 0, max: 99 },
    name: { type: String, required: true },
    token: { type: String, required: true },
    bar: { type: String, required: true },
    limit: { type: Number, required: true },
    lookAheadBars: { type: Number, required: true },
    experimentGate: { type: experimentGateSchema, default: null },
    /** When suite is multi_resource: CEX source key (e.g. binance). */
    source: { type: String, default: null },
  },
  { timestamps: true },
);

tradingExperimentLabAgentOverrideSchema.index({ suite: 1, agentId: 1 }, { unique: true });

const TradingExperimentLabAgentOverride =
  mongoose.models.TradingExperimentLabAgentOverride ||
  mongoose.model("TradingExperimentLabAgentOverride", tradingExperimentLabAgentOverrideSchema);

export default TradingExperimentLabAgentOverride;
