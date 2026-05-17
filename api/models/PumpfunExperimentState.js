import mongoose from "mongoose";

const pumpfunExperimentStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    ledger: { type: mongoose.Schema.Types.Mixed, required: true },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "pumpfun_experiment_state" },
);

const PumpfunExperimentState =
  mongoose.models.PumpfunExperimentState ||
  mongoose.model("PumpfunExperimentState", pumpfunExperimentStateSchema);

export default PumpfunExperimentState;
