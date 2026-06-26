/**
 * Signal gate evaluation for BTC quant experiment strategies.
 */
import { extractSignalFields } from "./experimentSignalExtract.js";

/**
 * Enrich extracted signal fields with derived comparisons for gate checks.
 * @param {ReturnType<typeof extractSignalFields>} signal
 */
export function buildBtcQuantGateSignals(signal) {
  const price = signal.priceAtSignal;
  const vwap = signal.vwap;
  const support = signal.support;
  const resistance = signal.resistance;
  const macdHist = signal.macd?.histogram ?? null;

  const priceAboveVwap =
    price != null && vwap != null && price > 0 && vwap > 0 ? price >= vwap : false;

  const nearSupport =
    price != null && support != null && support > 0
      ? Math.abs(price - support) / support <= 0.015
      : false;

  const nearResistanceBreak =
    price != null && resistance != null && resistance > 0 ? price >= resistance * 0.998 : false;

  const ema12AboveEma26 =
    signal.ema12 != null && signal.ema26 != null ? signal.ema12 > signal.ema26 : false;

  return {
    ...signal,
    macd_histogram: macdHist,
    price_above_vwap: priceAboveVwap,
    near_support: nearSupport,
    near_resistance_break: nearResistanceBreak,
    ema12_above_ema26: ema12AboveEma26,
  };
}

/**
 * @param {{ field: string; op: string; value: unknown }} condition
 * @param {Record<string, unknown>} signals
 */
function checkCondition(condition, signals) {
  const field = String(condition.field || "");
  let v = signals[field];
  if (field === "macd_histogram" && v == null && signals.macd && typeof signals.macd === "object") {
    v = /** @type {{ histogram?: number }} */ (signals.macd).histogram;
  }
  const op = condition.op;
  const target = condition.value;
  switch (op) {
    case "eq":
      return v === target;
    case "gte":
      return Number(v) >= Number(target);
    case "lte":
      return Number(v) <= Number(target);
    case "gt":
      return Number(v) > Number(target);
    case "lt":
      return Number(v) < Number(target);
    default:
      return false;
  }
}

/**
 * @param {{ signalGate?: { all?: unknown[]; any?: unknown[]; minPasses?: number } }} strategy
 * @param {Record<string, unknown>} signals
 */
export function applyBtcQuantSignalGate(strategy, signals) {
  const gate = strategy.signalGate || {};
  const reasons = [];
  const all = Array.isArray(gate.all) ? gate.all : [];
  const any = Array.isArray(gate.any) ? gate.any : [];

  for (const cond of all) {
    if (!checkCondition(/** @type {{ field: string; op: string; value: unknown }} */ (cond), signals)) {
      reasons.push(`all:${/** @type {{ field: string }} */ (cond).field}`);
    }
  }

  if (any.length > 0) {
    let passCount = 0;
    for (const cond of any) {
      if (checkCondition(/** @type {{ field: string; op: string; value: unknown }} */ (cond), signals)) {
        passCount += 1;
      }
    }
    const required = Number.isFinite(Number(gate.minPasses)) ? Number(gate.minPasses) : 1;
    if (passCount < required) {
      reasons.push(`any:minPasses:${passCount}/${required}`);
    }
  }

  return { pass: reasons.length === 0, reasons };
}

/**
 * @param {Record<string, unknown>} report
 */
export function extractBtcQuantGateSignals(report) {
  return buildBtcQuantGateSignals(extractSignalFields(report));
}
