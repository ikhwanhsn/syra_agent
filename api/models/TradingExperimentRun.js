/**
 * One observation from the trading agent experiment (Binance OHLC + signal engine).
 * Spot-long only: persisted signals are BUY (open / win / loss / expired / skipped_invalid_levels / error).
 */
import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

const tradingExperimentRunSchema = new mongoose.Schema(
  {
    /** Isolated experiment ledger: primary (default / legacy) vs secondary. */
    suite: { type: String, default: "primary", index: true },
    agentId: { type: Number, required: true, min: 0, max: 999, index: true },
    agentName: { type: String, required: true },
    token: { type: String, required: true },
    bar: { type: String, required: true },
    limit: { type: Number, required: true },
    symbol: { type: String, required: true },
    /**
     * Data source key for the signal candle feed.
     * CEX suites: /signal venue (binance, okx, …). BTC onchain suite: onchain_birdeye.
     */
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
      enum: ["open", "win", "loss", "expired", "skipped_invalid_levels", "error"],
      index: true,
    },
    resolution: { type: String, default: null },
    forwardBarsExamined: { type: Number, default: 0 },
    /** Last 1m kline close time (ms) fully processed for volatile TP/SL checks */
    lastProcessed1mCloseMs: { type: Number, default: null },
    /** Consecutive validation fetch failures (reset on successful candle batch). */
    validateFailureCount: { type: Number, default: 0 },
    /** Last validation error message when fetch/processing fails. */
    lastValidateError: { type: String, default: null },
    /** When win/loss/expired/error was determined */
    resolvedAt: { type: Date, default: null },
    /** Trimmed snapshot for UI */
    summary: { type: mongoose.Schema.Types.Mixed, default: null },
    errorMessage: { type: String, default: null },
    /** Paper trade size (USD) reserved from agent cash while status is `open`. */
    notionalUsd: { type: Number, default: null },
    /** Exit price used for paper P/L (TP, SL, expire mark, or error flat). */
    simExitPrice: { type: Number, default: null },
    /** Paper P/L in USD on this leg: notional * (simExitPrice/entry - 1). */
    simPnlUsd: { type: Number, default: null },
    /** When suite is `user_custom`: link to {@link UserCustomStrategy} and owner wallet (normalized). */
    userStrategyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserCustomStrategy",
      default: null,
      index: true,
      sparse: true,
    },
    userWalletAddress: { type: String, default: null, index: true, sparse: true },
  },
  { timestamps: true },
);

tradingExperimentRunSchema.index({ agentId: 1, status: 1, createdAt: -1 });
tradingExperimentRunSchema.index({ suite: 1, agentId: 1, status: 1, createdAt: -1 });
tradingExperimentRunSchema.index({ userStrategyId: 1, status: 1, createdAt: -1 });
tradingExperimentRunSchema.index({ createdAt: -1 });
/** BTC quant lane ledger / signal scans */
tradingExperimentRunSchema.index({
  suite: 1,
  "summary.experimentId": 1,
  "summary.lane": 1,
  status: 1,
  agentId: 1,
});
// TTL: purge settled runs after N days (default 45)
tradingExperimentRunSchema.index(
  { resolvedAt: 1 },
  {
    expireAfterSeconds: ttlExpireSeconds("BTC_RUN_TTL_DAYS", 45),
    partialFilterExpression: {
      status: { $in: ["win", "loss", "expired", "error"] },
      resolvedAt: { $type: "date" },
    },
  },
);

const TradingExperimentRun =
  mongoose.models.TradingExperimentRun ||
  mongoose.model("TradingExperimentRun", tradingExperimentRunSchema);

export default TradingExperimentRun;
