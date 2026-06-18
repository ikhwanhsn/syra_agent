import mongoose from "mongoose";

/**
 * Cached X (Twitter) user profiles for KOL marketplace — refreshed on a daily schedule.
 * Public GET routes read from this collection instead of calling twitterapi.io per visitor.
 */
const kolXProfileSchema = new mongoose.Schema(
  {
    handleKey: { type: String, required: true, unique: true, index: true },
    handle: { type: String, required: true },
    name: { type: String, default: null },
    followers: { type: Number, default: null },
    following: { type: Number, default: null },
    verified: { type: Boolean, default: false },
    description: { type: String, default: null },
    profilePicture: { type: String, default: null },
    tweetCount: { type: Number, default: null },
    refreshedAt: { type: Date, required: true, index: true },
    lastError: { type: String, default: null },
  },
  { timestamps: true },
);

const KolXProfile =
  mongoose.models.KolXProfile || mongoose.model("KolXProfile", kolXProfileSchema);

export default KolXProfile;
