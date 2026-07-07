import mongoose from 'mongoose';

/** Latest $ANSEM X engagement check per connected wallet (leaderboard source). */
const ansemEngagementRecordSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    anonymousId: { type: String, required: true, index: true },
    walletAddress: { type: String, required: true, index: true },
    xUsername: { type: String, required: true, index: true },
    xUserId: { type: String, index: true },
    displayName: { type: String, default: '' },
    profileImageUrl: { type: String, default: null },
    followersCount: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0, index: true },
    grade: { type: String, default: 'F' },
    ansemMentionCount: { type: Number, default: 0 },
    ansemEngagementTotal: { type: Number, default: 0 },
    avgEngagementRatePct: { type: Number, default: 0 },
    breakdown: { type: mongoose.Schema.Types.Mixed, default: null },
    topTweets: { type: [mongoose.Schema.Types.Mixed], default: [] },
    checkedAt: { type: Date, default: Date.now, index: true },
    dayUtc: { type: String, required: true },
  },
  { timestamps: true },
);

ansemEngagementRecordSchema.index({ engagementScore: -1, checkedAt: -1 });

const AnsemEngagementRecord = mongoose.model('AnsemEngagementRecord', ansemEngagementRecordSchema);
export default AnsemEngagementRecord;
