/**
 * Pure paper-sim math for the Stocks News Lab.
 * Keep fill, cost, sizing, and exit logic here so tests do not need Mongo.
 */

export const STOCKS_MIN_LIQUIDITY_USD = 10_000;
export const STOCKS_MAX_SPREAD_PCT = 8;
export const STOCKS_DEFAULT_ROUND_TRIP_BPS = 110;
export const STOCKS_MAX_POSITION_PCT = 20;
export const STOCKS_MIN_TRADE_NOTIONAL_USD = 25;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function roundUsd(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Risk-fraction sizing: never all-in.
 * @param {number} cashUsd
 * @param {number} equityUsd
 * @param {number} [maxPositionPct]
 */
export function computeStocksNotionalUsd(
  cashUsd,
  equityUsd,
  maxPositionPct = STOCKS_MAX_POSITION_PCT,
) {
  const cash = toNum(cashUsd);
  const equity = toNum(equityUsd);
  const pct = clamp(toNum(maxPositionPct, STOCKS_MAX_POSITION_PCT), 1, 40);
  if (cash < STOCKS_MIN_TRADE_NOTIONAL_USD) return 0;
  if (!(equity > 0)) return 0;
  const capped = roundUsd(equity * (pct / 100));
  const notional = Math.min(cash, capped);
  return notional >= STOCKS_MIN_TRADE_NOTIONAL_USD ? notional : 0;
}

/**
 * Extra round-trip cost from quoted spread vs Nasdaq and size vs pool liquidity.
 * @param {{
 *   notionalUsd?: number;
 *   liquidityUsd?: number | null;
 *   spreadPct?: number | null;
 *   baseRoundTripBps?: number;
 * }} opts
 */
export function computeStocksCostBps(opts = {}) {
  const base = Math.max(0, toNum(opts.baseRoundTripBps, STOCKS_DEFAULT_ROUND_TRIP_BPS));
  const spreadPct = Math.max(0, toNum(opts.spreadPct));
  const spreadBps = Math.min(250, spreadPct * 100 * 2);
  const notional = Math.max(0, toNum(opts.notionalUsd));
  const liq = Math.max(0, toNum(opts.liquidityUsd));
  let slipBps = 15;
  if (liq > 0 && notional > 0) {
    slipBps = clamp((notional / liq) * 10_000, 8, 180);
  }
  return roundUsd(base + spreadBps + slipBps);
}

/**
 * Reject fills that a real swap could not take.
 * @param {{
 *   priceUsd?: number | null;
 *   source?: string | null;
 *   liquidityUsd?: number | null;
 *   spreadPct?: number | null;
 * }} quote
 */
export function isTradableStocksQuote(quote = {}) {
  const px = toNum(quote.priceUsd);
  if (!(px > 0)) return { ok: false, reason: "no_price" };
  const source = String(quote.source || "");
  if (source === "nasdaq_reference" || source === "yahoo_finance") {
    return { ok: false, reason: "reference_price_not_fillable" };
  }
  const liq = quote.liquidityUsd == null ? null : toNum(quote.liquidityUsd);
  if (liq != null && liq < STOCKS_MIN_LIQUIDITY_USD) {
    return { ok: false, reason: "thin_liquidity" };
  }
  const spread = quote.spreadPct == null ? null : toNum(quote.spreadPct);
  if (spread != null && spread > STOCKS_MAX_SPREAD_PCT) {
    return { ok: false, reason: "stale_or_mismatched_quote" };
  }
  return { ok: true, reason: null };
}

export function priceMovePct(entry, px) {
  const e = toNum(entry);
  const p = toNum(px);
  if (!(e > 0) || !(p > 0)) return 0;
  return ((p - e) / e) * 100;
}

export function signedPnlPct(side, entry, exitPx) {
  const move = priceMovePct(entry, exitPx);
  return side === "short" ? -move : move;
}

/**
 * Scale fixed stop/target by realized volatility (ATR proxy in percent).
 * @param {{ stopLossPct?: number; takeProfitPct?: number; atrScale?: boolean }} exit
 * @param {number} [volatilityPct]
 */
export function scaleExitsByVolatility(exit = {}, volatilityPct) {
  const baseSl = toNum(exit.stopLossPct, -5);
  const baseTp = toNum(exit.takeProfitPct, 8);
  if (exit.atrScale === false) {
    return {
      stopLossPct: clamp(baseSl, -12, -1.5),
      takeProfitPct: clamp(baseTp, 2, 20),
    };
  }
  const vol = toNum(volatilityPct, 1.5);
  const scale = clamp(vol / 1.5, 0.7, 2.2);
  return {
    stopLossPct: clamp(roundUsd(baseSl * scale), -12, -1.5),
    takeProfitPct: clamp(roundUsd(baseTp * scale), 2, 20),
  };
}

/**
 * @param {{
 *   side?: string;
 *   entryPriceUsd: number;
 *   markPriceUsd: number;
 *   openedAt?: Date | string | null;
 *   now?: Date | number;
 *   stopLossPct?: number;
 *   takeProfitPct?: number;
 *   maxHoldHours?: number;
 * }} args
 * @returns {{ status: string; resolution: string; exitPx: number } | null}
 */
export function evaluateStocksExit(args) {
  const side = args.side === "short" ? "short" : "long";
  const entry = toNum(args.entryPriceUsd);
  const px = toNum(args.markPriceUsd);
  if (!(entry > 0) || !(px > 0)) return null;

  const sl = toNum(args.stopLossPct, -5);
  const tp = toNum(args.takeProfitPct, 8);
  const move = priceMovePct(entry, px);
  const isShort = side === "short";

  if (isShort ? move <= -tp : move >= tp) {
    return {
      status: "win",
      resolution: "take_profit",
      exitPx: isShort ? entry * (1 - tp / 100) : entry * (1 + tp / 100),
    };
  }
  if (isShort ? move >= -sl : move <= sl) {
    return {
      status: "loss",
      resolution: "stop_loss",
      exitPx: isShort ? entry * (1 - sl / 100) : entry * (1 + sl / 100),
    };
  }

  if (!args.openedAt) return null;
  const opened = new Date(args.openedAt).getTime();
  if (!Number.isFinite(opened)) return null;
  const now =
    args.now instanceof Date
      ? args.now.getTime()
      : typeof args.now === "number"
        ? args.now
        : Date.now();
  const maxHoldHours = Math.max(1, toNum(args.maxHoldHours, 48));
  const holdMs = maxHoldHours * 3_600_000;
  const heldMs = now - opened;
  const signed = signedPnlPct(side, entry, px);
  const timeStopMs = holdMs * 0.5;
  if (heldMs > timeStopMs && signed < 0) {
    return { status: "loss", resolution: "time_stop", exitPx: px };
  }
  if (heldMs > holdMs) {
    return {
      status: signed >= 0 ? "win" : "expired",
      resolution: "max_hold",
      exitPx: px,
    };
  }
  return null;
}

/**
 * @param {{
 *   side?: string;
 *   entryPriceUsd: number;
 *   exitPriceUsd: number;
 *   notionalUsd: number;
 *   costBps?: number;
 * }} args
 */
export function computeStocksSimPnl(args) {
  const entry = toNum(args.entryPriceUsd);
  const exitPx = toNum(args.exitPriceUsd);
  const notional = toNum(args.notionalUsd);
  const costBps = Math.max(0, toNum(args.costBps, STOCKS_DEFAULT_ROUND_TRIP_BPS));
  const signedMove = signedPnlPct(args.side, entry, exitPx) / 100;
  const grossPnl = roundUsd(notional * signedMove);
  const costUsd = roundUsd(notional * (costBps / 10_000));
  const simPnlUsd = roundUsd(grossPnl - costUsd);
  const simPnlPct = roundUsd(signedMove * 100 - costBps / 100);
  let labeledStatus = "loss";
  if (simPnlUsd > 0) labeledStatus = "win";
  else if (args.expired && simPnlUsd <= 0) labeledStatus = "expired";
  return { grossPnl, costUsd, simPnlUsd, simPnlPct, labeledStatus };
}

/**
 * Relabel a raw exit status after costs.
 * @param {string} status
 * @param {number} simPnlUsd
 */
export function relabelStatusAfterCost(status, simPnlUsd) {
  if (simPnlUsd > 0) return "win";
  if (status === "expired") return "expired";
  return "loss";
}
