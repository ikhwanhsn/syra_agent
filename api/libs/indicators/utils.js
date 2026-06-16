/**
 * Shared helpers for indicator registry and engine.
 */

/**
 * @typedef {Object} CandleSeries
 * @property {number[]} open
 * @property {number[]} high
 * @property {number[]} low
 * @property {number[]} close
 * @property {number[]} volume
 * @property {number[]} time
 */

/**
 * @typedef {Record<string, { type: 'number' | 'integer' | 'boolean'; default?: number | boolean; min?: number; max?: number; description?: string }>} ParamSchema
 */

/**
 * @typedef {Object} IndicatorDefinition
 * @property {string} id
 * @property {string} name
 * @property {'momentum' | 'trend' | 'volatility' | 'volume'} category
 * @property {'close' | 'ohlc' | 'ohlcv'} inputs
 * @property {ParamSchema} params
 * @property {(series: CandleSeries, params: Record<string, unknown>, opts: { withSeries: boolean }) => IndicatorComputeResult} compute
 */

/**
 * @typedef {Object} IndicatorComputeResult
 * @property {unknown} latest
 * @property {string} signal
 * @property {unknown[] | Record<string, unknown[]> | undefined} [series]
 */

/**
 * @param {unknown} v
 * @returns {number | null}
 */
export function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown[]} arr
 * @returns {unknown}
 */
export function lastOf(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr[arr.length - 1];
}

/**
 * @param {ParamSchema} schema
 * @param {Record<string, unknown>} raw
 * @returns {Record<string, unknown>}
 */
export function resolveParams(schema, raw = {}) {
  /** @type {Record<string, unknown>} */
  const out = {};
  for (const [key, spec] of Object.entries(schema)) {
    let val = raw[key] !== undefined ? raw[key] : spec.default;
    if (spec.type === "boolean") {
      out[key] =
        val === true ||
        val === "true" ||
        val === 1 ||
        val === "1";
      continue;
    }
    const n = toNum(val);
    if (n == null) {
      if (spec.default !== undefined) out[key] = spec.default;
      continue;
    }
    let clamped = n;
    if (spec.type === "integer") clamped = Math.round(clamped);
    if (spec.min != null) clamped = Math.max(spec.min, clamped);
    if (spec.max != null) clamped = Math.min(spec.max, clamped);
    out[key] = clamped;
  }
  return out;
}

/**
 * @param {unknown} latest
 * @param {string} signal
 * @param {unknown} [series]
 * @param {boolean} withSeries
 * @returns {IndicatorComputeResult}
 */
export function makeResult(latest, signal, series, withSeries) {
  return {
    latest,
    signal,
    ...(withSeries && series !== undefined ? { series } : {}),
  };
}

/**
 * Align indicator output (shorter than input) with candle timestamps.
 * @param {number[]} times
 * @param {unknown[]} values
 * @returns {{ time: number; value: unknown }[]}
 */
export function alignSeriesWithTimes(times, values) {
  if (!Array.isArray(values) || values.length === 0) return [];
  const offset = Math.max(0, times.length - values.length);
  return values.map((value, i) => ({
    time: times[offset + i],
    value,
  }));
}

/**
 * @param {Record<string, unknown[]>} multiSeries
 * @param {number[]} times
 * @returns {Record<string, { time: number; value: unknown }[]>}
 */
export function alignMultiSeriesWithTimes(multiSeries, times) {
  /** @type {Record<string, { time: number; value: unknown }[]>} */
  const out = {};
  for (const [key, values] of Object.entries(multiSeries)) {
    out[key] = alignSeriesWithTimes(times, values);
  }
  return out;
}

/**
 * @param {number} rsi
 * @returns {string}
 */
export function rsiSignal(rsi) {
  if (!Number.isFinite(rsi)) return "insufficient_data";
  if (rsi >= 70) return "overbought";
  if (rsi <= 30) return "oversold";
  if (rsi >= 55) return "bullish_momentum";
  if (rsi <= 45) return "bearish_momentum";
  return "neutral";
}

/**
 * @param {number | null | undefined} macd
 * @param {number | null | undefined} signal
 * @param {number | null | undefined} histogram
 * @returns {string}
 */
export function macdSignal(macd, signal, histogram) {
  if (!Number.isFinite(macd) || !Number.isFinite(signal)) return "insufficient_data";
  if (Number.isFinite(histogram)) {
    if (histogram > 0 && macd > signal) return "bullish_momentum";
    if (histogram < 0 && macd < signal) return "bearish_momentum";
  }
  if (macd > signal) return "macd_above_signal";
  if (macd < signal) return "macd_below_signal";
  return "neutral";
}

/**
 * @param {number} close
 * @param {number} upper
 * @param {number} middle
 * @param {number} lower
 * @returns {string}
 */
export function bollingerSignal(close, upper, middle, lower) {
  if (!Number.isFinite(close) || !Number.isFinite(upper) || !Number.isFinite(lower)) {
    return "insufficient_data";
  }
  if (close >= upper) return "near_upper_band";
  if (close <= lower) return "near_lower_band";
  if (close > middle) return "above_middle";
  if (close < middle) return "below_middle";
  return "neutral";
}

/**
 * @param {number} value
 * @param {number} overbought
 * @param {number} oversold
 * @returns {string}
 */
export function oscillatorSignal(value, overbought, oversold) {
  if (!Number.isFinite(value)) return "insufficient_data";
  if (value >= overbought) return "overbought";
  if (value <= oversold) return "oversold";
  return "neutral";
}
