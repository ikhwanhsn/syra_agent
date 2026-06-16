/**
 * Fetch OHLCV candles and normalize to column arrays for technicalindicators.
 */
import {
  fetchBinanceKlinesJson,
  resolveBinanceSymbol,
  toBinanceInterval,
} from "../binanceSignalAnalysis.js";
import {
  fetchOkxCandlesJson,
  resolveOkxInstId,
  toOkxBar,
} from "../okxSignalAnalysis.js";
import { normalizeSignalCexSource, SIGNAL_CEX_SOURCES } from "../cexSignalAnalysis.js";
import { fetchCexOhlcvRows } from "../cexCandleFetch.js";

/** @typedef {import('./utils.js').CandleSeries} CandleSeries */

/**
 * @param {unknown[][]} raw
 * @returns {CandleSeries}
 */
export function normalizeBinanceKlines(raw) {
  const sorted = [...raw].sort((a, b) => Number(a[0]) - Number(b[0]));
  /** @type {CandleSeries} */
  const out = { open: [], high: [], low: [], close: [], volume: [], time: [] };
  for (const k of sorted) {
    if (!Array.isArray(k) || k.length < 6) continue;
    const time = Number(k[0]);
    const open = Number(k[1]);
    const high = Number(k[2]);
    const low = Number(k[3]);
    const close = Number(k[4]);
    const volume = Number(k[5]);
    if (![time, open, high, low, close].every(Number.isFinite)) continue;
    out.time.push(time);
    out.open.push(open);
    out.high.push(high);
    out.low.push(low);
    out.close.push(close);
    out.volume.push(Number.isFinite(volume) ? volume : 0);
  }
  return out;
}

/**
 * OKX returns newest-first; normalize ascending by time.
 * @param {string[][]} rows
 * @returns {CandleSeries}
 */
export function normalizeOkxCandles(rows) {
  const sorted = [...rows].sort((a, b) => Number(a[0]) - Number(b[0]));
  /** @type {CandleSeries} */
  const out = { open: [], high: [], low: [], close: [], volume: [], time: [] };
  for (const r of sorted) {
    if (!Array.isArray(r) || r.length < 6) continue;
    const time = Number(r[0]);
    const open = Number(r[1]);
    const high = Number(r[2]);
    const low = Number(r[3]);
    const close = Number(r[4]);
    const volume = Number(r[5]);
    if (![time, open, high, low, close].every(Number.isFinite)) continue;
    out.time.push(time);
    out.open.push(open);
    out.high.push(high);
    out.low.push(low);
    out.close.push(close);
    out.volume.push(Number.isFinite(volume) ? volume : 0);
  }
  return out;
}

/**
 * Generic engine-row format: [tsMs, open, high, low, close, vol, ...]
 * @param {unknown[][]} rows
 * @returns {CandleSeries}
 */
export function normalizeEngineRows(rows) {
  const sorted = [...rows].sort((a, b) => Number(a[0]) - Number(b[0]));
  /** @type {CandleSeries} */
  const out = { open: [], high: [], low: [], close: [], volume: [], time: [] };
  for (const r of sorted) {
    if (!Array.isArray(r) || r.length < 5) continue;
    const time = Number(r[0]);
    const open = Number(r[1]);
    const high = Number(r[2]);
    const low = Number(r[3]);
    const close = Number(r[4]);
    const volume = Number(r[5] ?? 0);
    if (![time, open, high, low, close].every(Number.isFinite)) continue;
    out.time.push(time);
    out.open.push(open);
    out.high.push(high);
    out.low.push(low);
    out.close.push(close);
    out.volume.push(Number.isFinite(volume) ? volume : 0);
  }
  return out;
}

/**
 * @typedef {Object} FetchCandlesResult
 * @property {string} source
 * @property {string} symbol
 * @property {string} interval
 * @property {number} limit
 * @property {CandleSeries} series
 * @property {number | null} lastClose
 * @property {string} asOf
 */

/**
 * @param {{ symbol?: string; token?: string; source?: string; interval?: string; bar?: string; limit?: number; signal?: AbortSignal }} opts
 * @returns {Promise<FetchCandlesResult>}
 */
export async function fetchCandles(opts = {}) {
  const source = normalizeSignalCexSource(opts.source) || "binance";
  const interval = String(opts.interval ?? opts.bar ?? "1h").trim() || "1h";
  const limit = Math.min(1000, Math.max(20, Number(opts.limit) || 200));
  const symbolInput = String(opts.symbol ?? opts.token ?? "BTCUSDT").trim();

  if (source === "binance") {
    const symbol = resolveBinanceSymbol(symbolInput, symbolInput);
    const raw = await fetchBinanceKlinesJson(symbol, {
      interval: toBinanceInterval(interval),
      limit,
      signal: opts.signal,
    });
    const series = normalizeBinanceKlines(raw);
    if (series.close.length < 2) {
      throw new Error(`Insufficient candle data for ${symbol} on binance`);
    }
    return {
      source,
      symbol,
      interval: toBinanceInterval(interval),
      limit,
      series,
      lastClose: series.close[series.close.length - 1] ?? null,
      asOf: new Date().toISOString(),
    };
  }

  if (source === "okx") {
    const instId = resolveOkxInstId(symbolInput, symbolInput);
    const body = await fetchOkxCandlesJson(instId, {
      bar: toOkxBar(interval),
      limit,
      signal: opts.signal,
    });
    const series = normalizeOkxCandles(body.data);
    if (series.close.length < 2) {
      throw new Error(`Insufficient candle data for ${instId} on okx`);
    }
    return {
      source,
      symbol: instId,
      interval: toOkxBar(interval),
      limit,
      series,
      lastClose: series.close[series.close.length - 1] ?? null,
      asOf: new Date().toISOString(),
    };
  }

  const { instrument, rows } = await fetchCexOhlcvRows(source, {
    token: symbolInput,
    instId: symbolInput,
    bar: interval,
    limit,
    signal: opts.signal,
  });
  const series = normalizeEngineRows(rows);
  if (series.close.length < 2) {
    throw new Error(`Insufficient candle data for ${instrument} on ${source}`);
  }
  return {
    source,
    symbol: instrument,
    interval,
    limit,
    series,
    lastClose: series.close[series.close.length - 1] ?? null,
    asOf: new Date().toISOString(),
  };
}

export { SIGNAL_CEX_SOURCES };
