import mongoose from "mongoose";

/**
 * Singleton config + lifecycle state for the OKX.AI Trading Hackathon agent.
 *
 * The agent trades an OKX Agentic Wallet through Onchain OS on a fully
 * automated loop. `enabled` starts the loop; `killed` is a hard stop that
 * overrides everything (flatten + halt). `live` gates real on-chain execution
 * (false = paper/simulation so the loop can be validated without risking funds).
 */
const okxTradingConfigSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    enabled: { type: Boolean, default: false, index: true },
    killed: { type: Boolean, default: false, index: true },
    /** false = paper/simulation, true = real Onchain OS execution. */
    live: { type: Boolean, default: false },
    title: { type: String, default: "Syra Trading ASP (OKX.AI Season 1)" },
    /** Bound OKX Agentic Wallet address (leaderboard attribution). */
    agentWalletAddress: { type: String, default: null, index: true },
    startedAt: { type: Date, default: null },
    /** Starting equity baseline (USDT) captured at competition open. */
    startEquityUsd: { type: Number, default: null, min: 0 },
    /** Equity at the start of the current UTC day (for the daily loss breaker). */
    dayStartEquityUsd: { type: Number, default: null, min: 0 },
    dayStartAt: { type: Date, default: null },
    /** Tracked un-deployed cash (USDT). Authoritative in paper mode. */
    paperCashUsd: { type: Number, default: null },
    lastRunAt: { type: Date, default: null },
    lastError: { type: String, default: null },
    lastHaltReason: { type: String, default: null },
    processing: { type: Boolean, default: false },
  },
  { collection: "okx_trading_config", timestamps: true },
);

const OkxTradingConfig =
  mongoose.models.OkxTradingConfig ||
  mongoose.model("OkxTradingConfig", okxTradingConfigSchema);

export default OkxTradingConfig;
