import mongoose from "mongoose";

const kolCampaignSchema = new mongoose.Schema(
  {
    projectWallet: { type: String, required: true, index: true },
    sourceTweetId: { type: String, required: true, index: true },
    sourceTweetUrl: { type: String, required: true },
    sourceTweetText: { type: String, default: "" },
    sourceAuthorHandle: { type: String, default: null, index: true },
    sourceAuthorName: { type: String, default: null },
    sourceAuthorFollowers: { type: Number, default: null },
    sourceAuthorVerified: { type: Boolean, default: false },
    sourceTweetMedia: {
      type: [
        {
          mediaType: { type: String, default: "photo" },
          url: { type: String, required: true },
          previewUrl: { type: String, default: null },
        },
      ],
      default: [],
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    rewardLamports: { type: Number, required: true, min: 1 },
    kolRewardPoolLamports: { type: Number, default: null },
    platformFeeLamports: { type: Number, default: null },
    platformFeeTxSignature: { type: String, default: null },
    platformFeeStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed", null],
      default: null,
    },
    depositTxSignature: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: ["pending_deposit", "active", "completed", "cancelled"],
      default: "pending_deposit",
      index: true,
    },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null, index: true },
    durationDays: { type: Number, required: true, min: 1, max: 30 },
    /** When true, KOLs must have created ≥1 campaign before submitting. Admin-only at create time. */
    requireCreatedOneCampaign: { type: Boolean, default: false },
    lastSnapshotAt: { type: Date, default: null },
    finalizedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

kolCampaignSchema.index({ status: 1, endAt: 1 });
kolCampaignSchema.index({ createdAt: -1 });

const KolCampaign =
  mongoose.models.KolCampaign ||
  mongoose.model("KolCampaign", kolCampaignSchema);

export default KolCampaign;
