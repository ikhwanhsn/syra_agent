import mongoose from "mongoose";

const btcQuantExperimentStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    activeExperimentId: { type: String, required: true, index: true },
    title: { type: String, default: "BTC onchain quant lab" },
    startedAt: { type: Date, default: Date.now },
    simConfig: {
      startingBankUsd: { type: Number, default: 1000 },
      maxConcurrentPositions: { type: Number, default: 1 },
    },
  },
  { collection: "btc_quant_experiment_state" },
);

const BtcQuantExperimentState =
  mongoose.models.BtcQuantExperimentState ||
  mongoose.model("BtcQuantExperimentState", btcQuantExperimentStateSchema);

export default BtcQuantExperimentState;
