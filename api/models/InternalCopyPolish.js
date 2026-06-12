/**
 * Polished X posts — enhanced copy keeping the author's original context.
 */
import mongoose from "mongoose";

const internalCopyPolishSchema = new mongoose.Schema(
  {
    contentHash: { type: String, required: true, unique: true, index: true },
    originalText: { type: String, required: true },
    polishedText: { type: String, required: true },
    tone: { type: String, default: "", index: true },
    direction: { type: String, default: "" },
    createdByWallet: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

internalCopyPolishSchema.index({ createdAt: -1 });

const InternalCopyPolish =
  mongoose.models.InternalCopyPolish ||
  mongoose.model("InternalCopyPolish", internalCopyPolishSchema);

export default InternalCopyPolish;
