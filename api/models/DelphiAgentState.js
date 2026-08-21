import mongoose from "mongoose";

const delphiAgentStateSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99 },
    cashUsd: { type: Number, required: true, default: 0 },
    startingBankUsd: { type: Number, required: true, default: 1000 },
  },
  { timestamps: true, collection: "delphi_agent_states" },
);

delphiAgentStateSchema.index({ experimentId: 1, strategyId: 1 }, { unique: true });

const DelphiAgentState =
  mongoose.models.DelphiAgentState ||
  mongoose.model("DelphiAgentState", delphiAgentStateSchema);

export default DelphiAgentState;
