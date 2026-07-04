import mongoose from 'mongoose';

/** One row per (anonymousId, UTC calendar day) for earn playbook AI fill caps. */
const playbookAiDailyQuotaSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    anonymousId: { type: String, required: true, index: true },
    /** UTC date string YYYY-MM-DD */
    dayUtc: { type: String, required: true },
    count: { type: Number, default: 0 },
    /** Set each consume attempt: whether this request was allowed to use one slot. */
    lastAskAllowed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

playbookAiDailyQuotaSchema.index({ dayUtc: 1 });

const PlaybookAiDailyQuota = mongoose.model('PlaybookAiDailyQuota', playbookAiDailyQuotaSchema);
export default PlaybookAiDailyQuota;
