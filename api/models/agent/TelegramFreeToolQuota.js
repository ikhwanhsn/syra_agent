import mongoose from 'mongoose';

/** One row per (anonymousId, UTC day) for Telegram free paid-tool allowance. */
const telegramFreeToolQuotaSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    anonymousId: { type: String, required: true, index: true },
    dayUtc: { type: String, required: true },
    count: { type: Number, default: 0 },
    lastConsumeAllowed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

telegramFreeToolQuotaSchema.index({ dayUtc: 1 });

const TelegramFreeToolQuota = mongoose.model(
  'TelegramFreeToolQuota',
  telegramFreeToolQuotaSchema,
);
export default TelegramFreeToolQuota;
