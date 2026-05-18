import mongoose from 'mongoose';

/**
 * Per-wallet aggregate of active Streamflow locks (SYRA staking).
 * Updated on every lock upsert/sync — use for fast utility gating (e.g. trading agent).
 */
const streamflowStakingWalletSchema = new mongoose.Schema(
  {
    wallet: { type: String, required: true, index: true },
    mint: { type: String, required: true, index: true },
    network: { type: String, enum: ['mainnet', 'devnet'], required: true, index: true },
    tokenSymbol: { type: String, default: 'SYRA' },
    decimals: { type: Number, required: true, min: 0 },
    /** Sum of remaining locked amount across active positions (raw base units). */
    activeStakedAmountRaw: { type: String, required: true, default: '0' },
    activeStakedAmountFormatted: { type: String, required: true, default: '0' },
    activeLockCount: { type: Number, default: 0, index: true },
    /** Earliest unlock among active locks (unix seconds). */
    nextUnlockAtUnix: { type: Number, default: null },
    lastSyncedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

streamflowStakingWalletSchema.index({ wallet: 1, mint: 1, network: 1 }, { unique: true });
streamflowStakingWalletSchema.index({ mint: 1, network: 1, activeStakedAmountRaw: -1 });

const StreamflowStakingWallet =
  mongoose.models.StreamflowStakingWallet ||
  mongoose.model('StreamflowStakingWallet', streamflowStakingWalletSchema);

export default StreamflowStakingWallet;
