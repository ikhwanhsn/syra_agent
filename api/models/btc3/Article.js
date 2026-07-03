import mongoose from "mongoose";
import { ttlExpireSeconds } from "../../utils/mongoTtl.js";

const articleSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, index: true },
    providerId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    summary: { type: String, default: "" },
    body: { type: String, default: "" },
    url: { type: String, required: true, index: true },
    language: { type: String, default: "en" },
    translatedTitle: { type: String, default: null },
    translatedSummary: { type: String, default: null },
    contentHash: { type: String, required: true, index: true },
    publishedAt: { type: Date, required: true, index: true },
    macroEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3MacroEvent", default: null, index: true },
    status: {
      type: String,
      enum: ["raw", "translated", "deduplicated", "processed", "skipped"],
      default: "raw",
    },
    categories: { type: [String], default: [] },
    entityIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Btc3Entity" }],
  },
  { timestamps: true, collection: "btc3_articles" },
);

articleSchema.index({ providerId: 1, externalId: 1 }, { unique: true });
articleSchema.index({ title: "text", summary: "text" });
articleSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ttlExpireSeconds("BTC3_ARTICLE_TTL_DAYS", 60) },
);

const Btc3Article =
  mongoose.models.Btc3Article || mongoose.model("Btc3Article", articleSchema);

export default Btc3Article;
