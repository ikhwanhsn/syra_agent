import mongoose from "mongoose";

const newsSourceSchema = new mongoose.Schema(
  {
    providerId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ["rss", "api", "unavailable"], default: "rss" },
    category: { type: String, default: "general" },
    url: { type: String, default: null },
    enabled: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "todo", "disabled", "error"], default: "active" },
    lastFetchAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    articlesFetched: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "btc3_news_sources" },
);

const Btc3NewsSource =
  mongoose.models.Btc3NewsSource || mongoose.model("Btc3NewsSource", newsSourceSchema);

export default Btc3NewsSource;
