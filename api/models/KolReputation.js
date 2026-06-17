import mongoose from "mongoose";

const kolReputationSchema = new mongoose.Schema(
  {
    handleKey: { type: String, required: true, unique: true, index: true },
    handle: { type: String, required: true },
    reputationScore: { type: Number, default: 0 },
    campaignsCompleted: { type: Number, default: 0 },
    lastScoreAt: { type: Date, default: null },
  },
  { timestamps: true },
);

kolReputationSchema.index({ reputationScore: -1 });

const KolReputation =
  mongoose.models.KolReputation || mongoose.model("KolReputation", kolReputationSchema);

export default KolReputation;
