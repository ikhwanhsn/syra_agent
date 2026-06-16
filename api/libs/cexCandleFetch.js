/**
 * Fetch raw OHLCV rows from CEX sources (excluding binance/okx — see candleSource.js).
 * Rows use engine format: [tsMs, open, high, low, close, volume, ...]
 */
import {
  normalizeSignalCexSource,
  resolveCoinbaseProduct,
  resolveBybitSymbol,
  resolveKrakenPair,
  resolveKucoinSymbol,
  resolveUpbitMarket,
  resolveCryptocomInstrument,
} from "./cexSignalAnalysis.js";
import { resolveCoingeckoCoinId } from "./coingeckoSignalAnalysis.js";
import {
  getCoingeckoDataApiBaseUrl,
  coingeckoDataApiHeaders,
} from "../utils/coingeckoAPI.js";

export { normalizeSignalCexSource, SIGNAL_CEX_SOURCES } from "./cexSignalAnalysis.js";

function clampLimit(n, min, max, fallback) {
  const v = Number.isFinite(n) ? n : fallback;
  return Math.min(max, Math.max(min, v));
}

function pickTokenMapKey(token) {
  return String(token || "bitcoin").trim().toLowerCase();
}

const COINBASE_BASE = process.env.COINBASE_EXCHANGE_API_URL || "https://api.exchange.coinbase.com";
const BYBIT_BASE = process.env.BYBIT_API_BASE_URL || "https://api.bybit.com";
const KRAKEN_BASE = process.env.KRAKEN_API_BASE_URL || "https://api.kraken.com";
const BITGET_BASE = process.env.BITGET_API_BASE_URL || "https://api.bitget.com";
const KUCOIN_BASE = process.env.KUCOIN_API_BASE_URL || "https://api.kucoin.com";
const UPBIT_BASE = process.env.UPBIT_API_BASE_URL || "https://api.upbit.com";
const CRYPTOCOM_BASE = process.env.CRYPTOCOM_EXCHANGE_API_URL || "https://api.crypto.com/exchange/v1";

function barToCoinbaseGranularity(bar) {
  const b = String(bar || "1h").trim().toLowerCase();
  const map = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "6h": 21600, "1d": 86400 };
  return map[b] ?? 3600;
}

function coinbaseRow(c) {
  const t = Number(c[0]);
  const tsMs = t < 1e12 ? t * 1000 : t;
  return [tsMs, c[3], c[2], c[1], c[4], c[5] ?? 0, c[5] ?? 0, parseFloat(String(c[5])) * parseFloat(String(c[4]))];
}

function barToBybitInterval(bar) {
  const lower = String(bar || "1h").trim().toLowerCase();
  const map = { "1m": "1", "3m": "3", "5m": "5", "15m": "15", "30m": "30", "1h": "60", "2h": "120", "4h": "240", "6h": "360", "12h": "720", "1d": "D", "1w": "W", "1M": "M" };
  return map[lower] ?? "60";
}

function bybitRow(p) {
  const a = typeof p === "string" ? p.split(",") : p;
  if (!a || a.length < 7) return null;
  return [a[0], a[1], a[2], a[3], a[4], a[5], a[5], a[6]];
}

function barToKrakenInterval(bar) {
  const b = String(bar || "1h").trim().toLowerCase();
  const map = { "1m": 1, "5m": 5, "15m": 15, "30m": 30, "1h": 60, "4h": 240, "1d": 1440 };
  return map[b] ?? 60;
}

function krakenRow(c) {
  const t = Number(c[0]);
  const tsMs = t < 1e12 ? t * 1000 : t;
  const vwap = parseFloat(String(c[5]));
  const vol = parseFloat(String(c[6]));
  const close = c[4];
  const quote = Number.isFinite(vwap) && Number.isFinite(vol) ? vwap * vol : vol * parseFloat(String(close));
  return [tsMs, c[1], c[2], c[3], close, vol, vol, quote];
}

function barToBitgetGranularity(bar) {
  const b = String(bar || "1h").trim().toLowerCase();
  const map = { "1m": "1min", "5m": "5min", "15m": "15min", "30m": "30min", "1h": "1h", "4h": "4h", "6h": "6h", "12h": "12h", "1d": "1day", "1w": "1week" };
  return map[b] ?? "1h";
}

function bitgetRow(r) {
  if (!Array.isArray(r) || r.length < 7) return null;
  return [r[0], r[1], r[2], r[3], r[4], r[5], r[5], r[6]];
}

function barToKucoinType(bar) {
  const b = String(bar || "1h").trim().toLowerCase();
  const map = { "1m": "1min", "5m": "5min", "15m": "15min", "30m": "30min", "1h": "1hour", "4h": "4hour", "1d": "1day", "1w": "1week" };
  return map[b] ?? "1hour";
}

function kucoinRow(r) {
  if (!Array.isArray(r) || r.length < 7) return null;
  const t = Number(r[0]);
  const tsMs = t < 1e12 ? t * 1000 : t;
  return [tsMs, r[1], r[3], r[4], r[2], r[5], r[5], r[6]];
}

function barToUpbitPath(bar) {
  const b = String(bar || "1h").trim().toLowerCase();
  if (b === "1d" || b === "1day") return "days";
  if (b === "1w" || b === "1week") return "weeks";
  const map = { "1m": 1, "3m": 3, "5m": 5, "15m": 15, "30m": 30, "60m": 60, "1h": 60 };
  return `minutes/${map[b] ?? 60}`;
}

function upbitRow(o) {
  if (!o || typeof o !== "object") return null;
  return [o.timestamp, o.opening_price, o.high_price, o.low_price, o.trade_price, o.candle_acc_trade_volume, o.candle_acc_trade_volume, o.candle_acc_trade_price];
}

function barToCryptocomTimeframe(bar) {
  const lower = String(bar || "1h").trim().toLowerCase();
  const map = { "1m": "1m", "5m": "5m", "15m": "15m", "30m": "30m", "1h": "1h", "4h": "4h", "12h": "12h", "1d": "1D", "1w": "1W" };
  return map[lower] ?? "1h";
}

function cryptocomRow(x) {
  if (!x || typeof x !== "object") return null;
  const v = parseFloat(String(x.v));
  const c = parseFloat(String(x.c));
  const quote = Number.isFinite(v) && Number.isFinite(c) ? v * c : 0;
  return [x.t, x.o, x.h, x.l, x.c, x.v, x.v, quote];
}

function barToOhlcDays(bar) {
  const b = String(bar || "").trim().toLowerCase();
  if (["1m", "3m", "5m", "15m", "30m", "1h"].includes(b)) return 1;
  if (["2h", "4h"].includes(b)) return 14;
  if (b === "1d") return 90;
  if (["1w", "1mo", "1m"].includes(b)) return 180;
  return 90;
}

/**
 * @param {string} source
 * @param {{ token?: string; instId?: string; bar?: string; limit?: number; signal?: AbortSignal }} params
 * @returns {Promise<{ instrument: string; rows: unknown[][] }>}
 */
export async function fetchCexOhlcvRows(source, params) {
  const s = normalizeSignalCexSource(source);
  if (!s || s === "binance" || s === "okx") {
    throw new Error(`fetchCexOhlcvRows does not handle source: ${source}`);
  }

  if (s === "coinbase") {
    const productId = resolveCoinbaseProduct(params.token, params.instId);
    const gran = barToCoinbaseGranularity(params.bar);
    const url = new URL(`${COINBASE_BASE}/products/${encodeURIComponent(productId)}/candles`);
    url.searchParams.set("granularity", String(gran));
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, ...(params.signal && { signal: params.signal }) });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(`Coinbase candles: ${body?.message || res.statusText}`);
    if (!Array.isArray(body)) throw new Error("Coinbase candles: invalid response");
    return { instrument: productId, rows: body.map(coinbaseRow).filter(Boolean) };
  }

  if (s === "bybit") {
    const symbol = resolveBybitSymbol(params.token, params.instId);
    const interval = barToBybitInterval(params.bar);
    const limit = clampLimit(params.limit, 5, 1000, 200);
    const url = new URL(`${BYBIT_BASE}/v5/market/kline`);
    url.searchParams.set("category", "spot");
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("interval", interval);
    url.searchParams.set("limit", String(limit));
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, ...(params.signal && { signal: params.signal }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || Number(j.retCode) !== 0 || !j.result?.list) {
      throw new Error(`Bybit kline: ${j.retMsg || j.retCode || res.statusText}`);
    }
    return { instrument: symbol, rows: j.result.list.map(bybitRow).filter(Boolean) };
  }

  if (s === "kraken") {
    const pair = resolveKrakenPair(params.token, params.instId);
    const interval = barToKrakenInterval(params.bar);
    const url = new URL(`${KRAKEN_BASE}/0/public/OHLC`);
    url.searchParams.set("pair", pair);
    url.searchParams.set("interval", String(interval));
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, ...(params.signal && { signal: params.signal }) });
    const j = await res.json().catch(() => ({}));
    if (j.error?.length) throw new Error(`Kraken OHLC: ${j.error.join(", ")}`);
    const keys = Object.keys(j.result || {}).filter((k) => k !== "last");
    if (!keys.length) throw new Error("Kraken OHLC: no series");
    const raw = j.result[keys[0]];
    return { instrument: pair, rows: raw.map(krakenRow).filter(Boolean) };
  }

  if (s === "bitget") {
    const symbol = resolveBybitSymbol(params.token, params.instId);
    const gran = barToBitgetGranularity(params.bar);
    const limit = clampLimit(params.limit, 5, 1000, 200);
    const url = new URL(`${BITGET_BASE}/api/v2/spot/market/candles`);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("granularity", gran);
    url.searchParams.set("limit", String(limit));
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, ...(params.signal && { signal: params.signal }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || String(j.code) !== "00000" || !Array.isArray(j.data)) {
      throw new Error(`Bitget candles: ${j.msg || j.code || res.statusText}`);
    }
    return { instrument: symbol, rows: j.data.map(bitgetRow).filter(Boolean) };
  }

  if (s === "kucoin") {
    const symbol = resolveKucoinSymbol(params.token, params.instId);
    const type = barToKucoinType(params.bar);
    const limit = clampLimit(params.limit, 10, 1500, 200);
    const url = new URL(`${KUCOIN_BASE}/api/v1/market/candles`);
    url.searchParams.set("symbol", symbol);
    url.searchParams.set("type", type);
    url.searchParams.set("limit", String(limit));
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, ...(params.signal && { signal: params.signal }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || String(j.code) !== "200000" || !Array.isArray(j.data)) {
      throw new Error(`KuCoin candles: ${j.msg || j.code || res.statusText}`);
    }
    return { instrument: symbol, rows: j.data.map(kucoinRow).filter(Boolean) };
  }

  if (s === "upbit") {
    const market = resolveUpbitMarket(params.token, params.instId);
    const path = barToUpbitPath(params.bar);
    const limit = clampLimit(params.limit, 2, 200, 200);
    const url = new URL(`${UPBIT_BASE}/v1/candles/${path}`);
    url.searchParams.set("market", market);
    url.searchParams.set("count", String(limit));
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, ...(params.signal && { signal: params.signal }) });
    const body = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(body)) throw new Error(`Upbit candles: ${body?.error?.name || res.statusText}`);
    return { instrument: market, rows: body.map(upbitRow).filter(Boolean) };
  }

  if (s === "cryptocom") {
    const instrument_name = resolveCryptocomInstrument(params.token, params.instId);
    const timeframe = barToCryptocomTimeframe(params.bar);
    const count = clampLimit(params.limit, 5, 500, 200);
    const url = new URL(`${CRYPTOCOM_BASE}/public/get-candlestick`);
    url.searchParams.set("instrument_name", instrument_name);
    url.searchParams.set("timeframe", timeframe);
    url.searchParams.set("count", String(count));
    const res = await fetch(url.toString(), { headers: { Accept: "application/json" }, ...(params.signal && { signal: params.signal }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok || Number(j.code) !== 0 || !j.result?.data) {
      throw new Error(`Crypto.com candles: ${j.message || j.code || res.statusText}`);
    }
    return { instrument: instrument_name, rows: j.result.data.map(cryptocomRow).filter(Boolean) };
  }

  if (s === "coingecko") {
    const coinId = await resolveCoingeckoCoinId(params.token, params.instId);
    const days = barToOhlcDays(params.bar);
    const base = getCoingeckoDataApiBaseUrl();
    const url = `${base}/coins/${encodeURIComponent(coinId)}/ohlc?vs_currency=usd&days=${days}`;
    const res = await fetch(url, {
      headers: coingeckoDataApiHeaders(),
      ...(params.signal && { signal: params.signal }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !Array.isArray(body)) {
      throw new Error(`CoinGecko OHLC: ${body?.error || res.statusText}`);
    }
    const rows = body
      .map((row) => {
        if (!Array.isArray(row) || row.length < 5) return null;
        const ts = Number(row[0]);
        return [ts, row[1], row[2], row[3], row[4], 0, 0, 0];
      })
      .filter(Boolean);
    return { instrument: coinId, rows };
  }

  throw new Error(`CEX source not implemented: ${s}`);
}
