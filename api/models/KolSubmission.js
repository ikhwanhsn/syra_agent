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

const kolSubmissionSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KolCampaign",
      required: true,
      index: true,
    },
    kolWallet: { type: String, required: true, index: true },
    tweetId: { type: String, required: true },
    tweetUrl: { type: String, required: true },
    mode: { type: String, enum: ["reply", "quote"], required: true },
    authorHandle: { type: String, required: true, index: true },
    verified: { type: Boolean, default: true },
    latestMetrics: { type: metricsSchema, default: () => ({}) },
    latestScore: { type: Number, default: 0 },
    projectedLamports: { type: Number, default: 0 },
  },
  { timestamps: true },
);

kolSubmissionSchema.index({ campaignId: 1, tweetId: 1 }, { unique: true });
kolSubmissionSchema.index({ campaignId: 1, kolWallet: 1 }, { unique: true });
kolSubmissionSchema.index({ campaignId: 1, latestScore: -1 });

const KolSubmission =
  mongoose.models.KolSubmission || mongoose.model("KolSubmission", kolSubmissionSchema);

export default KolSubmission;
