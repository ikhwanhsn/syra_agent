import mongoose from "mongoose";

const predictionSchema = new mongoose.Schema(
  {
    macroEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3MacroEvent", required: true, index: true },
    reasoningId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3Reasoning", default: null },
    horizons: {
      h24: {
        expectedReturn: { type: Number, default: null },
        expectedDownside: { type: Number, default: null },
        expectedVolatility: { type: Number, default: null },
        confidence: { type: Number, default: null },
      },
      d7: {
        expectedReturn: { type: Number, default: null },
        expectedDownside: { type: Number, default: null },
        expectedVolatility: { type: Number, default: null },
        confidence: { type: Number, default: null },
      },
      d30: {
        expectedReturn: { type: Number, default: null },
        expectedDownside: { type: Number, default: null },
        expectedVolatility: { type: Number, default: null },
        confidence: { type: Number, default: null },
      },
    },
    model: { type: String, default: null },
    status: { type: String, enum: ["pending", "complete", "failed", "unavailable"], default: "pending" },
  },
  { timestamps: true, collection: "btc3_predictions" },
);

const Btc3Prediction =
  mongoose.models.Btc3Prediction || mongoose.model("Btc3Prediction", predictionSchema);

export default Btc3Prediction;
