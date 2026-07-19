import mongoose from "mongoose";

const s3LabsMissionSubmissionSchema = new mongoose.Schema(
  {
    missionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "S3LabsMission",
      required: true,
      index: true,
    },
    missionTweetId: { type: String, required: true, index: true },
    walletKey: { type: String, required: true, index: true },
    wallet: { type: String, required: true },
    xHandle: { type: String, default: null },
    xHandleKey: { type: String, default: null },
    replyTweetId: { type: String, required: true, unique: true },
    replyTweetUrl: { type: String, required: true },
    pointsAwarded: { type: Number, required: true },
  },
  { timestamps: true },
);

s3LabsMissionSubmissionSchema.index(
  { missionId: 1, walletKey: 1 },
  { unique: true },
);
s3LabsMissionSubmissionSchema.index({ walletKey: 1, createdAt: -1 });

const S3LabsMissionSubmission =
  mongoose.models.S3LabsMissionSubmission ||
  mongoose.model("S3LabsMissionSubmission", s3LabsMissionSubmissionSchema);

export default S3LabsMissionSubmission;
