/**
 * Pending user-signed wallet intents.
 *
 * Flow:
 *   1. Broker stages an intent when policy returns `require_confirm`.
 *   2. User signs a SIWS/SIWE message containing intentId + summary fields with their connected wallet.
 *   3. Frontend POSTs the signature to /agent/wallet/intent/:intentId/confirm.
 *   4. Broker verifies signature, marks intent `confirmed`, and proceeds with the action.
 *   5. Single-use: confirmation transitions status to terminal `executed` / `failed` and the row is never reused.
 *
 * Mongo TTL on `expiresAt` auto-purges stale rows.
 */
import mongoose from 'mongoose';

const walletIntentSchema = new mongoose.Schema(
  {
    intentId: { type: String, required: true, unique: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    walletAddress: { type: String, default: null },
    chain: { type: String, enum: ['solana', 'base', 'tempo'], required: true },

    action: {
      type: String,
      enum: ['x402_pay', 'tx_sign', 'withdraw', 'message_sign'],
      required: true,
    },
    toolId: { type: String, default: null },

    /** Snapshot of the intent so the user signs exactly what we will execute. */
    payload: {
      estimatedUsd: { type: Number, default: 0 },
      toAddress: { type: String, default: null },
      summary: { type: String, default: '' },
      params: { type: mongoose.Schema.Types.Mixed, default: {} },
      serializedTxHash: { type: String, default: null },
    },

    /** Policy snapshot. */
    riskScore: { type: Number, default: 0 },
    policyReasons: { type: [String], default: [] },

    /** Lifecycle. */
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'executed', 'failed', 'rejected', 'expired'],
      default: 'pending',
      index: true,
    },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    confirmedAt: { type: Date, default: null },
    executedAt: { type: Date, default: null },

    /** Cryptographic proof of user confirmation. */
    signature: { type: String, default: null },
    signedMessage: { type: String, default: null },

    /** Outcome. */
    txSignature: { type: String, default: null },
    errorMessage: { type: String, default: null },

    /** Audit linkage. */
    createdBy: { type: String, default: null },
    requestId: { type: String, default: null },
  },
  { timestamps: true }
);

walletIntentSchema.index({ anonymousId: 1, status: 1, createdAt: -1 });

const WalletIntent =
  mongoose.models.WalletIntent || mongoose.model('WalletIntent', walletIntentSchema);
export default WalletIntent;
