/**
 * Per-wallet usage → $SYRA rewards ledger.
 * Accrues when x402 settles; claimable after epoch funding from buyback treasury.
 */
import mongoose from "mongoose";

const syraUsageRewardSchema = new mongoose.Schema(
  {
    /** Solana (or EVM) payer wallet — normalized lowercase for EVM, as-is for Solana. */
    wallet: { type: String, required: true, unique: true, index: true },
    /** Lifetime USD spent on settled Syra x402 calls. */
    lifetimeSpendUsd: { type: Number, default: 0 },
    /** Lifetime reward points accrued (1 point ≈ 1 USD of spend until funded). */
    lifetimePoints: { type: Number, default: 0 },
    /** Points not yet converted into claimable SYRA. */
    pendingPoints: { type: Number, default: 0 },
    /** Claimable $SYRA (human-readable). */
    claimableSyra: { type: Number, default: 0 },
    /** Lifetime $SYRA claimed. */
    claimedSyra: { type: Number, default: 0 },
    lastSpendAt: { type: Date, default: null },
    lastClaimAt: { type: Date, default: null },
    lastClaimTx: { type: String, default: null },
  },
  { collection: "syra_usage_rewards", timestamps: true },
);

const SyraUsageReward =
  mongoose.models.SyraUsageReward ||
  mongoose.model("SyraUsageReward", syraUsageRewardSchema);

export default SyraUsageReward;
