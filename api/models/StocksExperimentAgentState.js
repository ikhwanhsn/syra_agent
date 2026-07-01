import mongoose from "mongoose";

const stocksExperimentAgentStateSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99 },
    cashUsd: { type: Number, required: true, default: 0 },
    startingBankUsd: { type: Number, required: true, default: 1000 },
  },
  { timestamps: true, collection: "stocks_experiment_agent_states" },
);

stocksExperimentAgentStateSchema.index({ experimentId: 1, strategyId: 1 }, { unique: true });

const StocksExperimentAgentState =
  mongoose.models.StocksExperimentAgentState ||
  mongoose.model("StocksExperimentAgentState", stocksExperimentAgentStateSchema);

export default StocksExperimentAgentState;
