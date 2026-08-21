import mongoose from "mongoose";

const delphiStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    activeExperimentId: { type: String, required: true, index: true },
    title: { type: String, default: "Delphi Polymarket-mirror lab" },
    startedAt: { type: Date, default: Date.now },
    simConfig: {
      startingBankUsd: { type: Number, default: 1000 },
      maxConcurrentPositions: { type: Number, default: 3 },
      maxPositionPct: { type: Number, default: 25 },
    },
  },
  { collection: "delphi_state" },
);

const DelphiState =
  mongoose.models.DelphiState || mongoose.model("DelphiState", delphiStateSchema);

export default DelphiState;
