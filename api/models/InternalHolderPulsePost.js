import mongoose from "mongoose";

const internalHolderPulsePostSchema = new mongoose.Schema(
  {
    contentHash: { type: String, required: true, unique: true, index: true },
    text: { type: String, required: true },
    angle: { type: String, default: "", index: true },
    snapshot: { type: mongoose.Schema.Types.Mixed, required: true },
    createdByWallet: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

internalHolderPulsePostSchema.index({ createdAt: -1 });

const InternalHolderPulsePost =
  mongoose.models.InternalHolderPulsePost ||
  mongoose.model("InternalHolderPulsePost", internalHolderPulsePostSchema);

export default InternalHolderPulsePost;
