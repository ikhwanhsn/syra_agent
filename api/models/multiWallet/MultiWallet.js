import mongoose from 'mongoose';

const multiWalletSchema = new mongoose.Schema(
  {
    ownerWallet: { type: String, required: true, index: true },
    chain: { type: String, default: 'solana', enum: ['solana'] },
    walletIndex: { type: Number, required: true },
    publicKey: { type: String, required: true },
    secretKey: { type: String, required: true, select: false },
    label: { type: String, default: null },
    status: { type: String, enum: ['active', 'archived'], default: 'active', index: true },
    ansemBought: { type: Boolean, default: false },
    ansemBuySignature: { type: String, default: null },
    ansemBuyError: { type: String, default: null },
    ansemBuyAt: { type: Date, default: null },
    ansemBalanceAtBuy: { type: Number, default: null },
  },
  { timestamps: true },
);

multiWalletSchema.index({ ownerWallet: 1, publicKey: 1 }, { unique: true });
multiWalletSchema.index({ ownerWallet: 1, status: 1, createdAt: -1 });

export default mongoose.models.MultiWallet || mongoose.model('MultiWallet', multiWalletSchema);
