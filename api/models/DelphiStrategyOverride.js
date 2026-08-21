/**
 * Runtime strategy definitions for the Delphi paper lab.
 * Base rows live in config; evolution overwrites specific strategyId slots via upserts here.
 */
import mongoose from "mongoose";

const delphiStrategyOverrideSchema = new mongoose.Schema(
  {
    strategyId: { type: Number, required: true, min: 0, max: 99, unique: true },
    name: { type: String, required: true },
    minTraderQuality: { type: Number, default: 0.4 },
    minConsensus: { type: Number, default: 0.55 },
    minSampleSize: { type: Number, default: 2 },
    biasThreshold: { type: Number, default: 0.2 },
    sizePctOfBank: { type: Number, default: 20 },
    universeFilter: { type: mongoose.Schema.Types.Mixed, default: null },
    signalWeights: { type: mongoose.Schema.Types.Mixed, default: null },
    exit: { type: mongoose.Schema.Types.Mixed, default: null },
    maxHoldHours: { type: Number, default: 36 },
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "delphi_strategy_overrides", strict: false },
);

const DelphiStrategyOverride =
  mongoose.models.DelphiStrategyOverride ||
  mongoose.model("DelphiStrategyOverride", delphiStrategyOverrideSchema);

export default DelphiStrategyOverride;
