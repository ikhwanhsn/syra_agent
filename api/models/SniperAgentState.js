import mongoose from "mongoose";

const sniperAgentStateSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99 },
    cashSol: { type: Number, required: true, default: 0 },
    startingBankSol: { type: Number, required: true, default: 5 },
  },
  { timestamps: true, collection: "sniper_agent_states" },
);

sniperAgentStateSchema.index({ experimentId: 1, strategyId: 1 }, { unique: true });

const SniperAgentState =
  mongoose.models.SniperAgentState ||
  mongoose.model("SniperAgentState", sniperAgentStateSchema);

export default SniperAgentState;
