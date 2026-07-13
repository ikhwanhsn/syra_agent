/**
 * Per-endpoint UTC-day call quota for PayAI-facilitated Labs x402 routes.
 * Tracks rolled daily cap and consumed count (global, not per-payer).
 */
import mongoose from 'mongoose';

const labPayaiEndpointQuotaSchema = new mongoose.Schema(
  {
    endpointId: { type: String, required: true },
    dayUtc: { type: String, required: true },
    count: { type: Number, default: 0, min: 0 },
    /** Rolled cap for this endpoint on this UTC day. */
    dailyCap: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
);

labPayaiEndpointQuotaSchema.index({ endpointId: 1, dayUtc: 1 }, { unique: true });

export default mongoose.models.LabPayaiEndpointQuota ||
  mongoose.model('LabPayaiEndpointQuota', labPayaiEndpointQuotaSchema);
