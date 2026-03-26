import mongoose from 'mongoose';

const streamflowLockSchema = new mongoose.Schema(
  {
    streamId: { type: String, required: true, unique: true, index: true },
    txId: { type: String, required: true, index: true },
    wallet: { type: String, required: true, index: true },
    sender: { type: String, default: null },
    recipient: { type: String, default: null },
    mint: { type: String, required: true, index: true },
    tokenSymbol: { type: String, default: 'TOKEN' },
    decimals: { type: Number, required: true, min: 0 },
    amountRaw: { type: String, required: true },
    amountFormatted: { type: String, required: true },
    unlockedRaw: { type: String, default: '0' },
    unlockedFormatted: { type: String, default: '0' },
    withdrawnRaw: { type: String, default: '0' },
    withdrawnFormatted: { type: String, default: '0' },
    unlockAtUnix: { type: Number, required: true, index: true },
    unlockAtIso: { type: String, required: true },
    network: { type: String, enum: ['mainnet', 'devnet'], required: true, index: true },
    source: { type: String, enum: ['app', 'onchain_sync'], default: 'app' },
    closed: { type: Boolean, default: false, index: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

streamflowLockSchema.index({ wallet: 1, mint: 1, network: 1, closed: 1 });
streamflowLockSchema.index({ wallet: 1, unlockAtUnix: 1 });

const StreamflowLock =
  mongoose.models.StreamflowLock || mongoose.model('StreamflowLock', streamflowLockSchema);

export default StreamflowLock;
