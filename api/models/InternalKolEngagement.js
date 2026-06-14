import mongoose from "mongoose";

const internalKolEngagementSchema = new mongoose.Schema(
  {
    contentHash: { type: String, required: true, unique: true, index: true },
    sourceTweetId: { type: String, required: true, index: true },
    sourceTweetText: { type: String, required: true },
    authorHandle: { type: String, required: true, index: true },
    mode: { type: String, default: "reply", index: true },
    text: { type: String, required: true },
    createdByWallet: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

internalKolEngagementSchema.index({ createdAt: -1 });

const InternalKolEngagement =
  mongoose.models.InternalKolEngagement ||
  mongoose.model("InternalKolEngagement", internalKolEngagementSchema);

export default InternalKolEngagement;
