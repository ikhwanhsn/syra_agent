/**
 * Singleton accumulator for x402 revenue pending SYRA buyback (batched every 24h).
 */
import mongoose from "mongoose";

const buybackAccumulatorSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    /** Revenue USD queued since last successful flush (pre-80% split). */
    pendingRevenueUsd: { type: Number, default: 0 },
    /** Lifetime revenue USD accumulated (analytics). */
    totalAccumulatedUsd: { type: Number, default: 0 },
    /** Lifetime revenue USD successfully flushed to buyback. */
    totalFlushedUsd: { type: Number, default: 0 },
    /** Lifetime USD spent on Jupiter swaps (~80% of flushed revenue). */
    totalBuybackUsdSpent: { type: Number, default: 0 },
    /** Lifetime $SYRA acquired via buybacks (human-readable, 6 decimals). */
    totalSyraAcquired: { type: Number, default: 0 },
    lastFlushAt: { type: Date, default: null },
    lastBuybackSignature: { type: String, default: null },
    lastBuybackOutAmount: { type: String, default: null },
    lastFlushError: { type: String, default: null },
  },
  { collection: "buyback_accumulator", timestamps: true },
);

const BuybackAccumulator =
  mongoose.models.BuybackAccumulator ||
  mongoose.model("BuybackAccumulator", buybackAccumulatorSchema);

export default BuybackAccumulator;
