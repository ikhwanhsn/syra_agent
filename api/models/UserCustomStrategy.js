/**
 * User-defined Binance spot strategy for the trading experiment lab (wallet-scoped, max 5 per wallet).
 */
import mongoose from "mongoose";

const userCustomStrategySchema = new mongoose.Schema(
  {
    /** Normalized: EVM lowercased; Solana base58 as-is */
    walletAddress: { type: String, required: true, index: true },
    name: { type: String, required: true, maxlength: 80 },
    /** Token slug passed to Binance signal builder (e.g. bitcoin, ethereum) */
    token: { type: String, required: true },
    bar: { type: String, required: true },
    limit: { type: Number, required: true },
    lookAheadBars: { type: Number, required: true },
  },
  { timestamps: true },
);

userCustomStrategySchema.index({ walletAddress: 1, createdAt: -1 });

const UserCustomStrategy =
  mongoose.models.UserCustomStrategy ||
  mongoose.model("UserCustomStrategy", userCustomStrategySchema);

export default UserCustomStrategy;
