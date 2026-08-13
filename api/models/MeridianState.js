import mongoose from "mongoose";

/**
 * Singleton state for the Meridian paper experiment desk (Meteora DLMM liquidity agent).
 * Mirrors LpExperimentState but is a fully separate cohort/collection so the Meridian
 * desk evolves independently from the LP agent lab.
 */
const meridianStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    activeExperimentId: { type: String, required: true, index: true },
    title: { type: String, default: "Meridian DLMM compound simulation" },
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
  { collection: "meridian_state" },
);

const MeridianState =
  mongoose.models.MeridianState || mongoose.model("MeridianState", meridianStateSchema);

export default MeridianState;
