import mongoose from "mongoose";

const mmStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    title: { type: String, default: "SYRA market maker" },
    startedAt: { type: Date, default: Date.now },
    cashUsd: { type: Number, default: 1000 },
    startingBankUsd: { type: Number, default: 1000 },
    /** SYRA inventory in raw token units (string for precision). */
    syraInventoryRaw: { type: String, default: "0" },
    syraInventoryUsd: { type: Number, default: 0 },
    realizedPnlUsd: { type: Number, default: 0 },
    cumulativeVolumeUsd: { type: Number, default: 0 },
    roundTripsCompleted: { type: Number, default: 0 },
    activeStrategyId: { type: String, default: "adaptive" },
    lastQuoteAt: { type: Date, default: null },
    lastResolveAt: { type: Date, default: null },
    lastMarketSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    lastQuoteBook: { type: mongoose.Schema.Types.Mixed, default: null },
    /** Rolling mid prices for volatility regime detection. */
    priceHistory: { type: [Number], default: [] },
    simConfig: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "mm_state" },
);

const MmState = mongoose.models.MmState || mongoose.model("MmState", mmStateSchema);

export default MmState;
