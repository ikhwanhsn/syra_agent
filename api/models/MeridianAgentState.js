import mongoose from "mongoose";

/**
 * Per-strategy virtual bank for the Meridian paper desk.
 * cashSol is free SOL not currently deployed in open positions (open fees paid from cash).
 */
const meridianAgentStateSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    strategyId: { type: Number, required: true, min: 0, max: 99 },
    /** Free SOL not deployed in open positions (after open fees are paid from cash). */
    cashSol: { type: Number, required: true, default: 0 },
    startingBankSol: { type: Number, required: true, default: 10 },
  },
  { timestamps: true, collection: "meridian_agent_states" },
);

meridianAgentStateSchema.index({ experimentId: 1, strategyId: 1 }, { unique: true });

const MeridianAgentState =
  mongoose.models.MeridianAgentState ||
  mongoose.model("MeridianAgentState", meridianAgentStateSchema);

export default MeridianAgentState;
