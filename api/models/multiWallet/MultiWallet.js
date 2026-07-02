import mongoose from 'mongoose';

const multiWalletSchema = new mongoose.Schema(
  {
    ownerWallet: { type: String, required: true, index: true },
    chain: { type: String, default: 'solana', enum: ['solana'] },
    /** Monotonic index within owner's active wallet set at creation time. */
    walletIndex: { type: Number, required: true },
    publicKey: { type: String, required: true },
    /** Encrypted base58 secret (enc:v1:...). Never returned by list endpoints. */
    secretKey: { type: String, required: true, select: false },
    label: { type: String, default: null },
    status: {
      type: String,
      enum: ['active', 'archived'],
      default: 'active',
      index: true,
    },
    ansemBought: { type: Boolean, default: false },
    ansemBuySignature: { type: String, default: null },
    ansemBuyError: { type: String, default: null },
    ansemBuyAt: { type: Date, default: null },
    /** $ANSEM balance snapshot right after a successful buy (baseline for airdrop detection). */
    ansemBalanceAtBuy: { type: Number, default: null },
  },
  { timestamps: true },
);

multiWalletSchema.index({ ownerWallet: 1, publicKey: 1 }, { unique: true });
multiWalletSchema.index({ ownerWallet: 1, status: 1, createdAt: -1 });

export default mongoose.models.MultiWallet || mongoose.model('MultiWallet', multiWalletSchema);
