import mongoose from "mongoose";
import { POINTS_MISSION_SUBMISSION } from "../config/s3labsPointsConfig.js";

const s3LabsMissionSchema = new mongoose.Schema(
  {
    tweetId: { type: String, required: true, unique: true, index: true },
    tweetUrl: { type: String, required: true },
    text: { type: String, default: "" },
    authorHandle: { type: String, required: true },
    authorName: { type: String, default: null },
    mediaUrls: { type: [String], default: [] },
    likeCount: { type: Number, default: 0 },
    replyCount: { type: Number, default: 0 },
    tweetCreatedAt: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
      index: true,
    },
    pointsReward: { type: Number, default: POINTS_MISSION_SUBMISSION },
    submissionCount: { type: Number, default: 0 },
    syncedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

s3LabsMissionSchema.index({ status: 1, tweetCreatedAt: -1 });

const S3LabsMission =
  mongoose.models.S3LabsMission ||
  mongoose.model("S3LabsMission", s3LabsMissionSchema);

export default S3LabsMission;
