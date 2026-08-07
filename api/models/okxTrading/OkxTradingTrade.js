import mongoose from "mongoose";

/**
 * An executed (or attempted) trade fill. Immutable audit log used for PnL,
 * leaderboard evidence, and post-mortem. `mode` distinguishes paper from live.
 */
const okxTradingTradeSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, index: true },
    symbol: { type: String, default: null },
    side: { type: String, enum: ["buy", "sell"], required: true },
    mode: { type: String, enum: ["paper", "live"], default: "paper", index: true },
    status: {
      type: String,
      enum: ["filled", "failed", "skipped"],
      default: "filled",
      index: true,
    },
    requestedNotionalUsd: { type: Number, default: 0 },
    filledPriceUsd: { type: Number, default: 0 },
    filledQty: { type: Number, default: 0 },
    filledNotionalUsd: { type: Number, default: 0 },
    feeUsd: { type: Number, default: 0 },
    slippageBps: { type: Number, default: 0 },
    realizedPnlUsd: { type: Number, default: null },
    conviction: { type: Number, default: 0 },
    reason: { type: String, default: null },
    txHash: { type: String, default: null },
    error: { type: String, default: null },
  },
  { collection: "okx_trading_trades", timestamps: true },
);

const OkxTradingTrade =
  mongoose.models.OkxTradingTrade ||
  mongoose.model("OkxTradingTrade", okxTradingTradeSchema);

export default OkxTradingTrade;
