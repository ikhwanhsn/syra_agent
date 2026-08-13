/**
 * Idempotency ledger for Relay bridge app-fee → buyback queue reports.
 * One document per Relay requestId so retries cannot double-queue revenue.
 */
import mongoose from "mongoose";

const bridgeFeeReceiptSchema = new mongoose.Schema(
  {
    /** Relay request id (unique). */
    requestId: { type: String, required: true, unique: true, index: true },
    /** USD amount queued into buyback_accumulator from paidAppFees. */
    feeUsd: { type: Number, required: true, min: 0 },
    /** Matched app-fee recipient (EVM claim address). */
    recipient: { type: String, required: true },
    /** Relay request status at verification time. */
    status: { type: String, default: "success" },
  },
  { collection: "bridge_fee_receipts", timestamps: true },
);

const BridgeFeeReceipt =
  mongoose.models.BridgeFeeReceipt ||
  mongoose.model("BridgeFeeReceipt", bridgeFeeReceiptSchema);

export default BridgeFeeReceipt;
