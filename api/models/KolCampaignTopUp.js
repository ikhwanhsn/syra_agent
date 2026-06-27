import mongoose from "mongoose";

const kolCampaignTopUpSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "KolCampaign", required: true, index: true },
    projectWallet: { type: String, required: true, index: true },
    kolRewardLamports: { type: Number, required: true, min: 1 },
    totalDepositLamports: { type: Number, required: true, min: 1 },
    platformFeeLamports: { type: Number, required: true, min: 0 },
    depositTxSignature: { type: String, default: null, index: true },
    platformFeeTxSignature: { type: String, default: null },
    platformFeeStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed", null],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending_deposit", "confirmed", "failed", "cancelled"],
      default: "pending_deposit",
      index: true,
    },
  },
  { timestamps: true },
);

kolCampaignTopUpSchema.index({ campaignId: 1, status: 1 });

const KolCampaignTopUp =
  mongoose.models.KolCampaignTopUp ||
  mongoose.model("KolCampaignTopUp", kolCampaignTopUpSchema);

export default KolCampaignTopUp;
