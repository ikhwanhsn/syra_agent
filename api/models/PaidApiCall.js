/**
 * Tracks each successful paid API call (x402 settlement) for KPI / analytics.
 * Used for grant metrics: total paid API calls, paid calls over time.
 */
import mongoose from 'mongoose';
import { ttlExpireSeconds } from '../utils/mongoTtl.js';

const paidApiCallSchema = new mongoose.Schema(
  {
    /** API path that was paid (e.g. /news, /signal). */
    path: { type: String, required: true },
    /** Optional: 'api' | 'agent' when known (e.g. from agent tools). */
    source: { type: String, default: 'api' },
    /** CAIP-2 network when known (e.g. algorand:..., solana:..., eip155:8453). */
    network: { type: String, default: null },
  },
  { timestamps: true }
);

paidApiCallSchema.index({ path: 1, createdAt: 1 });
paidApiCallSchema.index({ network: 1, createdAt: 1 });
paidApiCallSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ttlExpireSeconds('PAID_API_CALL_TTL_DAYS', 90) },
);

const PaidApiCall = mongoose.model('PaidApiCall', paidApiCallSchema);
export default PaidApiCall;
