/**
 * One observation from the trading agent experiment (Binance OHLC + signal engine).
 * BUY rows with status "open" await forward resolution (TP/SL/expired).
 */
import mongoose from "mongoose";

const tradingExperimentRunSchema = new mongoose.Schema(
  {
    /** Isolated experiment ledger: primary (default / legacy) vs secondary. */
    suite: { type: String, default: "primary", index: true },
    agentId: { type: Number, required: true, min: 0, max: 99, index: true },
    agentName: { type: String, required: true },
    token: { type: String, required: true },
    bar: { type: String, required: true },
    limit: { type: Number, required: true },
    symbol: { type: String, required: true },
    /** /signal CEX key when suite uses multi-resource experiment (null = Binance-only suite). */
    cexSource: { type: String, default: null, index: true },
    /** Last fully closed candle close time (ms) when signal was built */
    anchorCloseMs: { type: Number, default: null },
    clearSignal: { type: String, required: true },
    entry: { type: Number, default: null },
    stopLoss: { type: Number, default: null },
    firstTarget: { type: Number, default: null },
    priceAtSignal: { type: Number, default: null },
    confidence: { type: String, default: null },
    status: {
      type: String,
      required: true,
      enum: [
        "open",
        "win",
        "loss",
        "expired",
        "skipped_non_buy",
        "skipped_invalid_levels",
        "error",
      ],
      index: true,
    },
    resolution: { type: String, default: null },
    forwardBarsExamined: { type: Number, default: 0 },
    /** Last 1m kline close time (ms) fully processed for volatile TP/SL checks */
    lastProcessed1mCloseMs: { type: Number, default: null },
    /** When win/loss/expired/error was determined */
    resolvedAt: { type: Date, default: null },
    /** Trimmed snapshot for UI */
    summary: { type: mongoose.Schema.Types.Mixed, default: null },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true },
);

tradingExperimentRunSchema.index({ agentId: 1, status: 1, createdAt: -1 });
tradingExperimentRunSchema.index({ suite: 1, agentId: 1, status: 1, createdAt: -1 });
tradingExperimentRunSchema.index({ createdAt: -1 });

const TradingExperimentRun =
  mongoose.models.TradingExperimentRun ||
  mongoose.model("TradingExperimentRun", tradingExperimentRunSchema);

export default TradingExperimentRun;
