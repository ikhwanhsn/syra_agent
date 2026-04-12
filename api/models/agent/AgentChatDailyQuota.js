import mongoose from 'mongoose';

/** One row per (anonymousId, UTC calendar day) for agent website chat question caps. */
const agentChatDailyQuotaSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    anonymousId: { type: String, required: true, index: true },
    /** UTC date string YYYY-MM-DD */
    dayUtc: { type: String, required: true },
    count: { type: Number, default: 0 },
    /** Set each request: whether this request was allowed to consume one question slot. */
    lastAskAllowed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

agentChatDailyQuotaSchema.index({ dayUtc: 1 });

const AgentChatDailyQuota = mongoose.model('AgentChatDailyQuota', agentChatDailyQuotaSchema);
export default AgentChatDailyQuota;
