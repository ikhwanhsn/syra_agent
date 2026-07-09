import mongoose from "mongoose";

const kolXVerificationSchema = new mongoose.Schema(
  {
    xHandleKey: { type: String, required: true, unique: true, index: true },
    xHandle: { type: String, required: true },
    wallet: { type: String, required: true, index: true },
    code: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
      index: true,
    },
    verifiedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true },
);

kolXVerificationSchema.index({ wallet: 1, status: 1 });

const KolXVerification =
  mongoose.models.KolXVerification ||
  mongoose.model("KolXVerification", kolXVerificationSchema);

export default KolXVerification;
