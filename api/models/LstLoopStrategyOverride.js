/**
 * Runtime strategy definitions for the LST loop experiment lab.
 * Base rows live in config; evolution overwrites specific strategyId slots via upserts here.
 */
import mongoose from "mongoose";

const lstLoopStrategyOverrideSchema = new mongoose.Schema(
  {
    strategyId: { type: Number, required: true, min: 0, max: 99, unique: true },
    name: { type: String, required: true },
    universeFilter: { type: mongoose.Schema.Types.Mixed, default: null },
    signalGate: { type: mongoose.Schema.Types.Mixed, default: null },
    signalWeights: { type: mongoose.Schema.Types.Mixed, default: null },
    exit: { type: mongoose.Schema.Types.Mixed, default: null },
    maxHoldHours: { type: Number, default: 48 },
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "lst_loop_strategy_overrides", strict: false },
);

const LstLoopStrategyOverride =
  mongoose.models.LstLoopStrategyOverride ||
  mongoose.model("LstLoopStrategyOverride", lstLoopStrategyOverrideSchema);

export default LstLoopStrategyOverride;
