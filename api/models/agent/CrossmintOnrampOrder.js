/**
 * Tracks Crossmint onramp orders destined for Syra agent wallets.
 * fundingSource metadata: 'crossmint_onramp' (does not change custody mode).
 */
import mongoose from 'mongoose';

const crossmintOnrampOrderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    agentAddress: { type: String, required: true, index: true },
    chain: { type: String, enum: ['solana', 'base'], default: 'solana' },
    amountUsd: { type: String, required: true },
    receiptEmail: { type: String, required: true },
    fundingSource: { type: String, default: 'crossmint_onramp' },
    phase: { type: String, default: 'payment' },
    paymentStatus: { type: String, default: null },
    deliveryStatus: { type: String, default: null },
    status: {
      type: String,
      enum: ['created', 'pending', 'completed', 'failed'],
      default: 'created',
      index: true,
    },
    clientSecretPresent: { type: Boolean, default: false },
    lastWebhookAt: { type: Date, default: null },
    rawLastPayload: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
);

crossmintOnrampOrderSchema.index({ anonymousId: 1, createdAt: -1 });

const CrossmintOnrampOrder =
  mongoose.models.CrossmintOnrampOrder ||
  mongoose.model('CrossmintOnrampOrder', crossmintOnrampOrderSchema);

export default CrossmintOnrampOrder;
