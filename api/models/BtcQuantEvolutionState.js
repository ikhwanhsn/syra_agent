import mongoose from "mongoose";

const btcQuantEvolutionStateSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    lessons: { type: [String], default: [] },
    strategyCooldowns: {
      type: [
        {
          strategyId: Number,
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
    decidedRunsAnalyzed: { type: Number, default: 0 },
    closedPositionsAnalyzed: { type: Number, default: 0 },
  },
  { collection: "btc_quant_evolution_state", timestamps: true },
);

const BtcQuantEvolutionState =
  mongoose.models.BtcQuantEvolutionState ||
  mongoose.model("BtcQuantEvolutionState", btcQuantEvolutionStateSchema);

export default BtcQuantEvolutionState;
