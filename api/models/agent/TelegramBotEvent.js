import mongoose from 'mongoose';

/**
 * Fire-and-forget product analytics for the Syra Telegram bot funnel.
 * Collection: telegrambotevents
 */
const telegramBotEventSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      index: true,
      enum: [
        'tg_start',
        'tg_first_message',
        'tg_free_tool',
        'tg_paid_tool',
        'tg_deposit_prompt',
        'tg_referral_share',
        'tg_referral_linked',
        'tg_digest_sent',
        'tg_digest_open',
        'tg_digest_reply',
        'tg_digest_mute',
        'tg_digest_unmute',
      ],
    },
    telegramUserId: { type: Number, default: null, index: true },
    anonymousId: { type: String, default: null, index: true },
    /** Optional structured props (toolId, referralCode, amountUsd, etc.). */
    props: { type: mongoose.Schema.Types.Mixed, default: {} },
    dayUtc: { type: String, required: true, index: true },
  },
  { timestamps: true },
);

telegramBotEventSchema.index({ event: 1, createdAt: -1 });
telegramBotEventSchema.index({ dayUtc: 1, event: 1 });

const TelegramBotEvent = mongoose.model('TelegramBotEvent', telegramBotEventSchema);
export default TelegramBotEvent;
