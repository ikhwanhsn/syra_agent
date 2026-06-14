import mongoose from "mongoose";

const internalMentionReplySchema = new mongoose.Schema(
  {
    contentHash: { type: String, required: true, unique: true, index: true },
    sourceTweetId: { type: String, required: true, index: true },
    sourceTweetText: { type: String, required: true },
    authorHandle: { type: String, required: true, index: true },
    category: { type: String, default: "", index: true },
    text: { type: String, required: true },
    tone: { type: String, default: "", index: true },
    createdByWallet: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

internalMentionReplySchema.index({ createdAt: -1 });

const InternalMentionReply =
  mongoose.models.InternalMentionReply ||
  mongoose.model("InternalMentionReply", internalMentionReplySchema);

export default InternalMentionReply;
