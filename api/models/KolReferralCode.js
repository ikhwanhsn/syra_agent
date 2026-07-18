import mongoose from "mongoose";

const kolReferralCodeSchema = new mongoose.Schema(
  {
    walletKey: { type: String, required: true, unique: true, index: true },
    wallet: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true },
);

const KolReferralCode =
  mongoose.models.KolReferralCode ||
  mongoose.model("KolReferralCode", kolReferralCodeSchema);

export default KolReferralCode;
