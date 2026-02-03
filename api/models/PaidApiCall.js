/**
 * Tracks each successful paid API call (x402 settlement) for KPI / analytics.
 * Used for grant metrics: total paid API calls, paid calls over time.
 */
import mongoose from 'mongoose';

const paidApiCallSchema = new mongoose.Schema(
  {
    /** API path that was paid (e.g. /v2/news, /v2/signal). */
    path: { type: String, required: true },
    /** Optional: 'api' | 'agent' when known (e.g. from agent tools). */
    source: { type: String, default: 'api' },
  },
  { timestamps: true }
);

paidApiCallSchema.index({ createdAt: 1 });
paidApiCallSchema.index({ path: 1, createdAt: 1 });

const PaidApiCall = mongoose.model('PaidApiCall', paidApiCallSchema);
export default PaidApiCall;
