import mongoose from "mongoose";

const lpExperimentAgentStateSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99 },
    /** Free SOL not deployed in open positions (after open fees are paid from cash). */
    cashSol: { type: Number, required: true, default: 0 },
    startingBankSol: { type: Number, required: true, default: 10 },
  },
  { timestamps: true, collection: "lp_experiment_agent_states" },
);

lpExperimentAgentStateSchema.index({ experimentId: 1, strategyId: 1 }, { unique: true });

const LpExperimentAgentState =
  mongoose.models.LpExperimentAgentState ||
  mongoose.model("LpExperimentAgentState", lpExperimentAgentStateSchema);

export default LpExperimentAgentState;
