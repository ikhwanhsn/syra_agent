import mongoose from 'mongoose';

const skillEarningSchema = new mongoose.Schema(
  {
    /** Creator anonymousId (matches UserPrompt / AgentWallet) */
    creatorAnonymousId: { type: String, required: true, index: true },
    /** Optional linked wallet for payouts */
    creatorWallet: { type: String, default: null, index: true },
    /** Source of attribution: prompt | skill | agent8004 */
    sourceType: { type: String, enum: ['prompt', 'skill', 'agent8004'], default: 'prompt' },
    /** Reference id (UserPrompt _id, tool id, 8004 asset, etc.) */
    sourceId: { type: String, required: true },
    /** Paid API path that generated this earning */
    paidPath: { type: String, required: true },
    /** Gross amount attributed in micro-USDC (6 decimals) */
    amountMicroUsdc: { type: Number, required: true, min: 0 },
    /** Creator share in micro-USDC (after platform fee) */
    creatorShareMicroUsdc: { type: Number, required: true, min: 0 },
    /** Platform fee in micro-USDC */
    platformFeeMicroUsdc: { type: Number, default: 0, min: 0 },
    /** Payout status */
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    payoutTxSignature: { type: String, default: null },
    paidAt: { type: Date, default: null },
    /** Optional link to PaidApiCall */
    paidApiCallId: { type: mongoose.Schema.Types.ObjectId, ref: 'PaidApiCall', default: null },
  },
  { timestamps: true },
);

skillEarningSchema.index({ creatorAnonymousId: 1, status: 1, createdAt: -1 });
skillEarningSchema.index({ creatorWallet: 1, status: 1 });

const SkillEarning = mongoose.model('SkillEarning', skillEarningSchema);
export default SkillEarning;
