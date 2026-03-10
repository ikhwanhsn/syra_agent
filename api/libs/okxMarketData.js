/**
 * OKX API v5 market data (public endpoints, no auth).
 * Base: https://www.okx.com/api/v5
 * Supports: ticker, tickers, books, candles, trades, funding-rate, open-interest, index, mark-price, instruments, time.
 */

const OKX_REST_BASE = process.env.OKX_API_BASE_URL || "https://www.okx.com/api/v5";
const OKX_TIMEOUT_MS = 15_000;

/**
 * Fetch OKX REST API with timeout.
 * @param {string} path - Path (e.g. /market/ticker)
 * @param {Record<string, string>} [params] - Query params
 * @returns {Promise<object>} OKX response { code, data, msg }
 */
async function fetchOkx(path, params = {}) {
  const url = new URL(path, OKX_REST_BASE);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && String(v).trim() !== "") {
      url.searchParams.set(k, String(v).trim());
    }
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OKX_TIMEOUT_MS);
  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    clearTimeout(timeout);
    if (data.code && data.code !== "0") {
      throw new Error(data.msg || `OKX API error ${data.code}`);
    }
    return data;
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") throw new Error("OKX API timeout");
    throw err;
  }
}

/**
 * Single ticker. instId e.g. BTC-USDT, BTC-USDT-SWAP.
 * @param {string} instId - Instrument ID (default BTC-USDT)
 */
export async function getTicker(instId = "BTC-USDT") {
  const { data } = await fetchOkx("/market/ticker", { instId });
  return { result: data?.[0] ?? data ?? null };
}

/**
 * All tickers by instrument type.
 * @param {string} instType - SPOT, SWAP, FUTURES, OPTION, MARGIN
 */
export async function getTickers(instType = "SPOT") {
  const { data } = await fetchOkx("/market/tickers", { instType });
  return { result: data ?? [] };
}

/**
 * Order book snapshot.
 * @param {string} instId - Instrument ID
 * @param {number} sz - Depth (default 20, max 400)
 */
export async function getBooks(instId = "BTC-USDT", sz = 20) {
  const { data } = await fetchOkx("/market/books", {
    instId,
    sz: String(Math.min(Math.max(1, sz), 400)),
  });
  return { result: data ?? [] };
}

/**
 * OHLC candles.
 * @param {string} instId - Instrument ID
 * @param {string} bar - 1m, 3m, 5m, 15m, 30m, 1H, 2H, 4H, 6H, 12H, 1D, 1W, 1M
 * @param {number} limit - Default 100, max 300
 * @param {string} [after] - Pagination (ts in ms)
 * @param {string} [before] - Pagination (ts in ms)
 */
export async function getCandles(instId = "BTC-USDT", bar = "1H", limit = 100, after, before) {
  const params = { instId, bar, limit: String(Math.min(Math.max(1, limit), 300)) };
  if (after) params.after = after;
  if (before) params.before = before;
  const { data } = await fetchOkx("/market/candles", params);
  return { result: data ?? [] };
}

/**
 * Historical candles (older data).
 * @param {string} instId - Instrument ID
 * @param {string} bar - Same as getCandles
 * @param {string} [after] - Pagination
 * @param {string} [before] - Pagination
 * @param {number} limit - Default 100, max 300
 */
export async function getHistoryCandles(instId = "BTC-USDT", bar = "1H", after, before, limit = 100) {
  const params = { instId, bar, limit: String(Math.min(Math.max(1, limit), 300)) };
  if (after) params.after = after;
  if (before) params.before = before;
  const { data } = await fetchOkx("/market/history-candles", params);
  return { result: data ?? [] };
}

/**
 * Recent trades.
 * @param {string} instId - Instrument ID
 * @param {number} limit - Default 100, max 500
 */
export async function getTrades(instId = "BTC-USDT", limit = 100) {
  const { data } = await fetchOkx("/market/trades", {
    instId,
    limit: String(Math.min(Math.max(1, limit), 500)),
  });
  return { result: data ?? [] };
}

/**
 * Historical trades.
 * @param {string} instId - Instrument ID
 * @param {string} [after] - Pagination (trade id)
 * @param {string} [before] - Pagination
 * @param {number} limit - Default 100, max 100
 */
export async function getHistoryTrades(instId = "BTC-USDT", after, before, limit = 100) {
  const params = { instId, limit: String(Math.min(Math.max(1, limit), 100)) };
  if (after) params.after = after;
  if (before) params.before = before;
  const { data } = await fetchOkx("/market/history-trades", params);
  return { result: data ?? [] };
}

/**
 * Index tickers (e.g. BTC-USD index).
 * @param {string} [instId] - Optional, e.g. BTC-USDT
 */
export async function getIndexTickers(instId) {
  const params = {};
  if (instId) params.instId = instId;
  const { data } = await fetchOkx("/market/index-tickers", params);
  return { result: data ?? [] };
}

/**
 * Funding rate (perpetual swaps).
 * @param {string} instId - e.g. BTC-USDT-SWAP
 */
export async function getFundingRate(instId = "BTC-USDT-SWAP") {
  const { data } = await fetchOkx("/public/funding-rate", { instId });
  return { result: data?.[0] ?? data ?? null };
}

/**
 * Funding rate history.
 * @param {string} instId - e.g. BTC-USDT-SWAP
 * @param {string} [after] - Pagination
 * @param {string} [before] - Pagination
 * @param {number} limit - Default 100
 */
export async function getFundingRateHistory(instId = "BTC-USDT-SWAP", after, before, limit = 100) {
  const params = { instId, limit: String(Math.min(Math.max(1, limit), 100)) };
  if (after) params.after = after;
  if (before) params.before = before;
  const { data } = await fetchOkx("/public/funding-rate-history", params);
  return { result: data ?? [] };
}

/**
 * Open interest.
 * @param {string} instId - e.g. BTC-USDT-SWAP
 */
export async function getOpenInterest(instId = "BTC-USDT-SWAP") {
  const { data } = await fetchOkx("/public/open-interest", { instId });
  return { result: data?.[0] ?? data ?? null };
}

/**
 * Historical open interest.
 * @param {string} instId - e.g. BTC-USDT-SWAP
 * @param {string} [period] - 5m, 15m, 30m, 1H, 4H, 1D
 * @param {string} [after] - Pagination
 * @param {string} [before] - Pagination
 * @param {number} limit - Default 100
 */
export async function getHistoryOpenInterest(instId, period = "1H", after, before, limit = 100) {
  const params = { instId: instId || "BTC-USDT-SWAP", period, limit: String(Math.min(Math.max(1, limit), 100)) };
  if (after) params.after = after;
  if (before) params.before = before;
  const { data } = await fetchOkx("/public/history-open-interest", params);
  return { result: data ?? [] };
}

/**
 * Mark price (derivatives).
 * @param {string} instId - e.g. BTC-USDT-SWAP
 */
export async function getMarkPrice(instId = "BTC-USDT-SWAP") {
  const { data } = await fetchOkx("/public/mark-price", { instId });
  return { result: data?.[0] ?? data ?? null };
}

/**
 * Instruments (symbols, tick size, etc).
 * @param {string} [instType] - SPOT, SWAP, FUTURES, OPTION, MARGIN
 * @param {string} [instFamily] - e.g. BTC-USDT (for futures/swap/option)
 * @param {string} [instId] - Single instrument
 */
export async function getInstruments(instType, instFamily, instId) {
  const params = {};
  if (instType) params.instType = instType;
  if (instFamily) params.instFamily = instFamily;
  if (instId) params.instId = instId;
  const { data } = await fetchOkx("/public/instruments", params);
  return { result: data ?? [] };
}

/**
 * Server time.
 */
export async function getTime() {
  const { data } = await fetchOkx("/public/time");
  return { result: data?.[0] ?? data ?? null };
}
