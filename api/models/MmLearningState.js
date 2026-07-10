import mongoose from "mongoose";

const mmLearningStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    lessons: { type: [String], default: [] },
    thresholdOverrides: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    /** Per-strategy volume / PnL / efficiency stats. */
    strategyStats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    /** Winning strategy id promoted by learning. */
    promotedStrategyId: { type: String, default: "adaptive" },
    /** Strategies temporarily blocked after losses. */
    strategyCooldowns: {
      type: [
        {
          strategyId: { type: String, required: true },
          reason: { type: String, default: null },
          until: { type: Date, required: true },
        },
      ],
      default: [],
    },
    lastEvolutionAt: { type: Date, default: null },
    lastEvolutionSummary: { type: String, default: null },
    runsAnalyzed: { type: Number, default: 0 },
  },
  { collection: "mm_learning_state", timestamps: true },
);

const MmLearningState =
  mongoose.models.MmLearningState || mongoose.model("MmLearningState", mmLearningStateSchema);

export default MmLearningState;
