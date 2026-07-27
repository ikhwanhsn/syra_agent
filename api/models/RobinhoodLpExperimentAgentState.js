import mongoose from "mongoose";

const robinhoodLpExperimentAgentStateSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99 },
    cashUsd: { type: Number, required: true, default: 0 },
    startingBankUsd: { type: Number, required: true, default: 2000 },
  },
  { timestamps: true, collection: "robinhood_lp_experiment_agent_states" },
);

robinhoodLpExperimentAgentStateSchema.index({ experimentId: 1, strategyId: 1 }, { unique: true });

const RobinhoodLpExperimentAgentState =
  mongoose.models.RobinhoodLpExperimentAgentState ||
  mongoose.model("RobinhoodLpExperimentAgentState", robinhoodLpExperimentAgentStateSchema);

export default RobinhoodLpExperimentAgentState;
