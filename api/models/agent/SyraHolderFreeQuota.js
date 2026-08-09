import mongoose from 'mongoose';

/**
 * Daily free-call counters for $SYRA holder / staker treasury subsidies.
 * _id = `${wallet}:${dayUtc}` — one doc per wallet per UTC day with named bucket counts.
 */
const syraHolderFreeQuotaSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    wallet: { type: String, required: true, index: true },
    /** UTC date string YYYY-MM-DD */
    dayUtc: { type: String, required: true },
    /** Silver starter pack (curated tools), default cap 25 */
    starterUsed: { type: Number, default: 0 },
    /** Stake ≥100k: Tier-2 intel (news/sentiment/signal), default cap 10 */
    stakeT2Used: { type: Number, default: 0 },
    /** Stake ≥1M: Tier-3 deep synthesis, default cap 3 */
    stakeT3Used: { type: Number, default: 0 },
    /** Stake ≥1M: Brain, default cap 1 */
    stakeBrainUsed: { type: Number, default: 0 },
    lastBucket: { type: String, default: null },
    lastAllowed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

syraHolderFreeQuotaSchema.index({ dayUtc: 1 });

const SyraHolderFreeQuota = mongoose.model('SyraHolderFreeQuota', syraHolderFreeQuotaSchema);
export default SyraHolderFreeQuota;
