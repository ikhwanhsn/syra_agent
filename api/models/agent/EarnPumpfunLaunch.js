import mongoose from 'mongoose';

const earnPumpfunLaunchSchema = new mongoose.Schema(
  {
    /** Earn pillar wallet anonymousId (e.g. wallet:…:earn). */
    earnAnonymousId: { type: String, required: true, index: true },
    earnAgentAddress: { type: String, required: true, index: true },
    mint: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    symbol: { type: String, required: true },
    metadataUri: { type: String, required: true },
    /** Direct token logo URL (from IPFS upload / pump.fun coin metadata). */
    imageUri: { type: String, default: null },
    description: { type: String, default: null },
    launchSignature: { type: String, default: null },
    initialBuyLamports: { type: String, default: null },
    lastFeeCollectSignature: { type: String, default: null },
    lastFeeCollectedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

earnPumpfunLaunchSchema.index({ earnAnonymousId: 1, createdAt: -1 });

export default mongoose.models.EarnPumpfunLaunch ||
  mongoose.model('EarnPumpfunLaunch', earnPumpfunLaunchSchema);
