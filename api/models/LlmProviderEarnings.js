import mongoose from 'mongoose';

const llmProviderEarningsSchema = new mongoose.Schema(
  {
    creatorAnonymousId: { type: String, required: true, index: true },
    providerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LlmProvider',
      required: true,
      index: true,
    },
    payoutWallet: { type: String, default: null, index: true },
    paidPath: { type: String, required: true },
    /** Gross caller charge in micro-USDC (6 decimals). */
    amountMicroUsdc: { type: Number, required: true, min: 0 },
    /** Seller share after platform fee (micro-USDC). */
    sellerShareMicroUsdc: { type: Number, required: true, min: 0 },
    /** Platform fee (micro-USDC) — feeds $SYRA buyback. */
    platformFeeMicroUsdc: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
      index: true,
    },
    payoutTxSignature: { type: String, default: null },
    paidAt: { type: Date, default: null },
    paidApiCallId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaidApiCall',
      default: null,
    },
    /** Idempotency key from settle (tx signature or synthetic). */
    callIdempotencyKey: { type: String, default: null, unique: true, sparse: true },
    modelId: { type: String, default: null },
    routePolicy: { type: String, default: null },
  },
  { timestamps: true, collection: 'llm_provider_earnings' },
);

llmProviderEarningsSchema.index({ creatorAnonymousId: 1, status: 1, createdAt: -1 });
llmProviderEarningsSchema.index({ payoutWallet: 1, status: 1 });

const LlmProviderEarnings =
  mongoose.models.LlmProviderEarnings ||
  mongoose.model('LlmProviderEarnings', llmProviderEarningsSchema);

export default LlmProviderEarnings;
