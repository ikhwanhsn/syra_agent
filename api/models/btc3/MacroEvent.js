import mongoose from "mongoose";

const macroEventSchema = new mongoose.Schema(
  {
    clusterKey: { type: String, required: true, unique: true, index: true },
    headline: { type: String, required: true },
    summary: { type: String, default: "" },
    articleIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Btc3Article" }],
    articleCount: { type: Number, default: 1 },
    categories: { type: [String], default: [] },
    entityIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Btc3Entity" }],
    publishedAt: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["clustered", "classified", "embedded", "reasoned", "complete"],
      default: "clustered",
    },
    embeddingRefId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3EmbeddingReference", default: null },
    reasoningId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3Reasoning", default: null },
    predictionId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3Prediction", default: null },
  },
  { timestamps: true, collection: "btc3_macro_events" },
);

const Btc3MacroEvent =
  mongoose.models.Btc3MacroEvent || mongoose.model("Btc3MacroEvent", macroEventSchema);

export default Btc3MacroEvent;
