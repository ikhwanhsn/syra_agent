import mongoose from "mongoose";

const momentumRotatorAgentStateSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99 },
    cashUsd: { type: Number, required: true, default: 0 },
    startingBankUsd: { type: Number, required: true, default: 1000 },
  },
  { timestamps: true, collection: "momentum_rotator_agent_states" },
);

momentumRotatorAgentStateSchema.index({ experimentId: 1, strategyId: 1 }, { unique: true });

const MomentumRotatorAgentState =
  mongoose.models.MomentumRotatorAgentState ||
  mongoose.model("MomentumRotatorAgentState", momentumRotatorAgentStateSchema);

export default MomentumRotatorAgentState;
