/**
 * Runtime strategy overrides for BTC quant experiment (per lane).
 * Evolution mutates signalGate/exit for static strategy ids 0–14.
 */
import mongoose from "mongoose";

const btcQuantStrategyOverrideSchema = new mongoose.Schema(
  {
    lane: { type: String, required: true, enum: ["btc1", "btc2"], index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99 },
    name: { type: String, required: true },
    signalGate: { type: mongoose.Schema.Types.Mixed, default: null },
    exit: { type: mongoose.Schema.Types.Mixed, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "btc_quant_strategy_overrides" },
);

btcQuantStrategyOverrideSchema.index({ lane: 1, strategyId: 1 }, { unique: true });

const BtcQuantStrategyOverride =
  mongoose.models.BtcQuantStrategyOverride ||
  mongoose.model("BtcQuantStrategyOverride", btcQuantStrategyOverrideSchema);

export default BtcQuantStrategyOverride;
