import mongoose from "mongoose";

const ExperimentChampionStateSchema = new mongoose.Schema(
  {
    deskId: { type: String, required: true, unique: true, index: true },
    strategyId: { type: mongoose.Schema.Types.Mixed, default: null },
    strategyName: { type: String, default: null },
    sumPnl: { type: Number, default: 0 },
    winRate: { type: Number, default: null },
    decided: { type: Number, default: 0 },
    leaderScore: { type: Number, default: null },
    promotedAt: { type: Date, default: Date.now },
    metric: { type: String, default: "usd" },
  },
  { timestamps: true, collection: "experiment_champion_state" },
);

export default mongoose.models.ExperimentChampionState ||
  mongoose.model("ExperimentChampionState", ExperimentChampionStateSchema);
