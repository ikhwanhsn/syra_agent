import mongoose from 'mongoose';

/** Track USDC spent by a referrer sponsoring referred users' tool calls (UTC day). */
const telegramReferralDailySpendSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    anonymousId: { type: String, required: true, index: true },
    dayUtc: { type: String, required: true },
    spentUsd: { type: Number, default: 0 },
    callCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

telegramReferralDailySpendSchema.index({ dayUtc: 1 });

const TelegramReferralDailySpend = mongoose.model(
  'TelegramReferralDailySpend',
  telegramReferralDailySpendSchema,
);
export default TelegramReferralDailySpend;
