/**
 * Environment-driven configuration for the OKX.AI Trading Hackathon agent.
 *
 * All knobs are read from env with conservative defaults so the loop is safe
 * out of the box (paper mode, disabled cron). Flip `OKX_TRADING_LIVE=true` and
 * fund the bound Agentic Wallet only after the dry run passes.
 *
 * Strategy posture: aggressive-but-survivable. Concentrated momentum + strong
 * signal conviction on a whitelist of liquid tokens, with hard stop-losses, a
 * trailing take-profit, and a daily max-loss circuit breaker.
 */

function num(name, def) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === "") return def;
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}

function bool(name, def) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === "") return def;
  return /^(1|true|yes|on)$/i.test(String(raw).trim());
}

function list(name, def) {
  const raw = process.env[name];
  if (raw == null || String(raw).trim() === "") return def;
  return String(raw)
    .split(/[,\s]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * @returns {{
 *   cronEnabled: boolean,
 *   live: boolean,
 *   intervalMs: number,
 *   cronSecret: string,
 *   universe: string[],
 *   signalSource: string,
 *   bars: string[],
 *   minConviction: number,
 *   maxOpenPositions: number,
 *   perTradePct: number,
 *   maxDeployedPct: number,
 *   reserveUsd: number,
 *   stopLossPct: number,
 *   trailingTakeProfitPct: number,
 *   takeProfitPct: number,
 *   dailyMaxLossPct: number,
 *   maxDrawdownPct: number,
 *   slippageBps: number,
 *   minTradeUsd: number,
 *   feeBps: number,
 *   paperStartUsd: number,
 * }}
 */
export function getTradingConfig() {
  return {
    // Lifecycle
    cronEnabled: bool("OKX_TRADING_CRON_ENABLED", false),
    live: bool("OKX_TRADING_LIVE", false),
    intervalMs: num("OKX_TRADING_INTERVAL_MS", 300_000), // 5 min
    cronSecret: (process.env.OKX_TRADING_CRON_SECRET || "").trim(),

    // Universe + signals
    universe: list("OKX_TRADING_UNIVERSE", [
      "bitcoin",
      "ethereum",
      "solana",
      "binancecoin",
      "ripple",
      "dogecoin",
    ]),
    signalSource: (process.env.OKX_TRADING_SIGNAL_SOURCE || "binance").trim(),
    bars: list("OKX_TRADING_BARS", ["1h", "15m"]),

    // Entry gating (aggressive: relatively low bar, high sizing)
    minConviction: num("OKX_TRADING_MIN_CONVICTION", 0.45),
    maxOpenPositions: num("OKX_TRADING_MAX_OPEN_POSITIONS", 3),
    perTradePct: num("OKX_TRADING_PER_TRADE_PCT", 0.35), // 35% of equity per entry
    maxDeployedPct: num("OKX_TRADING_MAX_DEPLOYED_PCT", 0.9), // keep >=10% cash
    reserveUsd: num("OKX_TRADING_RESERVE_USD", 10), // gas/fee buffer

    // Exits / risk
    stopLossPct: num("OKX_TRADING_STOP_LOSS_PCT", 0.06), // -6% hard stop
    trailingTakeProfitPct: num("OKX_TRADING_TRAILING_TP_PCT", 0.04), // 4% giveback from peak
    takeProfitPct: num("OKX_TRADING_TAKE_PROFIT_PCT", 0.25), // +25% arm trailing
    dailyMaxLossPct: num("OKX_TRADING_DAILY_MAX_LOSS_PCT", 0.15), // halt if day down 15%
    maxDrawdownPct: num("OKX_TRADING_MAX_DRAWDOWN_PCT", 0.4), // kill if total down 40%

    // Execution
    slippageBps: num("OKX_TRADING_SLIPPAGE_BPS", 80),
    minTradeUsd: num("OKX_TRADING_MIN_TRADE_USD", 5),
    feeBps: num("OKX_TRADING_FEE_BPS", 20), // modeled round-trip fee for paper fills

    // Paper simulation starting cash
    paperStartUsd: num("OKX_TRADING_PAPER_START_USD", 300),
  };
}

export function isOkxTradingCronEnabled() {
  return getTradingConfig().cronEnabled;
}
