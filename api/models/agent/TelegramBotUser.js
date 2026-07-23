import mongoose from 'mongoose';

const pendingActionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['withdraw', 'export_key', 'referral_name'], required: true },
    step: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const suggestedQuestionsSchema = new mongoose.Schema(
  {
    questions: { type: [String], default: [] },
    expiresAt: { type: Date, required: true },
  },
  { _id: false },
);

const telegramBotUserSchema = new mongoose.Schema(
  {
    telegramUserId: { type: Number, required: true, unique: true, index: true },
    chatId: { type: Number, required: true, index: true },
    username: { type: String, default: null },
    firstName: { type: String, default: null },
    /** Syra agent identity — maps to AgentWallet base anonymousId (tg:<telegramUserId>). */
    anonymousId: { type: String, required: true, unique: true, index: true },
    selectedModelId: { type: String, default: '' },
    pendingAction: { type: pendingActionSchema, default: null },
    suggestedQuestions: { type: suggestedQuestionsSchema, default: null },
    messagesCount: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    /** Custom referral slug for t.me/bot?start=CODE (lowercase, unique). */
    referralCode: { type: String, default: null, sparse: true, unique: true, index: true },
    /** Referrer's tg anonymousId — x402 tool calls bill this wallet when set. */
    referredByAnonymousId: { type: String, default: null, index: true },
    referredAt: { type: Date, default: null },
    /** Count of users who joined via this user's referralCode. */
    referralCount: { type: Number, default: 0 },
    /**
     * Syra Daily digest preference.
     * null = not set (auto-enable after first message); true/false = explicit.
     */
    digestEnabled: { type: Boolean, default: null },
    /** Soft mute — no digests until unmuted (also sets digestEnabled false). */
    digestMutedAt: { type: Date, default: null },
    /** Consecutive days the user received a digest and replied the same UTC day. */
    digestDayStreak: { type: Number, default: 0 },
    lastDigestAt: { type: Date, default: null },
    lastDigestReplyAt: { type: Date, default: null },
  },
  { timestamps: true },
);

/**
 * @param {number | string} telegramUserId
 * @returns {string}
 */
export function telegramAnonymousIdFrom(telegramUserId) {
  const id = Math.trunc(Number(telegramUserId));
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error('invalid_telegram_user_id');
  }
  return `tg:${id}`;
}

const TelegramBotUser = mongoose.model('TelegramBotUser', telegramBotUserSchema);

export default TelegramBotUser;
