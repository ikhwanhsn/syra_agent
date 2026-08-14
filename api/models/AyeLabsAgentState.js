import mongoose from "mongoose";

/**
 * Per-strategy virtual bank for the AyeLabs paper desk.
 * cashSol is free SOL not currently deployed in open positions (open fees paid from cash).
 */
const ayelabsAgentStateSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99 },
    /** Free SOL not deployed in open positions (after open fees are paid from cash). */
    cashSol: { type: Number, required: true, default: 0 },
    startingBankSol: { type: Number, required: true, default: 10 },
  },
  { timestamps: true, collection: "ayelabs_agent_states" },
);

ayelabsAgentStateSchema.index({ experimentId: 1, strategyId: 1 }, { unique: true });

const AyeLabsAgentState =
  mongoose.models.AyeLabsAgentState ||
  mongoose.model("AyeLabsAgentState", ayelabsAgentStateSchema);

export default AyeLabsAgentState;
