import mongoose from "mongoose";

const lstLoopAgentStateSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99 },
    cashSol: { type: Number, required: true, default: 0 },
    startingBankSol: { type: Number, required: true, default: 10 },
  },
  { timestamps: true, collection: "lst_loop_agent_states" },
);

lstLoopAgentStateSchema.index({ experimentId: 1, strategyId: 1 }, { unique: true });

const LstLoopAgentState =
  mongoose.models.LstLoopAgentState ||
  mongoose.model("LstLoopAgentState", lstLoopAgentStateSchema);

export default LstLoopAgentState;
