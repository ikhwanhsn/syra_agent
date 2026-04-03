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

const BINANCE_API = process.env.BINANCE_API_BASE_URL || "https://api.binance.com/api/v3";

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
  "8h": "8h",
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

/**
 * @param {string} symbol
 * @param {{ interval?: string; bar?: string; limit?: number; startTime?: number; endTime?: number; signal?: AbortSignal }} [opts]
 * @returns {Promise<unknown[][]>}
 */
export async function fetchBinanceKlinesJson(symbol, opts = {}) {
  const interval = toBinanceInterval(opts.interval ?? opts.bar);
  const limit = Math.min(1000, Math.max(1, Number(opts.limit) || 200));
  const url = new URL(`${BINANCE_API}/klines`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));
  if (opts.startTime != null && Number.isFinite(Number(opts.startTime))) {
    url.searchParams.set("startTime", String(Math.floor(Number(opts.startTime))));
  }
  if (opts.endTime != null && Number.isFinite(Number(opts.endTime))) {
    url.searchParams.set("endTime", String(Math.floor(Number(opts.endTime))));
  }

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    ...(opts.signal && { signal: opts.signal }),
  });
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = body?.msg ?? body?.message ?? `HTTP ${res.status}`;
    throw new Error(`Binance klines: ${msg}`);
  }

  if (body && typeof body === "object" && !Array.isArray(body)) {
    if (body.msg) throw new Error(`Binance klines: ${body.msg}`);
    throw new Error(`Binance klines: ${body.code ?? "unexpected JSON object"}`);
  }

  if (!Array.isArray(body)) {
    throw new Error("Binance klines: invalid response");
  }

  return body;
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
