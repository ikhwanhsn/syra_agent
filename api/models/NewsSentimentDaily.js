import mongoose from "mongoose";

/**
 * Daily aggregated news sentiment per section (general, alltickers, or ticker:SYMBOL).
 * Rolling window — TTL index drops docs after ~35 days.
 */
const newsSentimentDailySchema = new mongoose.Schema(
  {
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ },
    section: { type: String, required: true, index: true },
    Positive: { type: Number, required: true, default: 0 },
    Negative: { type: Number, required: true, default: 0 },
    Neutral: { type: Number, required: true, default: 0 },
    Total: { type: Number, required: true, default: 0 },
    sentiment_score: { type: Number, required: true, default: 0 },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

newsSentimentDailySchema.index({ date: 1, section: 1 }, { unique: true });
newsSentimentDailySchema.index(
  { generatedAt: 1 },
  { expireAfterSeconds: 35 * 24 * 60 * 60 },
);

const NewsSentimentDaily =
  mongoose.models.NewsSentimentDaily ||
  mongoose.model("NewsSentimentDaily", newsSentimentDailySchema);

export default NewsSentimentDaily;
