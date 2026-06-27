import mongoose from "mongoose";

const s3LabsPointsSchema = new mongoose.Schema(
  {
    walletKey: { type: String, required: true, unique: true, index: true },
    wallet: { type: String, required: true },
    totalPoints: { type: Number, default: 0 },
    participationPoints: { type: Number, default: 0 },
    earlyPoints: { type: Number, default: 0 },
    creationPoints: { type: Number, default: 0 },
    dailyClaimPoints: { type: Number, default: 0 },
    campaignsParticipated: { type: Number, default: 0 },
    campaignsCreated: { type: Number, default: 0 },
    lastHandle: { type: String, default: null },
    lastHandleKey: { type: String, default: null },
    lastAwardedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

s3LabsPointsSchema.index({ totalPoints: -1 });

const S3LabsPoints =
  mongoose.models.S3LabsPoints || mongoose.model("S3LabsPoints", s3LabsPointsSchema);

export default S3LabsPoints;
