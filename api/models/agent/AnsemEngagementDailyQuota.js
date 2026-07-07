import mongoose from 'mongoose';

/** One row per (anonymousId, UTC calendar day) for $ANSEM X engagement checks. */
const ansemEngagementDailyQuotaSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    anonymousId: { type: String, required: true, index: true },
    /** UTC date string YYYY-MM-DD */
    dayUtc: { type: String, required: true },
    count: { type: Number, default: 0 },
    lastAskAllowed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ansemEngagementDailyQuotaSchema.index({ dayUtc: 1 });

const AnsemEngagementDailyQuota = mongoose.model(
  'AnsemEngagementDailyQuota',
  ansemEngagementDailyQuotaSchema,
);
export default AnsemEngagementDailyQuota;
