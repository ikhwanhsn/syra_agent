import mongoose from "mongoose";

const stocksExperimentStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    activeExperimentId: { type: String, required: true, index: true },
    title: { type: String, default: "Stocks news trading lab" },
    startedAt: { type: Date, default: Date.now },
    simConfig: {
      startingBankUsd: { type: Number, default: 1000 },
      maxConcurrentPositions: { type: Number, default: 3 },
      maxPositionPct: { type: Number, default: 100 },
    },
  },
  { collection: "stocks_experiment_state" },
);

const StocksExperimentState =
  mongoose.models.StocksExperimentState ||
  mongoose.model("StocksExperimentState", stocksExperimentStateSchema);

export default StocksExperimentState;
