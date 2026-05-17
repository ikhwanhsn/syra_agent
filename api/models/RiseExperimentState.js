import mongoose from "mongoose";

const riseExperimentStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    ledger: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "rise_experiment_state" },
);

const RiseExperimentState =
  mongoose.models.RiseExperimentState || mongoose.model("RiseExperimentState", riseExperimentStateSchema);

export default RiseExperimentState;
