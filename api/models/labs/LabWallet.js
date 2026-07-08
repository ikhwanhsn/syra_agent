/**
 * LabWallet — self-custody Solana wallets for x402 Labs (admin-only feature).
 * Keys stored encrypted via agentWalletSecretCrypto envelope.
 */
import mongoose from 'mongoose';

const labWalletSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 64 },
    address: { type: String, required: true, unique: true, index: true },
    encryptedSecret: { type: String, required: true, select: false },
    role: { type: String, enum: ['payer', 'payto'], required: true, index: true },
    chain: { type: String, enum: ['solana'], default: 'solana' },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

labWalletSchema.index({ role: 1, active: 1 });

export default mongoose.models.LabWallet || mongoose.model('LabWallet', labWalletSchema);
