/**
 * Founder engagement reply drafts generated from live X opportunities.
 */
import mongoose from "mongoose";

const internalEngagementReplySchema = new mongoose.Schema(
  {
    contentHash: { type: String, required: true, unique: true, index: true },
    sourceTweetId: { type: String, required: true, index: true },
    sourceTweetText: { type: String, required: true },
    authorHandle: { type: String, required: true, index: true },
    text: { type: String, required: true },
    tone: { type: String, default: "", index: true },
    createdByWallet: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

internalEngagementReplySchema.index({ createdAt: -1 });
internalEngagementReplySchema.index({ sourceTweetId: 1, createdAt: -1 });

const InternalEngagementReply =
  mongoose.models.InternalEngagementReply ||
  mongoose.model("InternalEngagementReply", internalEngagementReplySchema);

export default InternalEngagementReply;
