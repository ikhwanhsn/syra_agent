import mongoose from "mongoose";

const kolPayoutSchema = new mongoose.Schema(
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
    kolWallet: { type: String, required: true, index: true },
    lamports: { type: Number, required: true, min: 1 },
    txSignature: { type: String, default: null },
    status: {
      type: String,
      enum: ["pending", "pending_minimum", "sending", "confirmed", "failed"],
      default: "pending",
      index: true,
    },
    error: { type: String, default: null },
  },
  { timestamps: true },
);

kolPayoutSchema.index({ campaignId: 1, submissionId: 1 }, { unique: true });

const KolPayout =
  mongoose.models.KolPayout || mongoose.model("KolPayout", kolPayoutSchema);

export default KolPayout;
