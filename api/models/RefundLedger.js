/**
 * On-chain Syra refund ledger (inbound client + outbound agent).
 */
import mongoose from "mongoose";

const refundLedgerSchema = new mongoose.Schema(
  {
    idempotencyKey: { type: String, required: true },
    direction: { type: String, enum: ["inbound", "outbound"], required: true, index: true },
    chain: { type: String, enum: ["solana", "base", "xlayer", "algorand"], required: true },
    status: {
      type: String,
      enum: ["pending", "sent", "failed", "skipped"],
      default: "pending",
      index: true,
    },
    anonymousId: { type: String, index: true },
    agentPubkey: { type: String, index: true },
    payer: { type: String, index: true },
    toWallet: { type: String, required: true, index: true },
    amountUsd: { type: Number, required: true },
    refundTxSignature: { type: String, index: true },
    paymentTxSignature: { type: String, index: true },
    reason: { type: String },
    providerHost: { type: String, index: true },
    toolId: { type: String, index: true },
    path: { type: String },
    httpStatus: { type: Number },
    error: { type: String },
    source: { type: String, default: "syra-refund", index: true },
    premiumUsd: { type: Number },
    premiumTx: { type: String, index: true },
    coveredUrl: { type: String },
    payerWallet: { type: String, index: true },
    mode: { type: String, enum: ["relay", "reprobe"] },
    settledAt: { type: Date, index: true },
  },
  { timestamps: true },
);

refundLedgerSchema.index({ idempotencyKey: 1 }, { unique: true });
refundLedgerSchema.index({ anonymousId: 1, settledAt: -1 });
refundLedgerSchema.index({ direction: 1, createdAt: -1 });
refundLedgerSchema.index({ source: 1, toWallet: 1, createdAt: -1 });
refundLedgerSchema.index({ payerWallet: 1, createdAt: -1 });

const RefundLedger = mongoose.model("RefundLedger", refundLedgerSchema);
export default RefundLedger;
