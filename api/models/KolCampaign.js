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
    /** Unused KOL pool returned to project creator after finalize. */
    creatorRefundLamports: { type: Number, default: null },
    creatorRefundTxSignature: { type: String, default: null },
    creatorRefundStatus: {
      type: String,
      enum: ["pending", "confirmed", "failed", "skipped", null],
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
    /** When true, KOLs must have created and funded ≥1 campaign before rewards. */
    requireCreatedOneCampaign: { type: Boolean, default: false },
    /**
     * Normalized X handles allowed to earn rewards. Empty = open campaign.
     * Non-allowlisted engagers still appear on the leaderboard.
     */
    allowedHandleKeys: { type: [String], default: [] },
    /** If set, only top N by (bonus-adjusted) score share the top bucket. */
    payoutTopN: { type: Number, default: null, min: 1, max: 100 },
    /**
     * Basis points of the KOL pool for the top-N bucket (rest → remaining engagers).
     * 10000 = 100% to top N. 7000 = 70% top N / 30% rest.
     */
    payoutTopNShareBps: {
      type: Number,
      default: 10_000,
      min: 0,
      max: 10_000,
    },
    lastSnapshotAt: { type: Date, default: null },
    finalizedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

kolCampaignSchema.index({ status: 1, endAt: 1 });
kolCampaignSchema.index({ createdAt: -1 });
kolCampaignSchema.index({ projectWallet: 1, status: 1 });

const KolCampaign =
  mongoose.models.KolCampaign ||
  mongoose.model("KolCampaign", kolCampaignSchema);

export default KolCampaign;
