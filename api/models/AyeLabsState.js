import mongoose from "mongoose";

/**
 * Singleton state for the AyeLabs paper experiment desk (Meteora DLMM liquidity agent).
 * Mirrors LpExperimentState but is a fully separate cohort/collection so the AyeLabs
 * desk evolves independently from the LP agent lab.
 */
const ayelabsStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    activeExperimentId: { type: String, required: true, index: true },
    title: { type: String, default: "AyeLabs DLMM compound simulation" },
    startedAt: { type: Date, default: Date.now },
    /** Snapshot of sim economics for this cohort (for UI / audits). */
    simConfig: {
      startingBankSol: { type: Number, default: 10 },
      maxPositionSol: { type: Number, default: 1 },
      maxConcurrentPositions: { type: Number, default: 8 },
      openFeeBps: { type: Number, default: 12 },
      closeFeeBps: { type: Number, default: 12 },
    },
  },
  { collection: "ayelabs_state" },
);

const AyeLabsState =
  mongoose.models.AyeLabsState || mongoose.model("AyeLabsState", ayelabsStateSchema);

export default AyeLabsState;
