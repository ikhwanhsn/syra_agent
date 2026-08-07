import mongoose from "mongoose";

/**
 * Point-in-time equity snapshot recorded each cycle. Drives PnL%, drawdown,
 * and the leaderboard progress chart.
 */
const okxTradingSnapshotSchema = new mongoose.Schema(
  {
    equityUsd: { type: Number, required: true },
    cashUsd: { type: Number, default: 0 },
    positionsUsd: { type: Number, default: 0 },
    openPositions: { type: Number, default: 0 },
    startEquityUsd: { type: Number, default: null },
    pnlUsd: { type: Number, default: 0 },
    pnlPct: { type: Number, default: 0 },
    source: { type: String, default: "paper" },
  },
  { collection: "okx_trading_snapshots", timestamps: true },
);

const OkxTradingSnapshot =
  mongoose.models.OkxTradingSnapshot ||
  mongoose.model("OkxTradingSnapshot", okxTradingSnapshotSchema);

export default OkxTradingSnapshot;
