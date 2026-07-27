import mongoose from "mongoose";

/**
 * Standing mandate: agent grants Syra scoped, revocable authority to complete financial work.
 * Extends one-shot wallet signing into recurring outcome execution.
 */
const outcomeMandateSchema = new mongoose.Schema(
  {
    mandateId: { type: String, required: true, unique: true, index: true },
    anonymousId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["active", "paused", "revoked", "expired", "killed"],
      default: "active",
      index: true,
    },
    chain: { type: String, required: true, index: true },
    /** Wallet pubkey or EVM address Syra may operate under mandate. */
    agentAddress: { type: String, required: true, index: true },
    /** Tool ids authorized under this mandate (subset of product mandateToolIds). */
    allowedTools: { type: [String], default: [] },
    /** Program/contract allowlist for on-chain actions. */
    destinationAllowlist: { type: [String], default: [] },
    perTxCapUsd: { type: Number, default: 25, min: 0 },
    dailySpendCapUsd: { type: Number, default: 100, min: 0 },
    hourlySpendCapUsd: { type: Number, default: 50, min: 0 },
    maxManagedCapitalUsd: { type: Number, default: 200, min: 0 },
    /** Mandate expires at this timestamp; no new jobs after expiry. */
    expiresAt: { type: Date, default: null, index: true },
    /** Operator or agent kill switch — refuse all new execution immediately. */
    killSwitch: { type: Boolean, default: false, index: true },
    killSwitchReason: { type: String, default: null },
    killedAt: { type: Date, default: null },
    revokedAt: { type: Date, default: null },
    revokedBy: { type: String, default: null },
    /** Product-specific policy (strategy id, risk tier, venue prefs). */
    policy: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** Cumulative spend under this mandate (USD estimate). */
    cumulativeSpendUsd: { type: Number, default: 0, min: 0 },
    /** Cumulative realized PnL attributed to this mandate. */
    cumulativeRealizedPnlUsd: { type: Number, default: 0 },
    lastJobAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { collection: "outcome_mandates", timestamps: true },
);

outcomeMandateSchema.index({ anonymousId: 1, productId: 1, status: 1 });
outcomeMandateSchema.index({ status: 1, killSwitch: 1, expiresAt: 1 });

if (mongoose.models.OutcomeMandate) {
  delete mongoose.models.OutcomeMandate;
}

const OutcomeMandate = mongoose.model("OutcomeMandate", outcomeMandateSchema);

export default OutcomeMandate;
