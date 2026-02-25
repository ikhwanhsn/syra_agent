/**
 * Logs each API request for team insights: volume, errors, latency by path.
 * Used for dashboard: total requests, error rate, top paths, average duration.
 * TTL index auto-deletes documents after 90 days to limit storage.
 */
import mongoose from 'mongoose';

const apiRequestLogSchema = new mongoose.Schema(
  {
    /** Normalized path (e.g. /v2/news, /analytics/kpi). */
    path: { type: String, required: true },
    /** HTTP method. */
    method: { type: String, required: true },
    /** Response status code (e.g. 200, 402, 500). */
    statusCode: { type: Number, required: true },
    /** Response time in milliseconds. */
    durationMs: { type: Number, default: 0 },
    /** 'api' | 'agent' when known (e.g. from header or route). */
    source: { type: String, default: 'api' },
    /** True if request was paid (x402 settled). */
    paid: { type: Boolean, default: false },
  },
  { timestamps: true }
);

apiRequestLogSchema.index({ createdAt: 1 });
apiRequestLogSchema.index({ path: 1, createdAt: 1 });
apiRequestLogSchema.index({ statusCode: 1, createdAt: 1 });
// TTL: delete after 90 days
apiRequestLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const ApiRequestLog = mongoose.model('ApiRequestLog', apiRequestLogSchema);
export default ApiRequestLog;
