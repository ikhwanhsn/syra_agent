import mongoose from 'mongoose';
import { ttlExpireSeconds } from '../../utils/mongoTtl.js';

/** One row per wallet scan — tracks call price/mcap for gain flex cards. */
const pumpfunScanRecordSchema = new mongoose.Schema(
  {
    callId: { type: String, required: true, unique: true, index: true },
    callerWallet: { type: String, required: true, index: true },
    mint: { type: String, required: true, index: true },
    symbol: { type: String, default: 'TOKEN' },
    name: { type: String, default: 'Token' },
    imageUri: { type: String, default: null },
    scanPriceUsd: { type: Number, default: null },
    scanMarketCapUsd: { type: Number, default: null },
    currentMarketCapUsd: { type: Number, default: null },
    peakMarketCapUsd: { type: Number, default: null },
    gainMultiplier: { type: Number, default: null },
    peakGainMultiplier: { type: Number, default: null },
    syraAlphaScore: { type: Number, default: 0 },
    syraAlphaVerdict: { type: String, default: '' },
    syraAlphaTone: { type: String, default: 'warning' },
    scannedAt: { type: Date, default: Date.now, index: true },
    lastRefreshedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

pumpfunScanRecordSchema.index({ callerWallet: 1, scannedAt: -1 });
pumpfunScanRecordSchema.index({ callerWallet: 1, mint: 1 });
pumpfunScanRecordSchema.index({ peakGainMultiplier: -1 });
pumpfunScanRecordSchema.index({ gainMultiplier: -1 });
pumpfunScanRecordSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ttlExpireSeconds('PUMPFUN_SCAN_TTL_DAYS', 60) },
);

const PumpfunScanRecord = mongoose.model('PumpfunScanRecord', pumpfunScanRecordSchema);
export default PumpfunScanRecord;
