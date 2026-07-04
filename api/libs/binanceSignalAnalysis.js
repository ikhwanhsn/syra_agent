/**
 * Binance public spot klines (OHLCV) + CryptoAnalysisEngine for /signal?source=binance
 *
 * Endpoint: GET https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=500
 *
 * Each candle is an array (Binance docs):
 * [
 *   1499040000000,       // 0 open time (ms)
 *   "0.01634790",        // 1 open
 *   "0.80000000",        // 2 high
 *   "0.01575800",        // 3 low
 *   "0.01577100",        // 4 close
 *   "148976.11427815",   // 5 volume (base)
 *   1499644799999,       // 6 close time
 *   "2434.19055334",     // 7 quote asset volume
 *   308,                 // 8 number of trades
 *   ...
 * ]
 */
import { CryptoAnalysisEngine } from "../scripts/cryptoAnalysisEngine.js";
import { btcRateLimitedFetch } from "./btcProviderRateLimiter.js";
import {
  binanceKlineCacheKey,
  getCachedBinanceKlineSeries,
  getCachedBinanceKlines,
  getStaleBinanceKlineSeries,
  setCachedBinanceKlineSeries,
  setCachedBinanceKlines,
} from "./binanceKlineCache.js";
import { fetchBtcKlinesFromCoinbase } from "./binanceKlineCoinbaseFallback.js";
import { getBinanceKlinesFromWsBuffer } from "./binanceKlineWsBuffer.js";
import {
  isAllBinanceRestBlocked,
  isBinanceRestBlocked,
  recordBinanceIpBan,
} from "./binanceIpBanCircuit.js";

/** @type {Map<string, Promise<unknown[][]>>} */
const inflightSeriesFetches = new Map();

const BINANCE_API = process.env.BINANCE_API_BASE_URL || "https://api.binance.com/api/v3";
const BINANCE_DATA_API =
  process.env.BINANCE_DATA_API_BASE_URL || "https://data-api.binance.vision/api/v3";
const BINANCE_REST_FETCH_TIMEOUT_MS = Number.parseInt(
  process.env.BINANCE_KLINE_FETCH_TIMEOUT_MS || "5000",
  10,
);

/** Prefer data-api (separate weight pool) over main api.binance.com. */
const BINANCE_REST_BASES = [...new Set([BINANCE_DATA_API, BINANCE_API].filter(Boolean))];

const TOKEN_TO_SYMBOL = {
  bitcoin: "BTCUSDT",
  btc: "BTCUSDT",
  ethereum: "ETHUSDT",
  eth: "ETHUSDT",
  solana: "SOLUSDT",
  sol: "SOLUSDT",
  xrp: "XRPUSDT",
  ripple: "XRPUSDT",
  dogecoin: "DOGEUSDT",
  doge: "DOGEUSDT",
  cardano: "ADAUSDT",
  ada: "ADAUSDT",
  bnb: "BNBUSDT",
  binancecoin: "BNBUSDT",
  polygon: "MATICUSDT",
  matic: "MATICUSDT",
  avalanche: "AVAXUSDT",
  avax: "AVAXUSDT",
  chainlink: "LINKUSDT",
  link: "LINKUSDT",
  polkadot: "DOTUSDT",
  dot: "DOTUSDT",
  litecoin: "LTCUSDT",
  ltc: "LTCUSDT",
  tron: "TRXUSDT",
  trx: "TRXUSDT",
  shib: "SHIBUSDT",
  "shiba-inu": "SHIBUSDT",
};

/** OKX-style bar → Binance interval (Binance uses lowercase h/d; 1M = monthly). */
const BAR_TO_INTERVAL = {
  "1m": "1m",
  "3m": "3m",
  "5m": "5m",
  "15m": "15m",
  "30m": "30m",
  "1h": "1h",
  "1H": "1h",
  "2h": "2h",
  "4h": "4h",
  "4H": "4h",
  "6h": "6h",
  "12h": "12h",
  "1d": "1d",
  "1D": "1d",
  "3d": "3d",
  "1w": "1w",
  "1W": "1w",
  "1M": "1M",
  "1mo": "1M",
};

/**
 * @param {string} [bar]
 * @returns {string}
 */
export function toBinanceInterval(bar) {
  if (bar == null || String(bar).trim() === "") return "1h";
  const k = String(bar).trim();
  if (BAR_TO_INTERVAL[k] !== undefined) return BAR_TO_INTERVAL[k];
  const lower = k.toLowerCase();
  if (BAR_TO_INTERVAL[lower] !== undefined) return BAR_TO_INTERVAL[lower];
  if (lower === "1mo" || lower === "1month") return "1M";
  return lower;
}

/**
 * Map Binance kline row to OKX-shaped row so CryptoAnalysisEngine.normalizeCandleToOHLCV works.
 * @param {unknown[]} k
 * @returns {unknown[] | null}
 */
export function binanceKlineRowToEngineRow(k) {
  if (!Array.isArray(k) || k.length < 8) return null;
  return [k[0], k[1], k[2], k[3], k[4], k[5], k[5], k[7]];
}

/**
 * @param {string} [token]
 * @param {string} [explicitSymbol] - BTCUSDT or BTC-USDT (hyphens stripped)
 * @returns {string}
 */
export function resolveBinanceSymbol(token, explicitSymbol) {
  const ex = explicitSymbol != null ? String(explicitSymbol).trim() : "";
  if (ex) {
    const compact = ex.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (compact.length >= 6 && compact.endsWith("USDT")) return compact;
    if (/^[A-Z0-9]{2,12}$/.test(compact)) return `${compact}USDT`;
  }
  const key = String(token || "bitcoin").trim().toLowerCase();
  if (TOKEN_TO_SYMBOL[key]) return TOKEN_TO_SYMBOL[key];
  if (/^[a-z0-9]{1,15}$/.test(key)) return `${key.toUpperCase()}USDT`;
  return "BTCUSDT";
}

const BINANCE_KLINES_MAX_ATTEMPTS = 4;
const BINANCE_KLINES_BASE_DELAY_MS = 400;

function sleepMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function binanceKlinesRetryableHttp(status, msg) {
  if (status === 418) return false;
  const m = String(msg || "");
  return (
    status === 429 ||
    /too many|rate limit|way too many/i.test(m)
  );
}

function binanceKlinesRetryableBodyMsg(msg) {
  const m = String(msg || "");
  return /-1003|-1015|too many|rate limit|way too many/i.test(m);
}

function isIpBanStatus(status, msg) {
  return status === 418 || /banned|IP ban/i.test(String(msg || ""));
}

/**
 * @param {string} baseUrl
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @param {{ startTime?: number; endTime?: number; signal?: AbortSignal }} opts
 * @returns {Promise<unknown[][]>}
 */
async function fetchBinanceKlinesFromBase(baseUrl, symbol, interval, limit, opts = {}) {
  if (isBinanceRestBlocked(baseUrl)) {
    throw new Error(`Binance klines [418]: REST circuit open on ${baseUrl}`);
  }

  const url = new URL(`${baseUrl.replace(/\/$/, "")}/klines`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));
  if (opts.startTime != null && Number.isFinite(Number(opts.startTime))) {
    url.searchParams.set("startTime", String(Math.floor(Number(opts.startTime))));
  }
  if (opts.endTime != null && Number.isFinite(Number(opts.endTime))) {
    url.searchParams.set("endTime", String(Math.floor(Number(opts.endTime))));
  }

  const urlStr = url.toString();
  const timeoutSignal =
    typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(BINANCE_REST_FETCH_TIMEOUT_MS)
      : undefined;
  let lastError;

  for (let attempt = 0; attempt < BINANCE_KLINES_MAX_ATTEMPTS; attempt++) {
    if (isBinanceRestBlocked(baseUrl)) {
      throw new Error(`Binance klines [418]: REST circuit open on ${baseUrl}`);
    }
    try {
      const res = await btcRateLimitedFetch(urlStr, {
        headers: { Accept: "application/json" },
        ...(opts.signal && { signal: opts.signal }),
        ...(timeoutSignal && !opts.signal ? { signal: timeoutSignal } : {}),
      });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = body?.msg ?? body?.message ?? `HTTP ${res.status}`;
        if (isIpBanStatus(res.status, msg)) {
          recordBinanceIpBan(msg, baseUrl);
          throw new Error(`Binance klines [${res.status}]: ${msg}`);
        }
        if (binanceKlinesRetryableHttp(res.status, msg) && attempt < BINANCE_KLINES_MAX_ATTEMPTS - 1) {
          await sleepMs(BINANCE_KLINES_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 200));
          continue;
        }
        throw new Error(`Binance klines [${res.status}]: ${msg}`);
      }

      if (body && typeof body === "object" && !Array.isArray(body)) {
        if (body.msg) {
          if (isIpBanStatus(200, body.msg)) {
            recordBinanceIpBan(body.msg, baseUrl);
            throw new Error(`Binance klines: ${body.msg}`);
          }
          if (binanceKlinesRetryableBodyMsg(body.msg) && attempt < BINANCE_KLINES_MAX_ATTEMPTS - 1) {
            await sleepMs(BINANCE_KLINES_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 200));
            continue;
          }
          throw new Error(`Binance klines: ${body.msg}`);
        }
        throw new Error(`Binance klines: ${body.code ?? "unexpected JSON object"}`);
      }

      if (!Array.isArray(body)) {
        throw new Error("Binance klines: invalid response");
      }

      return body;
    } catch (e) {
      lastError = e;
      const msg = String(e?.message || e);
      if (isIpBanStatus(418, msg) || /\[418\]/.test(msg) || /REST circuit open/i.test(msg)) {
        recordBinanceIpBan(msg, baseUrl);
        throw e;
      }
      const networkRetry =
        attempt < BINANCE_KLINES_MAX_ATTEMPTS - 1 &&
        /ECONNRESET|ETIMEDOUT|fetch failed|network|socket/i.test(msg);
      if (networkRetry) {
        await sleepMs(BINANCE_KLINES_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 200));
        continue;
      }
      throw e;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError ?? "Binance klines failed"));
}

/**
 * Non-REST fallbacks: WS buffer → stale cache → Coinbase (BTC only).
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @param {{ signal?: AbortSignal }} [opts]
 * @returns {Promise<unknown[][] | null>}
 */
async function resolveKlinesWithoutRest(symbol, interval, limit, opts = {}) {
  const wsBody = await getBinanceKlinesFromWsBuffer(symbol, interval, limit);
  if (wsBody?.length) {
    setCachedBinanceKlineSeries(symbol, interval, wsBody);
    return wsBody.slice(-limit);
  }

  const stale = getStaleBinanceKlineSeries(symbol, interval, limit);
  if (stale?.length) return stale;

  try {
    const coinbase = await fetchBtcKlinesFromCoinbase(symbol, interval, limit, opts);
    if (coinbase?.length) {
      setCachedBinanceKlineSeries(symbol, interval, coinbase);
      return coinbase.slice(-limit);
    }
  } catch {
    /* alternate venue failed */
  }

  return null;
}

/**
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @param {{ startTime?: number; endTime?: number; signal?: AbortSignal }} fetchOpts
 * @returns {Promise<unknown[][]>}
 */
/**
 * Fetches and caches a full series (at least 200 candles). Callers slice to their limit.
 * @param {string} symbol
 * @param {string} interval
 * @param {number} minLimit
 * @param {{ startTime?: number; endTime?: number; signal?: AbortSignal }} fetchOpts
 * @returns {Promise<unknown[][]>}
 */
async function fetchBinanceKlinesSeries(symbol, interval, minLimit, fetchOpts) {
  const fetchLimit = Math.min(1000, Math.max(minLimit, 200));

  let lastError;
  let triedRest = false;
  for (const baseUrl of BINANCE_REST_BASES) {
    if (isBinanceRestBlocked(baseUrl)) continue;
    triedRest = true;
    try {
      const body = await fetchBinanceKlinesFromBase(baseUrl, symbol, interval, fetchLimit, fetchOpts);
      setCachedBinanceKlineSeries(symbol, interval, body);
      return body;
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || err);
      if (isIpBanStatus(418, msg) || /\[418\]/.test(msg) || /REST circuit open/i.test(msg)) {
        recordBinanceIpBan(msg, baseUrl);
        continue;
      }
      if (/\[429\]/.test(msg) || /too many|rate limit/i.test(msg)) {
        continue;
      }
      // Network errors: try next host before giving up.
      if (/ECONNRESET|ETIMEDOUT|fetch failed|network|socket|aborted|timeout/i.test(msg)) {
        continue;
      }
      throw err;
    }
  }

  const fallback = await resolveKlinesWithoutRest(symbol, interval, fetchLimit, fetchOpts);
  if (fallback?.length) return fallback;

  if (!triedRest || isAllBinanceRestBlocked()) {
    throw new Error(
      "Binance klines [418]: IP banned — WS/stale/Coinbase fallbacks unavailable. Retry after ban expires.",
    );
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(String(lastError ?? "Binance klines failed"));
}

/**
 * @param {string} symbol
 * @param {{ interval?: string; bar?: string; limit?: number; startTime?: number; endTime?: number; signal?: AbortSignal }} [opts]
 * @returns {Promise<unknown[][]>}
 */
export async function fetchBinanceKlinesJson(symbol, opts = {}) {
  const interval = toBinanceInterval(opts.interval ?? opts.bar);
  const limit = Math.min(1000, Math.max(1, Number(opts.limit) || 200));
  const startTime = opts.startTime != null ? Number(opts.startTime) : undefined;
  const endTime = opts.endTime != null ? Number(opts.endTime) : undefined;
  const ranged = startTime != null || endTime != null;
  const cacheKey = binanceKlineCacheKey(symbol, interval, limit, startTime, endTime);

  if (!ranged) {
    const seriesHit = getCachedBinanceKlineSeries(symbol, interval, limit);
    if (seriesHit?.length) return seriesHit;
  } else {
    const cached = getCachedBinanceKlines(cacheKey);
    if (cached) return cached;
  }

  const fetchOpts = { startTime, endTime, signal: opts.signal };

  // Ranged queries keep the legacy per-key path (rare for btc2).
  if (ranged) {
    let lastError;
    for (const baseUrl of BINANCE_REST_BASES) {
      if (isBinanceRestBlocked(baseUrl)) continue;
      try {
        const body = await fetchBinanceKlinesFromBase(baseUrl, symbol, interval, limit, fetchOpts);
        setCachedBinanceKlines(cacheKey, body);
        return body;
      } catch (err) {
        lastError = err;
        const msg = String(err?.message || err);
        if (isIpBanStatus(418, msg) || /\[418\]/.test(msg)) {
          recordBinanceIpBan(msg, baseUrl);
          continue;
        }
        if (/\[429\]/.test(msg) || /too many|rate limit/i.test(msg)) continue;
        if (/ECONNRESET|ETIMEDOUT|fetch failed|network|socket|aborted|timeout/i.test(msg)) continue;
        throw err;
      }
    }
    const fallback = await resolveKlinesWithoutRest(symbol, interval, limit, fetchOpts);
    if (fallback?.length) {
      setCachedBinanceKlines(cacheKey, fallback);
      return fallback;
    }
    throw lastError instanceof Error ? lastError : new Error(String(lastError ?? "Binance klines failed"));
  }

  const inflightKey = `${String(symbol).toUpperCase()}|${interval}`;
  const existing = inflightSeriesFetches.get(inflightKey);
  if (existing) {
    const rows = await existing;
    return rows.slice(-limit);
  }

  const task = fetchBinanceKlinesSeries(symbol, interval, limit, fetchOpts);
  inflightSeriesFetches.set(inflightKey, task);
  try {
    const rows = await task;
    return rows.slice(-limit);
  } finally {
    inflightSeriesFetches.delete(inflightKey);
  }
}

/**
 * Close time (ms) of the last fully closed candle in the series (Binance appends an in-progress bar).
 * Used to anchor forward outcome resolution for experiments.
 * @param {unknown[][]} raw
 */
export function lastClosedCandleCloseMs(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  if (raw.length >= 2) {
    const pen = raw[raw.length - 2];
    if (Array.isArray(pen) && pen[6] != null) return Number(pen[6]);
  }
  const last = raw[raw.length - 1];
  if (Array.isArray(last) && last[6] != null) return Number(last[6]);
  return null;
}

/**
 * @param {{ token?: string; instId?: string; bar?: string; limit?: number; signal?: AbortSignal }} params
 * @returns {Promise<{ symbol: string; report: Record<string, unknown>; anchorCloseMs: number | null }>}
 */
export async function buildBinanceSignalReport(params) {
  const symbol = resolveBinanceSymbol(params.token, params.instId);
  const raw = await fetchBinanceKlinesJson(symbol, {
    bar: params.bar,
    limit: params.limit,
    signal: params.signal,
  });
  const anchorCloseMs = lastClosedCandleCloseMs(raw);
  const data = raw.map(binanceKlineRowToEngineRow).filter(Boolean);
  const engine = new CryptoAnalysisEngine({ data }, symbol, "BINANCE_SPOT");
  const report = engine.analyze();
  return { symbol, report, anchorCloseMs };
}
