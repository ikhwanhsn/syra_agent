/**
 * Syra-branded image generation prompts + X captions for internal design workflow.
 */
import mongoose from "mongoose";

const internalImagePromptSchema = new mongoose.Schema(
  {
    contentHash: { type: String, required: true, unique: true, index: true },
    sourcePrompt: { type: String, required: true },
    imagePrompt: { type: String, required: true },
    caption: { type: String, required: true },
    style: { type: String, default: "", index: true },
    direction: { type: String, default: "" },
    createdByWallet: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

internalImagePromptSchema.index({ createdAt: -1 });

const InternalImagePrompt =
  mongoose.models.InternalImagePrompt ||
  mongoose.model("InternalImagePrompt", internalImagePromptSchema);

export default InternalImagePrompt;
