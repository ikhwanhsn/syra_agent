/**
 * Unified spot OHLC fetchers + CryptoAnalysisEngine for /signal?source=<exchange>
 *
 * Supported: binance, coinbase, okx, bybit, kraken, bitget, kucoin, upbit, cryptocom
 * Alias: crypto.com → cryptocom
 *
 * Raw OHLC shapes (before normalizing to engine rows):
 * - Binance /api/v3/klines: [openTime, o, h, l, c, vol, closeTime, quoteVol, ...]
 * - Coinbase /products/{id}/candles: [time_sec, low, high, open, close, volume]
 * - OKX /api/v5/market/candles: { data: [[ts,o,h,l,c,vol,volCcy,quoteVol,confirm], ...] }
 * - Bybit v5 /market/kline: { result: { list: [[startMs,o,h,l,c,vol,turnover], ...] } }
 * - Kraken /0/public/OHLC: { result: { "<PAIR>": [[time_sec,o,h,l,c,vwap,vol,count], ...] } }
 * - Bitget v2 /spot/market/candles: { data: [[ts,o,h,l,c,baseVol,quote,quote2], ...] }
 * - KuCoin /market/candles: { data: [[time,open,close,high,low,vol,turnover], ...] } (strings)
 * - Upbit /v1/candles/...: [{ opening_price, high_price, low_price, trade_price, timestamp, ... }]
 * - Crypto.com /public/get-candlestick: { result: { data: [{ t,o,h,l,c,v }, ...] } }
 * - CoinGecko /coins/{id}/ohlc: [[timestamp_ms, open, high, low, close], ...]
 */
import { CryptoAnalysisEngine } from "../scripts/cryptoAnalysisEngine.js";
import { buildBinanceSignalReport } from "./binanceSignalAnalysis.js";
import { buildCoingeckoSignalReport } from "./coingeckoSignalAnalysis.js";
import { buildOkxSignalReport, resolveOkxInstId } from "./okxSignalAnalysis.js";
import { barDurationMsGeneric, lastClosedAnchorFromEngineRows } from "./experimentCandleAnchor.js";

/**
 * @param {Record<string, string>} meta
 * @returns {string}
 */
export function pickCexInstrument(meta) {
  const m = meta || {};
  return String(
    m.symbol ||
      m.instId ||
      m.productId ||
      m.pair ||
      m.market ||
      m.instrument_name ||
      m.coingecko_id ||
      "",
  );
}

/** @type {readonly string[]} */
export const SIGNAL_CEX_SOURCES = Object.freeze([
  "binance",
  "coinbase",
  "coingecko",
  "okx",
  "bybit",
  "kraken",
  "bitget",
  "kucoin",
  "upbit",
  "cryptocom",
]);

const CEX_SET = new Set(SIGNAL_CEX_SOURCES);

/**
 * @param {string|undefined|null} source
 * @returns {string|null}
 */
export function normalizeSignalCexSource(source) {
  const s = String(source ?? "").trim().toLowerCase();
  if (!s) return null;
  if (s === "crypto.com" || s === "crypto_com") return "cryptocom";
  if (CEX_SET.has(s)) return s;
  return null;
}

/**
 * @param {string|undefined|null} source
 * @returns {boolean}
 */
export function isSignalCexSource(source) {
  return normalizeSignalCexSource(source) != null;
}

function clampLimit(n, min, max, fallback) {
  const v = Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, v));
}

function runEngine(rows, instrument, marketTag) {
  const engine = new CryptoAnalysisEngine({ data: rows }, instrument, marketTag);
  return engine.analyze();
}

// --- Shared token maps (USDT spot where available) ---

const TOKEN_BINANCE = {
  bitcoin: "BTCUSDT",
  btc: "BTCUSDT",
  ethereum: "ETHUSDT",
  eth: "ETHUSDT",
  solana: "SOLUSDT",
  sol: "SOLUSDT",
};

const TOKEN_COINBASE = {
  bitcoin: "BTC-USD",
  btc: "BTC-USD",
  ethereum: "ETH-USD",
  eth: "ETH-USD",
  solana: "SOL-USD",
  sol: "SOL-USD",
  tron: "TRX-USD",
  trx: "TRX-USD",
  shib: "SHIB-USD",
  "shiba-inu": "SHIB-USD",
};

const TOKEN_KRAKEN = {
  bitcoin: "XBTUSDT",
  btc: "XBTUSDT",
  ethereum: "ETHUSDT",
  eth: "ETHUSDT",
  solana: "SOLUSDT",
  sol: "SOLUSDT",
  tron: "TRXUSDT",
  trx: "TRXUSDT",
  shib: "SHIBUSDT",
  "shiba-inu": "SHIBUSDT",
};

const TOKEN_KUCOIN = {
  bitcoin: "BTC-USDT",
  btc: "BTC-USDT",
  ethereum: "ETH-USDT",
  eth: "ETH-USDT",
  solana: "SOL-USDT",
  sol: "SOL-USDT",
  tron: "TRX-USDT",
  trx: "TRX-USDT",
  shib: "SHIB-USDT",
  "shiba-inu": "SHIB-USDT",
};

const TOKEN_UPBIT = {
  bitcoin: "KRW-BTC",
  btc: "KRW-BTC",
  ethereum: "KRW-ETH",
  eth: "KRW-ETH",
  solana: "KRW-SOL",
  sol: "KRW-SOL",
  tron: "KRW-TRX",
  trx: "KRW-TRX",
  shib: "KRW-SHIB",
  "shiba-inu": "KRW-SHIB",
};

const TOKEN_CDC = {
  bitcoin: "BTC_USDT",
  btc: "BTC_USDT",
  ethereum: "ETH_USDT",
  eth: "ETH_USDT",
  solana: "SOL_USDT",
  sol: "SOL_USDT",
  tron: "TRX_USDT",
  trx: "TRX_USDT",
  shib: "SHIB_USDT",
  "shiba-inu": "SHIB_USDT",
};

function pickTokenMapKey(token) {
  return String(token || "bitcoin").trim().toLowerCase();
}

// ========== Coinbase: [time_sec, low, high, open, close, volume] ==========

const COINBASE_BASE = process.env.COINBASE_EXCHANGE_API_URL || "https://api.exchange.coinbase.com";

function barToCoinbaseGranularity(bar) {
  const b = String(bar || "1h").trim().toLowerCase();
  const map = {
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "4h": 14400,
    "6h": 21600,
    "1d": 86400,
  };
  if (map[b] != null) return map[b];
  return 3600;
}

function coinbaseRow(c) {
  const t = Number(c[0]);
  const tsMs = t < 1e12 ? t * 1000 : t;
  const low = c[1];
  const high = c[2];
  const open = c[3];
  const close = c[4];
  const vol = c[5] ?? 0;
  return [tsMs, open, high, low, close, vol, vol, parseFloat(String(vol)) * parseFloat(String(close))];
}

export function resolveCoinbaseProduct(token, instId) {
  if (instId && String(instId).trim()) return String(instId).trim().toUpperCase();
  const k = pickTokenMapKey(token);
  if (TOKEN_COINBASE[k]) return TOKEN_COINBASE[k];
  if (/^[a-z]{2,6}$/.test(k)) return `${k.toUpperCase()}-USD`;
  // Reuse OKX slug→base mapping so long slugs (dogecoin, cardano) are not misrouted to BTC.
  const okx = resolveOkxInstId(k, undefined);
  const dash = okx.lastIndexOf("-");
  if (dash === -1) return "BTC-USD";
  const base = okx.slice(0, dash);
  const quote = okx.slice(dash + 1);
  if (quote === "USDT") return `${base}-USD`;
  return okx;
}

async function buildCoinbaseReport(params) {
  const productId = resolveCoinbaseProduct(params.token, params.instId);
  const gran = barToCoinbaseGranularity(params.bar);
  const limit = clampLimit(params.limit, 10, 300, 200);
  const url = new URL(`${COINBASE_BASE}/products/${encodeURIComponent(productId)}/candles`);
  url.searchParams.set("granularity", String(gran));

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Coinbase candles: ${body?.message || res.statusText}`);
  }
  if (!Array.isArray(body)) {
    throw new Error(`Coinbase candles: ${body?.message || "invalid response"}`);
  }
  const rows = body.map(coinbaseRow).filter((r) => r.every((x) => !Number.isNaN(Number(x))));
  const anchorCloseMs = lastClosedAnchorFromEngineRows(rows, barDurationMsGeneric(params.bar));
  return {
    source: "coinbase",
    meta: { productId },
    report: runEngine(rows, productId, "COINBASE_SPOT"),
    anchorCloseMs,
  };
}

// ========== Bybit v5 spot kline: list of [startMs, open, high, low, close, vol, turnover] ==========

const BYBIT_BASE = process.env.BYBIT_API_BASE_URL || "https://api.bybit.com";

function barToBybitInterval(bar) {
  const b = String(bar || "60").trim();
  const lower = b.toLowerCase();
  const map = {
    "1m": "1",
    "3m": "3",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "60": "60",
    "2h": "120",
    "4h": "240",
    "6h": "360",
    "12h": "720",
    "1d": "D",
    "1w": "W",
    "1M": "M",
  };
  return map[b] || map[lower] || "60";
}

export function resolveBybitSymbol(token, instId) {
  if (instId && String(instId).trim()) {
    return String(instId).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  }
  const k = pickTokenMapKey(token);
  return TOKEN_BINANCE[k] || `${k.toUpperCase()}USDT`;
}

function bybitRow(p) {
  const a = typeof p === "string" ? p.split(",") : p;
  if (!a || a.length < 7) return null;
  return [a[0], a[1], a[2], a[3], a[4], a[5], a[5], a[6]];
}

async function buildBybitReport(params) {
  const symbol = resolveBybitSymbol(params.token, params.instId);
  const interval = barToBybitInterval(params.bar);
  const limit = clampLimit(params.limit, 5, 1000, 200);
  const url = new URL(`${BYBIT_BASE}/v5/market/kline`);
  url.searchParams.set("category", "spot");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Bybit kline: ${j?.retMsg || res.statusText}`);
  }
  if (Number(j.retCode) !== 0 || !j.result?.list) {
    throw new Error(`Bybit kline: ${j.retMsg || j.retCode || "bad response"}`);
  }
  const rows = j.result.list.map(bybitRow).filter(Boolean);
  const anchorCloseMs = lastClosedAnchorFromEngineRows(rows, barDurationMsGeneric(params.bar));
  return {
    source: "bybit",
    meta: { symbol },
    report: runEngine(rows, symbol, "BYBIT_SPOT"),
    anchorCloseMs,
  };
}

// ========== Kraken OHLC: [time, o, h, l, c, vwap, volume, count] time in SECONDS ==========

const KRAKEN_BASE = process.env.KRAKEN_API_BASE_URL || "https://api.kraken.com";

function barToKrakenInterval(bar) {
  const b = String(bar || "60").trim().toLowerCase();
  const map = { "1m": 1, "5m": 5, "15m": 15, "30m": 30, "1h": 60, "4h": 240, "1d": 1440 };
  return map[b] || 60;
}

export function resolveKrakenPair(token, instId) {
  if (instId && String(instId).trim()) return String(instId).trim().toUpperCase();
  const k = pickTokenMapKey(token);
  if (TOKEN_KRAKEN[k]) return TOKEN_KRAKEN[k];
  // Never default to XBT for unknown slugs (would report Bitcoin for every alt).
  const okx = resolveOkxInstId(k, undefined);
  return okx.replace(/-/g, "");
}

function krakenRow(c) {
  const t = Number(c[0]);
  const tsMs = t < 1e12 ? t * 1000 : t;
  const open = c[1];
  const high = c[2];
  const low = c[3];
  const close = c[4];
  const vwap = parseFloat(String(c[5]));
  const vol = parseFloat(String(c[6]));
  const quote = Number.isFinite(vwap) && Number.isFinite(vol) ? vwap * vol : vol * parseFloat(String(close));
  return [tsMs, open, high, low, close, vol, vol, quote];
}

async function buildKrakenReport(params) {
  const pair = resolveKrakenPair(params.token, params.instId);
  const interval = barToKrakenInterval(params.bar);
  const url = new URL(`${KRAKEN_BASE}/0/public/OHLC`);
  url.searchParams.set("pair", pair);
  url.searchParams.set("interval", String(interval));

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const j = await res.json().catch(() => ({}));
  if (j.error?.length) {
    throw new Error(`Kraken OHLC: ${j.error.join(", ")}`);
  }
  const result = j.result;
  if (!result || typeof result !== "object") {
    throw new Error("Kraken OHLC: invalid response");
  }
  const keys = Object.keys(result).filter((k) => k !== "last");
  if (!keys.length) throw new Error("Kraken OHLC: no series");
  const raw = result[keys[0]];
  if (!Array.isArray(raw)) throw new Error("Kraken OHLC: bad series");
  const rows = raw.map(krakenRow).filter((r) => r.slice(0, 5).every((x) => !Number.isNaN(Number(x))));
  const anchorCloseMs = lastClosedAnchorFromEngineRows(rows, barDurationMsGeneric(params.bar));
  return {
    source: "kraken",
    meta: { pair },
    report: runEngine(rows, pair, "KRAKEN_SPOT"),
    anchorCloseMs,
  };
}

// ========== Bitget v2: data [[ts,o,h,l,c,baseVol,quote,quote2], ...] ==========

const BITGET_BASE = process.env.BITGET_API_BASE_URL || "https://api.bitget.com";

function barToBitgetGranularity(bar) {
  const b = String(bar || "1h").trim().toLowerCase();
  const map = {
    "1m": "1min",
    "5m": "5min",
    "15m": "15min",
    "30m": "30min",
    "1h": "1h",
    "4h": "4h",
    "6h": "6h",
    "12h": "12h",
    "1d": "1day",
    "1w": "1week",
  };
  return map[b] || "1h";
}

function bitgetRow(r) {
  if (!Array.isArray(r) || r.length < 7) return null;
  return [r[0], r[1], r[2], r[3], r[4], r[5], r[5], r[6]];
}

async function buildBitgetReport(params) {
  const symbol = resolveBybitSymbol(params.token, params.instId);
  const gran = barToBitgetGranularity(params.bar);
  const limit = clampLimit(params.limit, 5, 1000, 200);
  const url = new URL(`${BITGET_BASE}/api/v2/spot/market/candles`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("granularity", gran);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Bitget candles: ${j?.msg || res.statusText}`);
  }
  if (String(j.code) !== "00000" || !Array.isArray(j.data)) {
    throw new Error(`Bitget candles: ${j.msg || j.code || "bad response"}`);
  }
  const rows = j.data.map(bitgetRow).filter(Boolean);
  const anchorCloseMs = lastClosedAnchorFromEngineRows(rows, barDurationMsGeneric(params.bar));
  return {
    source: "bitget",
    meta: { symbol },
    report: runEngine(rows, symbol, "BITGET_SPOT"),
    anchorCloseMs,
  };
}

// ========== KuCoin: data [[time,open,close,high,low,volume,turnover], ...] strings ==========

const KUCOIN_BASE = process.env.KUCOIN_API_BASE_URL || "https://api.kucoin.com";

function barToKucoinType(bar) {
  const b = String(bar || "1h").trim().toLowerCase();
  const map = {
    "1m": "1min",
    "5m": "5min",
    "15m": "15min",
    "30m": "30min",
    "1h": "1hour",
    "4h": "4hour",
    "1d": "1day",
    "1w": "1week",
  };
  return map[b] || "1hour";
}

export function resolveKucoinSymbol(token, instId) {
  if (instId && String(instId).trim()) return String(instId).trim().toUpperCase();
  const k = pickTokenMapKey(token);
  return TOKEN_KUCOIN[k] || `${k.toUpperCase()}-USDT`;
}

function kucoinRow(r) {
  if (!Array.isArray(r) || r.length < 7) return null;
  const t = Number(r[0]);
  const tsMs = t < 1e12 ? t * 1000 : t;
  const open = r[1];
  const close = r[2];
  const high = r[3];
  const low = r[4];
  const vol = r[5];
  const turnover = r[6];
  return [tsMs, open, high, low, close, vol, vol, turnover];
}

async function buildKucoinReport(params) {
  const symbol = resolveKucoinSymbol(params.token, params.instId);
  const type = barToKucoinType(params.bar);
  const limit = clampLimit(params.limit, 10, 1500, 200);
  const url = new URL(`${KUCOIN_BASE}/api/v1/market/candles`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("type", type);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`KuCoin candles: ${j?.msg || res.statusText}`);
  }
  if (String(j.code) !== "200000" || !Array.isArray(j.data)) {
    throw new Error(`KuCoin candles: ${j.msg || j.code || "bad response"}`);
  }
  const rows = j.data.map(kucoinRow).filter(Boolean);
  const anchorCloseMs = lastClosedAnchorFromEngineRows(rows, barDurationMsGeneric(params.bar));
  return {
    source: "kucoin",
    meta: { symbol },
    report: runEngine(rows, symbol, "KUCOIN_SPOT"),
    anchorCloseMs,
  };
}

// ========== Upbit: array of objects ==========

const UPBIT_BASE = process.env.UPBIT_API_BASE_URL || "https://api.upbit.com";

export function resolveUpbitMarket(token, instId) {
  if (instId && String(instId).trim()) return String(instId).trim().toUpperCase();
  const k = pickTokenMapKey(token);
  return TOKEN_UPBIT[k] || `KRW-${k.toUpperCase().slice(0, 10)}`;
}

function barToUpbitPath(bar) {
  const b = String(bar || "1h").trim().toLowerCase();
  if (b === "1d" || b === "1day") return "days";
  if (b === "1w" || b === "1week") return "weeks";
  const map = { "1m": 1, "3m": 3, "5m": 5, "15m": 15, "30m": 30, "60m": 60, "1h": 60 };
  const n = map[b] || 60;
  return `minutes/${n}`;
}

function upbitRow(o) {
  if (!o || typeof o !== "object") return null;
  const ts = Number(o.timestamp);
  const open = o.opening_price;
  const high = o.high_price;
  const low = o.low_price;
  const close = o.trade_price;
  const vol = o.candle_acc_trade_volume;
  const quote = o.candle_acc_trade_price;
  return [ts, open, high, low, close, vol, vol, quote];
}

async function buildUpbitReport(params) {
  const market = resolveUpbitMarket(params.token, params.instId);
  const path = barToUpbitPath(params.bar);
  const limit = clampLimit(params.limit, 2, 200, 200);
  const url = new URL(`${UPBIT_BASE}/v1/candles/${path}`);
  url.searchParams.set("market", market);
  url.searchParams.set("count", String(limit));

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Upbit candles: ${body?.error?.name || res.statusText}`);
  }
  if (!Array.isArray(body)) {
    throw new Error("Upbit candles: invalid response");
  }
  const rows = body.map(upbitRow).filter(Boolean);
  const anchorCloseMs = lastClosedAnchorFromEngineRows(rows, barDurationMsGeneric(params.bar));
  return {
    source: "upbit",
    meta: { market },
    report: runEngine(rows, market, "UPBIT_SPOT"),
    anchorCloseMs,
  };
}

// ========== Crypto.com Exchange v1 ==========

const CRYPTOCOM_BASE = process.env.CRYPTOCOM_EXCHANGE_API_URL || "https://api.crypto.com/exchange/v1";

export function resolveCryptocomInstrument(token, instId) {
  if (instId && String(instId).trim()) return String(instId).trim().toUpperCase();
  const k = pickTokenMapKey(token);
  return TOKEN_CDC[k] || `${k.toUpperCase()}_USDT`;
}

function barToCryptocomTimeframe(bar) {
  const b = String(bar || "1h").trim();
  const lower = b.toLowerCase();
  const map = {
    "1m": "1m",
    "5m": "5m",
    "15m": "15m",
    "30m": "30m",
    "1h": "1h",
    "4h": "4h",
    "12h": "12h",
    "1d": "1D",
    "1w": "1W",
  };
  return map[lower] || map[b] || "1h";
}

function cryptocomRow(x) {
  if (!x || typeof x !== "object") return null;
  const t = Number(x.t);
  const v = parseFloat(String(x.v));
  const c = parseFloat(String(x.c));
  const quote = Number.isFinite(v) && Number.isFinite(c) ? v * c : 0;
  return [t, x.o, x.h, x.l, x.c, x.v, x.v, quote];
}

async function buildCryptocomReport(params) {
  const instrument_name = resolveCryptocomInstrument(params.token, params.instId);
  const timeframe = barToCryptocomTimeframe(params.bar);
  const count = clampLimit(params.limit, 5, 500, 200);
  const url = new URL(`${CRYPTOCOM_BASE}/public/get-candlestick`);
  url.searchParams.set("instrument_name", instrument_name);
  url.searchParams.set("timeframe", timeframe);
  url.searchParams.set("count", String(count));

  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Crypto.com candles: ${res.statusText}`);
  }
  if (Number(j.code) !== 0 || !j.result?.data) {
    throw new Error(`Crypto.com candles: ${j.message || j.code || "bad response"}`);
  }
  const rows = j.result.data.map(cryptocomRow).filter(Boolean);
  const anchorCloseMs = lastClosedAnchorFromEngineRows(rows, barDurationMsGeneric(params.bar));
  return {
    source: "cryptocom",
    meta: { instrument_name },
    report: runEngine(rows, instrument_name, "CRYPTOCOM_SPOT"),
    anchorCloseMs,
  };
}

// ========== Unified entry ==========

/**
 * @param {string} source - normalized: binance, okx, coinbase, ...
 * @param {{ token?: string; instId?: string; bar?: string; limit?: number }} params
 * @returns {Promise<{ source: string; meta: Record<string, string>; report: Record<string, unknown>; anchorCloseMs: number | null; instrument: string }>}
 */
export async function buildCexSignalReport(source, params) {
  const s = normalizeSignalCexSource(source);
  if (!s) throw new Error("Unknown CEX source");

  switch (s) {
    case "binance": {
      const { symbol, report, anchorCloseMs } = await buildBinanceSignalReport(params);
      const meta = { symbol };
      return {
        source: "binance",
        meta,
        report,
        anchorCloseMs,
        instrument: pickCexInstrument(meta),
      };
    }
    case "okx": {
      const { instId, report, anchorCloseMs } = await buildOkxSignalReport(params);
      const meta = { instId };
      return {
        source: "okx",
        meta,
        report,
        anchorCloseMs,
        instrument: pickCexInstrument(meta),
      };
    }
    case "coinbase": {
      const out = await buildCoinbaseReport(params);
      return { ...out, instrument: pickCexInstrument(out.meta) };
    }
    case "coingecko": {
      const out = await buildCoingeckoSignalReport(params);
      return { ...out, instrument: pickCexInstrument(out.meta) };
    }
    case "bybit": {
      const out = await buildBybitReport(params);
      return { ...out, instrument: pickCexInstrument(out.meta) };
    }
    case "kraken": {
      const out = await buildKrakenReport(params);
      return { ...out, instrument: pickCexInstrument(out.meta) };
    }
    case "bitget": {
      const out = await buildBitgetReport(params);
      return { ...out, instrument: pickCexInstrument(out.meta) };
    }
    case "kucoin": {
      const out = await buildKucoinReport(params);
      return { ...out, instrument: pickCexInstrument(out.meta) };
    }
    case "upbit": {
      const out = await buildUpbitReport(params);
      return { ...out, instrument: pickCexInstrument(out.meta) };
    }
    case "cryptocom": {
      const out = await buildCryptocomReport(params);
      return { ...out, instrument: pickCexInstrument(out.meta) };
    }
    default:
      throw new Error(`CEX source not implemented: ${s}`);
  }
}
