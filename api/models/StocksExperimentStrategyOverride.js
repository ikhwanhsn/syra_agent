/**
 * Runtime strategy definitions for the stocks news experiment lab.
 * Base rows live in config; evolution overwrites specific strategyId slots via upserts here.
 */
import mongoose from "mongoose";

const stocksExperimentStrategyOverrideSchema = new mongoose.Schema(
  {
    strategyId: { type: Number, required: true, min: 0, max: 99, unique: true },
    name: { type: String, required: true },
    minSentiment: { type: Number, default: 0 },
    eventWeight: { type: Number, default: 1 },
    momentumConfirm: { type: Boolean, default: false },
    maxHoldHours: { type: Number, default: 48 },
    universeFilter: { type: mongoose.Schema.Types.Mixed, default: null },
    signalGate: { type: mongoose.Schema.Types.Mixed, default: null },
    signalWeights: { type: mongoose.Schema.Types.Mixed, default: null },
    exit: { type: mongoose.Schema.Types.Mixed, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true, collection: "stocks_experiment_strategy_overrides" },
);

const StocksExperimentStrategyOverride =
  mongoose.models.StocksExperimentStrategyOverride ||
  mongoose.model("StocksExperimentStrategyOverride", stocksExperimentStrategyOverrideSchema);

export default StocksExperimentStrategyOverride;
