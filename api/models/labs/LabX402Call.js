/**
 * LabX402Call — audit log for x402 Labs paid endpoint calls.
 */
import mongoose from 'mongoose';

const labX402CallSchema = new mongoose.Schema(
  {
    payerAddress: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, index: true },
    priceUsd: { type: Number, required: true },
    chain: {
      type: String,
      enum: ['solana', 'base', 'celo', 'algorand'],
      default: 'solana',
      index: true,
    },
    status: {
      type: String,
      enum: ['success', 'payment_failed', 'refund_failed', 'refund_skipped', 'error'],
      required: true,
      index: true,
    },
    paymentTx: { type: String, default: null },
    refundTx: { type: String, default: null },
    error: { type: String, default: null },
    responseSnippet: { type: String, default: null },
    trigger: { type: String, enum: ['manual', 'scheduler'], default: 'manual' },
  },
  { timestamps: true },
);

labX402CallSchema.index({ createdAt: -1 });
labX402CallSchema.index({ chain: 1, createdAt: -1 });

export default mongoose.models.LabX402Call || mongoose.model('LabX402Call', labX402CallSchema);
