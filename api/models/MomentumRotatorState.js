import mongoose from "mongoose";

const momentumRotatorStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    activeExperimentId: { type: String, required: true, index: true },
    title: { type: String, default: "Momentum rotator lab" },
    startedAt: { type: Date, default: Date.now },
    simConfig: {
      startingBankUsd: { type: Number, default: 1000 },
      maxConcurrentPositions: { type: Number, default: 3 },
      maxPositionPct: { type: Number, default: 100 },
    },
  },
  { collection: "momentum_rotator_state" },
);

const MomentumRotatorState =
  mongoose.models.MomentumRotatorState ||
  mongoose.model("MomentumRotatorState", momentumRotatorStateSchema);

export default MomentumRotatorState;
