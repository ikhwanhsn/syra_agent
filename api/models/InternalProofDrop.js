import mongoose from "mongoose";

const internalProofDropSchema = new mongoose.Schema(
  {
    contentHash: { type: String, required: true, unique: true, index: true },
    text: { type: String, required: true },
    angle: { type: String, default: "", index: true },
    shareSectionId: { type: String, default: "headline" },
    metricsSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdByWallet: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

internalProofDropSchema.index({ createdAt: -1 });

const InternalProofDrop =
  mongoose.models.InternalProofDrop ||
  mongoose.model("InternalProofDrop", internalProofDropSchema);

export default InternalProofDrop;
