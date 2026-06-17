import mongoose from "mongoose";

/**
 * Precomputed BTC intelligence payloads refreshed by background scheduler.
 * Keys: `overview`, `dashboard`, `bubblemap:{exchange}:{interval}:{limit}`
 */
const btcIntelligenceSnapshotSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    payload: { type: mongoose.Schema.Types.Mixed, required: true },
    computedAt: { type: Date, required: true, index: true },
    refreshDurationMs: { type: Number, default: null },
    lastError: { type: String, default: null },
  },
  { timestamps: true },
);

const BtcIntelligenceSnapshot =
  mongoose.models.BtcIntelligenceSnapshot ||
  mongoose.model("BtcIntelligenceSnapshot", btcIntelligenceSnapshotSchema);

export default BtcIntelligenceSnapshot;
