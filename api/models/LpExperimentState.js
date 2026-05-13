import mongoose from "mongoose";

const lpExperimentStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    activeExperimentId: { type: String, required: true, index: true },
    title: { type: String, default: "LP compound simulation" },
    startedAt: { type: Date, default: Date.now },
    /** Snapshot of sim economics for this cohort (for UI / audits) */
    simConfig: {
      startingBankSol: { type: Number, default: 10 },
      maxPositionSol: { type: Number, default: 1 },
      maxConcurrentPositions: { type: Number, default: 10 },
      openFeeBps: { type: Number, default: 12 },
      closeFeeBps: { type: Number, default: 12 },
    },
  },
  { collection: "lp_experiment_state" },
);

const LpExperimentState =
  mongoose.models.LpExperimentState || mongoose.model("LpExperimentState", lpExperimentStateSchema);

export default LpExperimentState;
