import mongoose from "mongoose";

const s3LabsPointsLedgerSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KolCampaign",
      required: true,
      index: true,
    },
    walletKey: { type: String, required: true, index: true },
    wallet: { type: String, required: true },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KolSubmission",
      required: true,
    },
    handle: { type: String, default: null },
    rank: { type: Number, required: true, min: 1 },
    participationPoints: { type: Number, required: true },
    earlyPoints: { type: Number, required: true },
    totalPoints: { type: Number, required: true },
  },
  { timestamps: true },
);

s3LabsPointsLedgerSchema.index({ campaignId: 1, walletKey: 1 }, { unique: true });
s3LabsPointsLedgerSchema.index({ walletKey: 1, createdAt: -1 });

const S3LabsPointsLedger =
  mongoose.models.S3LabsPointsLedger ||
  mongoose.model("S3LabsPointsLedger", s3LabsPointsLedgerSchema);

export default S3LabsPointsLedger;
