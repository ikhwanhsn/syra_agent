import mongoose from "mongoose";

const kolReferralAttributionSchema = new mongoose.Schema(
  {
    inviteeWalletKey: { type: String, required: true, unique: true, index: true },
    inviteeWallet: { type: String, required: true },
    referrerWalletKey: { type: String, required: true, index: true },
    referrerWallet: { type: String, required: true },
    code: { type: String, required: true, index: true },
    claimedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

kolReferralAttributionSchema.index({ referrerWalletKey: 1, createdAt: -1 });

const KolReferralAttribution =
  mongoose.models.KolReferralAttribution ||
  mongoose.model("KolReferralAttribution", kolReferralAttributionSchema);

export default KolReferralAttribution;
