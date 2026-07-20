import mongoose from "mongoose";

/**
 * Idempotency ledger for Tempo TIP-20 payouts.
 * Keyed by idempotencyKey (memo, challenge id, or client-supplied key).
 */
const tempoPayoutLedgerSchema = new mongoose.Schema(
  {
    idempotencyKey: { type: String, required: true, unique: true, index: true },
    to: { type: String, required: true, index: true },
    amountUsd: { type: Number, required: true, min: 0 },
    memo: { type: String, default: null },
    txHash: { type: String, default: null, index: true },
    status: {
      type: String,
      enum: ["sending", "confirmed", "failed"],
      default: "sending",
      index: true,
    },
    error: { type: String, default: null },
    source: { type: String, default: null },
  },
  { timestamps: true },
);

const TempoPayoutLedger =
  mongoose.models.TempoPayoutLedger ||
  mongoose.model("TempoPayoutLedger", tempoPayoutLedgerSchema);

export default TempoPayoutLedger;
