import mongoose from "mongoose";

const scalperLearningStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    lessons: { type: [String], default: [] },
    thresholdOverrides: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    /** Per-source win rate / avg PnL / score multiplier. */
    sourceStats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    /** Per-symbol win rate / avg PnL. */
    symbolStats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    /** Sources temporarily blocked after repeated losses. */
    sourceCooldowns: {
      type: [
        {
          source: { type: String, required: true },
          reason: { type: String, default: null },
          until: { type: Date, required: true },
        },
      ],
      default: [],
    },
    /** Symbols temporarily blocked after repeated losses. */
    symbolCooldowns: {
      type: [
        {
          symbol: { type: String, required: true },
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
  { collection: "scalper_learning_state", timestamps: true },
);

const ScalperLearningState =
  mongoose.models.ScalperLearningState ||
  mongoose.model("ScalperLearningState", scalperLearningStateSchema);

export default ScalperLearningState;
