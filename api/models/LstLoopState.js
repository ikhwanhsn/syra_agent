import mongoose from "mongoose";

const lstLoopStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    activeExperimentId: { type: String, required: true, index: true },
    title: { type: String, default: "LST loop lab" },
    startedAt: { type: Date, default: Date.now },
    simConfig: {
      startingBankSol: { type: Number, default: 10 },
      maxLeverage: { type: Number, default: 3 },
      targetLtv: { type: Number, default: 0.55 },
    },
  },
  { collection: "lst_loop_state" },
);

const LstLoopState =
  mongoose.models.LstLoopState || mongoose.model("LstLoopState", lstLoopStateSchema);

export default LstLoopState;
