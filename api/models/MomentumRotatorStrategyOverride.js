/**
 * Runtime strategy definitions for the momentum rotator experiment lab.
 * Base rows live in config; evolution overwrites specific strategyId slots via upserts here.
 */
import mongoose from "mongoose";

const momentumRotatorStrategyOverrideSchema = new mongoose.Schema(
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
  { timestamps: true, collection: "momentum_rotator_strategy_overrides", strict: false },
);

const MomentumRotatorStrategyOverride =
  mongoose.models.MomentumRotatorStrategyOverride ||
  mongoose.model("MomentumRotatorStrategyOverride", momentumRotatorStrategyOverrideSchema);

export default MomentumRotatorStrategyOverride;
