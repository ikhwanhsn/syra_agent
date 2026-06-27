import mongoose from "mongoose";

const s3LabsDailyClaimSchema = new mongoose.Schema(
  {
    walletKey: { type: String, required: true, index: true },
    wallet: { type: String, required: true },
    claimDate: { type: String, required: true },
    basePoints: { type: Number, required: true },
    weeklyBonus: { type: Number, default: 0 },
    monthlyBonus: { type: Number, default: 0 },
    totalPoints: { type: Number, required: true },
  },
  { timestamps: true },
);

s3LabsDailyClaimSchema.index({ walletKey: 1, claimDate: 1 }, { unique: true });
s3LabsDailyClaimSchema.index({ walletKey: 1, createdAt: -1 });

const S3LabsDailyClaim =
  mongoose.models.S3LabsDailyClaim ||
  mongoose.model("S3LabsDailyClaim", s3LabsDailyClaimSchema);

export default S3LabsDailyClaim;
