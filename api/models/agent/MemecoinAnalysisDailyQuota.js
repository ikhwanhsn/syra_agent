import mongoose from 'mongoose';

/** One row per (ownerKey, UTC calendar day) for Pumpfun memecoin analysis scan caps. */
const memecoinAnalysisDailyQuotaSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    ownerKey: { type: String, required: true, index: true },
    /** UTC date string YYYY-MM-DD */
    dayUtc: { type: String, required: true },
    count: { type: Number, default: 0 },
    /** Set each request: whether this request was allowed to consume one scan slot. */
    lastScanAllowed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

memecoinAnalysisDailyQuotaSchema.index({ dayUtc: 1 });

const MemecoinAnalysisDailyQuota = mongoose.model(
  'MemecoinAnalysisDailyQuota',
  memecoinAnalysisDailyQuotaSchema,
);
export default MemecoinAnalysisDailyQuota;
