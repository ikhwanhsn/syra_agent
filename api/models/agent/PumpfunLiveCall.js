import mongoose from 'mongoose';

/** Rolling global feed — max 100 most recent scans across all users. */
const pumpfunLiveCallSchema = new mongoose.Schema(
  {
    callId: { type: String, required: true, unique: true, index: true },
    callerWallet: { type: String, required: true, index: true },
    mint: { type: String, required: true, index: true },
    symbol: { type: String, default: 'TOKEN' },
    name: { type: String, default: 'Token' },
    imageUri: { type: String, default: null },
    scanMarketCapUsd: { type: Number, default: null },
    peakGainMultiplier: { type: Number, default: null },
    syraAlphaScore: { type: Number, default: 0 },
    syraAlphaVerdict: { type: String, default: '' },
    syraAlphaTone: { type: String, default: 'warning' },
    scannedAt: { type: Date, default: Date.now },
    feedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

pumpfunLiveCallSchema.index({ feedAt: -1 });

const PumpfunLiveCall = mongoose.model('PumpfunLiveCall', pumpfunLiveCallSchema);
export default PumpfunLiveCall;
