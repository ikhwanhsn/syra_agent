/**
 * One successful SYRA buyback (Jupiter USDC → SYRA).
 * Covers x402 scheduler flushes and manual / on-chain treasury buys.
 * Used for public proof (Solscan links) and cumulative metrics.
 */
import mongoose from "mongoose";

const buybackEventSchema = new mongoose.Schema(
  {
    /** Pre-80% split revenue USD that funded this flush (manual buys: equals buybackUsd). */
    revenueUsd: { type: Number, required: true, min: 0 },
    /** USD actually spent on the Jupiter/DEX swap. */
    buybackUsd: { type: Number, required: true, min: 0 },
    /** Jupiter outAmount (raw token units, string). */
    outAmountRaw: { type: String, default: null },
    /** Human-readable SYRA received (6 decimals assumed). */
    outAmountHuman: { type: Number, default: null },
    swapSignature: { type: String, required: true, unique: true, index: true },
    treasuryWallet: { type: String, default: null },
    /** How this buy was detected / recorded. */
    source: {
      type: String,
      enum: ["x402_scheduler", "manual_onchain", "manual_ingest"],
      default: "x402_scheduler",
      index: true,
    },
  },
  { collection: "buyback_events", timestamps: true },
);

buybackEventSchema.index({ createdAt: -1 });

const BuybackEvent =
  mongoose.models.BuybackEvent || mongoose.model("BuybackEvent", buybackEventSchema);

export default BuybackEvent;
