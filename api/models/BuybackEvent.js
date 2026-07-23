/**
 * One successful SYRA buyback flush (Jupiter USDC → SYRA).
 * Used for public proof (Solscan links) and cumulative metrics.
 */
import mongoose from "mongoose";

const buybackEventSchema = new mongoose.Schema(
  {
    /** Pre-80% split revenue USD that funded this flush. */
    revenueUsd: { type: Number, required: true, min: 0 },
    /** USD actually spent on the Jupiter swap (~80% of revenueUsd). */
    buybackUsd: { type: Number, required: true, min: 0 },
    /** Jupiter outAmount (raw token units, string). */
    outAmountRaw: { type: String, default: null },
    /** Human-readable SYRA received (6 decimals assumed). */
    outAmountHuman: { type: Number, default: null },
    swapSignature: { type: String, required: true, index: true },
    treasuryWallet: { type: String, default: null },
  },
  { collection: "buyback_events", timestamps: true },
);

buybackEventSchema.index({ createdAt: -1 });

const BuybackEvent =
  mongoose.models.BuybackEvent || mongoose.model("BuybackEvent", buybackEventSchema);

export default BuybackEvent;
