import mongoose from "mongoose";

const lpRealEvolutionStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "global" },
    lessons: { type: [String], default: [] },
    poolCooldowns: {
      type: [
        {
          poolAddress: String,
          reason: String,
          until: Date,
        },
      ],
      default: [],
    },
    thresholdOverrides: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastEvolutionAt: { type: Date, default: null },
    lastEvolutionSummary: { type: String, default: null },
    closedPositionsAnalyzed: { type: Number, default: 0 },
  },
  { collection: "lp_real_evolution_state", timestamps: true },
);

if (mongoose.models.LpRealEvolutionState) {
  delete mongoose.models.LpRealEvolutionState;
}

const LpRealEvolutionState = mongoose.model("LpRealEvolutionState", lpRealEvolutionStateSchema);
export default LpRealEvolutionState;
