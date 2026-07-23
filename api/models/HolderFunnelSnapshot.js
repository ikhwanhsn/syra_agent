/**
 * Periodic $SYRA holder-growth funnel snapshots for public metrics.
 */
import mongoose from "mongoose";

const holderFunnelSnapshotSchema = new mongoose.Schema(
  {
    capturedAt: { type: Date, required: true, index: true },
    mint: { type: String, required: true },
    /** Approximate holder count when available (DexScreener / on-chain sample). */
    holderCount: { type: Number, default: null },
    marketCapUsd: { type: Number, default: null },
    liquidityUsd: { type: Number, default: null },
    volume24hUsd: { type: Number, default: null },
    priceUsd: { type: Number, default: null },
    priceChange24hPct: { type: Number, default: null },
    top10ConcentrationPct: { type: Number, default: null },
    uniqueStakers: { type: Number, default: null },
    totalStakedFormatted: { type: String, default: null },
    source: { type: String, default: "dexscreener+onchain" },
  },
  { collection: "holder_funnel_snapshots", timestamps: true },
);

holderFunnelSnapshotSchema.index({ capturedAt: -1 });

const HolderFunnelSnapshot =
  mongoose.models.HolderFunnelSnapshot ||
  mongoose.model("HolderFunnelSnapshot", holderFunnelSnapshotSchema);

export default HolderFunnelSnapshot;
