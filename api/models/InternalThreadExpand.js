import mongoose from "mongoose";

const internalThreadExpandSchema = new mongoose.Schema(
  {
    contentHash: { type: String, required: true, unique: true, index: true },
    sourceText: { type: String, required: true },
    tweets: { type: [String], required: true },
    fullText: { type: String, required: true },
    tweetCount: { type: Number, default: 0 },
    createdByWallet: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

internalThreadExpandSchema.index({ createdAt: -1 });

const InternalThreadExpand =
  mongoose.models.InternalThreadExpand ||
  mongoose.model("InternalThreadExpand", internalThreadExpandSchema);

export default InternalThreadExpand;
