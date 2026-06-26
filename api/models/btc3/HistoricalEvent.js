import mongoose from "mongoose";

const historicalEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    categories: { type: [String], default: [] },
    eventDate: { type: Date, required: true, index: true },
    btcReturn24h: { type: Number, default: null },
    btcReturn7d: { type: Number, default: null },
    btcReturn30d: { type: Number, default: null },
    durationDays: { type: Number, default: null },
    confidence: { type: Number, default: 0.5, min: 0, max: 1 },
    source: { type: String, default: "manual" },
    embeddingRefId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3EmbeddingReference", default: null },
    macroEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3MacroEvent", default: null },
  },
  { timestamps: true, collection: "btc3_historical_events" },
);

const Btc3HistoricalEvent =
  mongoose.models.Btc3HistoricalEvent ||
  mongoose.model("Btc3HistoricalEvent", historicalEventSchema);

export default Btc3HistoricalEvent;
