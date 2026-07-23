import mongoose from "mongoose";

const sniperStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    activeExperimentId: { type: String, required: true, index: true },
    title: { type: String, default: "Alpha sniper lab" },
    startedAt: { type: Date, default: Date.now },
    simConfig: {
      startingBankSol: { type: Number, default: 5 },
      maxConcurrentPositions: { type: Number, default: 5 },
      maxPositionSol: { type: Number, default: 0.5 },
    },
  },
  { collection: "sniper_state" },
);

const SniperState =
  mongoose.models.SniperState || mongoose.model("SniperState", sniperStateSchema);

export default SniperState;
