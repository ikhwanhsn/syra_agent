import mongoose from "mongoose";

const metricsSchema = new mongoose.Schema(
  {
    likeCount: { type: Number, default: 0 },
    retweetCount: { type: Number, default: 0 },
    replyCount: { type: Number, default: 0 },
    quoteCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { _id: false },
);

const scoreBreakdownSchema = new mongoose.Schema(
  {
    version: { type: Number, default: 2 },
    metrics: { type: mongoose.Schema.Types.Mixed, default: () => ({}) },
    baseScore: { type: Number, default: 0 },
    credibilityMultiplier: { type: Number, default: 1 },
    integrityFactor: { type: Number, default: 1 },
    integrityFlags: { type: [String], default: () => [] },
    finalScore: { type: Number, default: 0 },
  },
  { _id: false },
);

const kolSubmissionSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KolCampaign",
      required: true,
      index: true,
    },
    kolWallet: { type: String, default: null, index: true },
    tweetId: { type: String, required: true },
    tweetUrl: { type: String, required: true },
    mode: { type: String, enum: ["reply", "quote"], required: true },
    authorHandle: { type: String, required: true, index: true },
    authorHandleKey: { type: String, required: true, index: true },
    authorFollowers: { type: Number, default: null },
    authorVerified: { type: Boolean, default: false },
    verified: { type: Boolean, default: true },
    latestMetrics: { type: metricsSchema, default: () => ({}) },
    latestScore: { type: Number, default: 0 },
    scoreBreakdown: { type: scoreBreakdownSchema, default: null },
    finalScore: { type: Number, default: null },
    reputationCreditedAt: { type: Date, default: null },
    projectedLamports: { type: Number, default: 0 },
    earnedLamports: { type: Number, default: 0 },
    claimStatus: {
      type: String,
      enum: ["unearned", "claimable", "claimed"],
      default: "unearned",
      index: true,
    },
    discoveredAt: { type: Date, default: null },
  },
  { timestamps: true },
);

kolSubmissionSchema.index({ campaignId: 1, tweetId: 1 }, { unique: true });
kolSubmissionSchema.index({ campaignId: 1, authorHandleKey: 1 }, { unique: true });
kolSubmissionSchema.index({ campaignId: 1, latestScore: -1 });
kolSubmissionSchema.index({ campaignId: 1, claimStatus: 1 });

const KolSubmission =
  mongoose.models.KolSubmission || mongoose.model("KolSubmission", kolSubmissionSchema);

export default KolSubmission;
