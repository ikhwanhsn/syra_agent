import mongoose from "mongoose";

const s3LabsReferralLedgerSchema = new mongoose.Schema(
  {
    referrerWalletKey: { type: String, required: true, index: true },
    referrerWallet: { type: String, required: true },
    inviteeWalletKey: { type: String, required: true, index: true },
    inviteeWallet: { type: String, required: true },
    eventType: {
      type: String,
      enum: ["participation", "podium", "creation"],
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KolCampaign",
      default: null,
      index: true,
    },
    points: { type: Number, required: true },
  },
  { timestamps: true },
);

s3LabsReferralLedgerSchema.index(
  {
    referrerWalletKey: 1,
    inviteeWalletKey: 1,
    eventType: 1,
    campaignId: 1,
  },
  { unique: true },
);

s3LabsReferralLedgerSchema.index({ referrerWalletKey: 1, createdAt: -1 });

const S3LabsReferralLedger =
  mongoose.models.S3LabsReferralLedger ||
  mongoose.model("S3LabsReferralLedger", s3LabsReferralLedgerSchema);

export default S3LabsReferralLedger;
