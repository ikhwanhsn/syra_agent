import mongoose from "mongoose";

/**
 * An open (or closed) position held by the trading agent.
 * One document per token; `status` transitions open -> closed on exit.
 */
const okxTradingPositionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, index: true },
    symbol: { type: String, default: null },
    status: { type: String, enum: ["open", "closed"], default: "open", index: true },
    side: { type: String, enum: ["long"], default: "long" },
    qty: { type: Number, default: 0 },
    entryPriceUsd: { type: Number, default: 0 },
    /** Highest observed price since entry — powers the trailing take-profit. */
    peakPriceUsd: { type: Number, default: 0 },
    notionalUsd: { type: Number, default: 0 },
    conviction: { type: Number, default: 0 },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    exitPriceUsd: { type: Number, default: null },
    realizedPnlUsd: { type: Number, default: null },
    exitReason: { type: String, default: null },
  },
  { collection: "okx_trading_positions", timestamps: true },
);

const OkxTradingPosition =
  mongoose.models.OkxTradingPosition ||
  mongoose.model("OkxTradingPosition", okxTradingPositionSchema);

export default OkxTradingPosition;
