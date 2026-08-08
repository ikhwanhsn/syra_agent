import mongoose from "mongoose";

/**
 * Online pool learning for Robinhood LP paper lab.
 * Updated on each closed trade — score multipliers feed the next signal cycle.
 */
const robinhoodLpLearningStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    lessons: { type: [String], default: [] },
    /** Per-pool win rate / avg PnL / score multiplier. */
    poolStats: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    /** Pools temporarily blocked after repeated losses. */
    poolCooldowns: {
      type: [
        {
          poolAddress: { type: String, required: true },
          reason: { type: String, default: null },
          until: { type: Date, required: true },
        },
      ],
      default: [],
    },
    runsAnalyzed: { type: Number, default: 0 },
    lastLearnedAt: { type: Date, default: null },
  },
  { collection: "robinhood_lp_learning_state", timestamps: true },
);

const RobinhoodLpLearningState =
  mongoose.models.RobinhoodLpLearningState ||
  mongoose.model("RobinhoodLpLearningState", robinhoodLpLearningStateSchema);

export default RobinhoodLpLearningState;
