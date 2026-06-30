import mongoose from "mongoose";

const btc3LearningStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    lessons: { type: [String], default: [] },
    thresholdOverrides: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastEvolutionAt: { type: Date, default: null },
    lastEvolutionSummary: { type: String, default: null },
    rebalancesAnalyzed: { type: Number, default: 0 },
  },
  { collection: "btc3_learning_state", timestamps: true },
);

const Btc3LearningState =
  mongoose.models.Btc3LearningState ||
  mongoose.model("Btc3LearningState", btc3LearningStateSchema);

export default Btc3LearningState;
