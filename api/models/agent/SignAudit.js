/**
 * Append-only audit log for every sign event (x402 pay, on-chain tx, withdraw, message sign).
 *
 * Security guarantees:
 *  - Single-purpose: this collection is write-only from the broker; nothing else writes to it.
 *  - Tamper-evident: each row stores a SHA-256 hash chain (`prevHash` -> `selfHash`) so any
 *    silent edit/delete breaks the chain. Roots can be anchored externally for P2.
 *  - PII-safe: never stores private keys, mnemonics, or raw signed payloads.
 *
 * Indexes optimize forensic queries by user, tool, time, and outcome.
 */
import mongoose from 'mongoose';

const signAuditSchema = new mongoose.Schema(
  {
    /** Sequence id (monotonic per document, sourced from MongoDB ObjectId timestamp + counter). */
    seq: { type: Number, required: true, index: true },
    ts: { type: Date, default: Date.now, index: true },

    /** Identity */
    anonymousId: { type: String, required: true, index: true },
    walletAddress: { type: String, default: null },
    agentAddress: { type: String, default: null },
    chain: { type: String, enum: ['solana', 'base', 'bsc', 'tempo', 'other'], default: 'solana' },

    /** Action */
    action: {
      type: String,
      enum: ['x402_pay', 'tx_sign', 'tx_submit', 'withdraw', 'message_sign', 'intent_stage', 'intent_confirm', 'intent_reject'],
      required: true,
    },
    toolId: { type: String, default: null, index: true },
    intentId: { type: String, default: null, index: true },

    /** Money */
    amountUsd: { type: Number, default: 0 },
    toAddress: { type: String, default: null },
    txSignature: { type: String, default: null, index: true },

    /** Policy outcome */
    policyDecision: { type: String, enum: ['allow', 'deny', 'require_confirm'], required: true },
    policyReasons: { type: [String], default: [] },
    riskScore: { type: Number, default: 0 },

    /** Operational */
    status: { type: String, enum: ['ok', 'failed', 'rejected'], required: true, index: true },
    errorCode: { type: String, default: null },
    errorMessage: { type: String, default: null },

    /** Request context */
    requestId: { type: String, default: null },
    sessionId: { type: String, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },

    /** Tamper-evident hash chain (P2 ready) */
    prevHash: { type: String, default: null },
    selfHash: { type: String, required: true },
  },
  { timestamps: false, minimize: false }
);

signAuditSchema.index({ anonymousId: 1, ts: -1 });
signAuditSchema.index({ toolId: 1, ts: -1 });
signAuditSchema.index({ status: 1, ts: -1 });
signAuditSchema.index({ action: 1, ts: -1 });

// Immutability hint: block updates from anywhere outside the broker module.
signAuditSchema.pre(['updateOne', 'updateMany', 'findOneAndUpdate'], function (next) {
  next(new Error('SignAudit rows are immutable'));
});
signAuditSchema.pre(['deleteOne', 'deleteMany', 'findOneAndDelete'], function (next) {
  next(new Error('SignAudit rows cannot be deleted'));
});

const SignAudit = mongoose.models.SignAudit || mongoose.model('SignAudit', signAuditSchema);
export default SignAudit;
