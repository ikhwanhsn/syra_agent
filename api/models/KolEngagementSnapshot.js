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

const kolEngagementSnapshotSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KolCampaign",
      required: true,
      index: true,
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KolSubmission",
      required: true,
      index: true,
    },
    capturedAt: { type: Date, required: true, index: true },
    metrics: { type: metricsSchema, default: () => ({}) },
    score: { type: Number, default: 0 },
    scoreBreakdown: { type: scoreBreakdownSchema, default: null },
  },
  { timestamps: true },
);

kolEngagementSnapshotSchema.index({ campaignId: 1, capturedAt: -1 });
kolEngagementSnapshotSchema.index({ submissionId: 1, capturedAt: -1 });

const KolEngagementSnapshot =
  mongoose.models.KolEngagementSnapshot ||
  mongoose.model("KolEngagementSnapshot", kolEngagementSnapshotSchema);

export default KolEngagementSnapshot;
