/**
 * Unique X-ready hype narratives generated from internal Tools tab.
 */
import mongoose from "mongoose";

const internalNarrativePostSchema = new mongoose.Schema(
  {
    /** sha256 of normalized text — dedupe key */
    contentHash: { type: String, required: true, unique: true, index: true },
    text: { type: String, required: true },
    theme: { type: String, default: "", index: true },
    angle: { type: String, default: "" },
    sourceMode: { type: String, enum: ["syra", "trending"], default: "syra", index: true },
    newsHook: { type: String, default: "" },
    createdByWallet: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

internalNarrativePostSchema.index({ createdAt: -1 });

const InternalNarrativePost =
  mongoose.models.InternalNarrativePost ||
  mongoose.model("InternalNarrativePost", internalNarrativePostSchema);

export default InternalNarrativePost;
