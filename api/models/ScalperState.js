import mongoose from "mongoose";

const scalperStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    title: { type: String, default: "Scalper agent" },
    startedAt: { type: Date, default: Date.now },
    cashUsd: { type: Number, default: 1000 },
    startingBankUsd: { type: Number, default: 1000 },
    realizedPnlUsd: { type: Number, default: 0 },
    openPositions: { type: Number, default: 0 },
    deployedUsd: { type: Number, default: 0 },
    totalTrades: { type: Number, default: 0 },
    wins: { type: Number, default: 0 },
    losses: { type: Number, default: 0 },
    expired: { type: Number, default: 0 },
    lastSignalAt: { type: Date, default: null },
    lastResolveAt: { type: Date, default: null },
    lastOpportunityScan: { type: mongoose.Schema.Types.Mixed, default: null },
    simConfig: { type: mongoose.Schema.Types.Mixed, default: null },
    /** symbol -> last closedAt ms for cooldown */
    symbolCooldowns: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true, collection: "scalper_state" },
);

const ScalperState =
  mongoose.models.ScalperState || mongoose.model("ScalperState", scalperStateSchema);

export default ScalperState;
