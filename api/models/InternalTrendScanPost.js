import mongoose from "mongoose";

const internalTrendScanPostSchema = new mongoose.Schema(
  {
    contentHash: { type: String, required: true, unique: true, index: true },
    text: { type: String, required: true },
    trendText: { type: String, required: true, index: true },
    angle: { type: String, default: "" },
    relevanceScore: { type: Number, default: 0 },
    createdByWallet: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

internalTrendScanPostSchema.index({ createdAt: -1 });

const InternalTrendScanPost =
  mongoose.models.InternalTrendScanPost ||
  mongoose.model("InternalTrendScanPost", internalTrendScanPostSchema);

export default InternalTrendScanPost;
