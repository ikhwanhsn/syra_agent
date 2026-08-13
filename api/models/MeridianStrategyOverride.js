/**
 * Runtime strategy definitions for the Meridian experiment desk.
 * Base rows live in config; evolution overwrites specific strategyId slots via upserts here.
 */
import mongoose from "mongoose";

const meridianStrategyOverrideSchema = new mongoose.Schema(
  {
    strategyId: { type: Number, required: true, min: 0, max: 99, unique: true },
    name: { type: String, required: true },
    lpShape: { type: String, required: true, enum: ["spot", "bid_ask", "curve", "mixed"] },
    binsBelow: { type: Number, required: true, min: 0 },
    binsAbove: { type: Number, required: true, min: 0 },
    screeningOverrides: { type: mongoose.Schema.Types.Mixed, default: null },
    signalGate: { type: mongoose.Schema.Types.Mixed, default: null },
    signalWeights: { type: mongoose.Schema.Types.Mixed, default: null },
    exit: { type: mongoose.Schema.Types.Mixed, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "meridian_strategy_overrides" },
);

const MeridianStrategyOverride =
  mongoose.models.MeridianStrategyOverride ||
  mongoose.model("MeridianStrategyOverride", meridianStrategyOverrideSchema);

export default MeridianStrategyOverride;
