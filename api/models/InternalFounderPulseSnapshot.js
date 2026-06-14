import mongoose from "mongoose";

const internalFounderPulseSnapshotSchema = new mongoose.Schema(
  {
    handle: { type: String, required: true, index: true },
    followers: { type: Number, default: 0 },
    following: { type: Number, default: 0 },
    tweetCount: { type: Number, default: 0 },
    analytics: { type: mongoose.Schema.Types.Mixed, required: true },
    capturedAt: { type: Date, default: Date.now, index: true },
    createdByWallet: { type: String, default: null },
  },
  { timestamps: true },
);

internalFounderPulseSnapshotSchema.index({ handle: 1, capturedAt: -1 });

const InternalFounderPulseSnapshot =
  mongoose.models.InternalFounderPulseSnapshot ||
  mongoose.model("InternalFounderPulseSnapshot", internalFounderPulseSnapshotSchema);

export default InternalFounderPulseSnapshot;
