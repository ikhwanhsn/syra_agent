import mongoose from "mongoose";

const robinhoodLpExperimentStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    activeExperimentId: { type: String, required: true, index: true },
    title: { type: String, default: "Robinhood Chain LP simulation" },
    startedAt: { type: Date, default: Date.now },
    simConfig: {
      startingBankUsd: { type: Number, default: 2000 },
      maxPositionUsd: { type: Number, default: 200 },
      maxConcurrentPositions: { type: Number, default: 10 },
      openFeeUsd: { type: Number, default: 0.025 },
      closeFeeUsd: { type: Number, default: 0.018 },
    },
  },
  { collection: "robinhood_lp_experiment_state" },
);

const RobinhoodLpExperimentState =
  mongoose.models.RobinhoodLpExperimentState ||
  mongoose.model("RobinhoodLpExperimentState", robinhoodLpExperimentStateSchema);

export default RobinhoodLpExperimentState;
