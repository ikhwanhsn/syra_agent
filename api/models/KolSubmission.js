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

/** One reply/quote post that contributes to a handle's campaign score. */
const contributionSchema = new mongoose.Schema(
  {
    tweetId: { type: String, required: true },
    tweetUrl: { type: String, required: true },
    mode: { type: String, enum: ["reply", "quote"], required: true },
    metrics: { type: metricsSchema, default: () => ({}) },
    score: { type: Number, default: 0 },
    scoreBreakdown: { type: scoreBreakdownSchema, default: null },
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
    /** Primary (highest-scoring) contribution — kept for display + unique index. */
    tweetId: { type: String, required: true },
    tweetUrl: { type: String, required: true },
    mode: { type: String, enum: ["reply", "quote"], required: true },
    authorHandle: { type: String, required: true, index: true },
    authorHandleKey: { type: String, required: true, index: true },
    authorFollowers: { type: Number, default: null },
    authorVerified: { type: Boolean, default: false },
    verified: { type: Boolean, default: true },
    /** Top-N posts counted toward latestScore (sum of contribution scores). */
    contributions: { type: [contributionSchema], default: () => [] },
    /** Summed metrics across counted contributions. */
    latestMetrics: { type: metricsSchema, default: () => ({}) },
    /** Combined score = sum of top-N contribution scores. */
    latestScore: { type: Number, default: 0 },
    /** Breakdown of the primary (highest-scoring) contribution. */
    scoreBreakdown: { type: scoreBreakdownSchema, default: null },
    finalScore: { type: Number, default: null },
    reputationCreditedAt: { type: Date, default: null },
    projectedLamports: { type: Number, default: 0 },
    earnedLamports: { type: Number, default: 0 },
    claimStatus: {
      type: String,
      enum: ["unearned", "claimable", "held_review", "claimed"],
      default: "unearned",
      index: true,
    },
    /** Tier-2 authenticity multiplier applied to payoutScore at finalize (0.25–1.0). */
    authenticityMultiplier: { type: Number, default: null },
    authenticityBreakdown: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    authenticityAuditedAt: { type: Date, default: null },
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
