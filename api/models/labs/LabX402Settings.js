/**
 * LabX402Settings — singleton document for x402 Labs auto-caller configuration.
 */
import mongoose from 'mongoose';

const labX402SettingsSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: 'default', unique: true },
    autoCallEnabled: { type: Boolean, default: false },
    intervalMs: { type: Number, default: 300_000, min: 60_000, max: 3_600_000 },
    refundEnabled: { type: Boolean, default: true },
    jitterPct: { type: Number, default: 20, min: 0, max: 50 },
    maxDailyCalls: { type: Number, default: 2000, min: 100, max: 10_000 },
  },
  { timestamps: true },
);

export default mongoose.models.LabX402Settings || mongoose.model('LabX402Settings', labX402SettingsSchema);
