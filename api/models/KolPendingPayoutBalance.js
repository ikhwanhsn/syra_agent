import mongoose from "mongoose";

const kolPendingPayoutBalanceSchema = new mongoose.Schema(
  {
    kolWallet: { type: String, required: true, unique: true, index: true },
    pendingLamports: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true },
);

const KolPendingPayoutBalance =
  mongoose.models.KolPendingPayoutBalance ||
  mongoose.model("KolPendingPayoutBalance", kolPendingPayoutBalanceSchema);

export default KolPendingPayoutBalance;
