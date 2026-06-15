/**
 * On-chain Pact Network refund records observed via @q3labs/pact-sdk indexer events.
 */
import mongoose from 'mongoose';

const pactRefundSchema = new mongoose.Schema(
  {
    anonymousId: { type: String, index: true },
    agentPubkey: { type: String, index: true },
    callId: { type: String },
    slug: { type: String },
    providerHost: { type: String, index: true },
    toolId: { type: String, index: true },
    refundLamports: { type: String, required: true },
    refundUsd: { type: Number },
    premiumLamports: { type: String },
    txSignature: { type: String, index: true },
    settledAt: { type: Date, index: true },
    source: { type: String, default: 'pact-sdk' },
  },
  { timestamps: true }
);

pactRefundSchema.index({ anonymousId: 1, settledAt: -1 });
pactRefundSchema.index({ callId: 1 }, { unique: true, sparse: true });

const PactRefund = mongoose.model('PactRefund', pactRefundSchema);
export default PactRefund;
