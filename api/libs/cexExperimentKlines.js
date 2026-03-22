/**
 * Per-venue 1m OHLC for trading experiment TP/SL validation (Binance-shaped rows).
 * Row shape matches Binance: [openTime, o, h, l, c, vol, closeTime].
 */
import { fetchBinanceKlinesJson } from "./binanceSignalAnalysis.js";
import { fetchOkxCandlesJson } from "./okxSignalAnalysis.js";
import { normalizeSignalCexSource } from "./cexSignalAnalysis.js";

const COINBASE_BASE = process.env.COINBASE_EXCHANGE_API_URL || "https://api.exchange.coinbase.com";
const BYBIT_BASE = process.env.BYBIT_API_BASE_URL || "https://api.bybit.com";
const KRAKEN_BASE = process.env.KRAKEN_API_BASE_URL || "https://api.kraken.com";
const BITGET_BASE = process.env.BITGET_API_BASE_URL || "https://api.bitget.com";
const KUCOIN_BASE = process.env.KUCOIN_API_BASE_URL || "https://api.kucoin.com";
const UPBIT_BASE = process.env.UPBIT_API_BASE_URL || "https://api.upbit.com";
const CRYPTOCOM_BASE = process.env.CRYPTOCOM_EXCHANGE_API_URL || "https://api.crypto.com/exchange/v1";

const ONE_M_MS = 60_000;

/**
 * @param {number} openMs
 * @param {string|number} o
 * @param {string|number} h
 * @param {string|number} l
 * @param {string|number} c
 * @param {string|number} [v]
 * @returns {unknown[]}
 */
function binanceShape1m(openMs, o, h, l, c, v = 0) {
  const closeMs = openMs + ONE_M_MS - 1;
  return [openMs, o, h, l, c, v, closeMs];
}

/**
 * @param {unknown[][]} rows
 * @param {number} cursorMs
 * @param {number} limit
 * @returns {unknown[][]}
 */
function filterSortSlice(rows, cursorMs, limit) {
  const m = new Map();
  for (const k of rows) {
    if (!Array.isArray(k) || k.length < 7) continue;
    const t = Number(k[0]);
    if (!Number.isFinite(t) || t < cursorMs) continue;
    m.set(t, k);
  }
  return [...m.values()].sort((a, b) => Number(a[0]) - Number(b[0])).slice(0, limit);
}

/**
 * @param {string} instId
 * @param {number} cursorMs
 * @param {number} limit
 * @returns {Promise<unknown[][]>}
 */
async function okx1mKlines(instId, cursorMs, limit) {
  const merged = [];
  /** @type {string|number|undefined} */
  let after = undefined;
  for (let p = 0; p < 45 && merged.length < limit + 400; p++) {
    const body = await fetchOkxCandlesJson(instId, { bar: "1m", limit: 300, after });
    const data = body.data;
    if (!Array.isArray(data) || data.length === 0) break;
    for (const row of data) {
      if (!Array.isArray(row) || row.length < 5) continue;
      const open = Number(row[0]);
      if (!Number.isFinite(open)) continue;
      merged.push(binanceShape1m(open, row[1], row[2], row[3], row[4], row[5]));
    }
    const opens = data.map((r) => Number(r[0])).filter(Number.isFinite);
    const oldest = Math.min(...opens);
    if (oldest <= cursorMs) break;
    after = oldest - 1;
  }
  return filterSortSlice(merged, cursorMs, limit);
}

/**
 * @param {string} cex
 * @param {string} instrument
 * @param {number} startTimeMs
 * @param {number} limit
 * @returns {Promise<unknown[][]>}
 */
export async function fetchExperimentValidation1mKlines(cex, instrument, startTimeMs, limit) {
  const key = normalizeSignalCexSource(cex);
  if (!key) throw new Error(`Unknown CEX: ${cex}`);
  const inst = String(instrument || "").trim();
  if (!inst) throw new Error("Missing instrument for experiment klines");

  const lim = Math.min(1000, Math.max(1, limit));
  const now = Date.now();

  switch (key) {
    case "binance":
      return fetchBinanceKlinesJson(inst, { bar: "1m", startTime: startTimeMs, limit: lim });
    case "okx":
      return okx1mKlines(inst, startTimeMs, lim);
    case "coinbase": {
      const start = Math.floor(startTimeMs / 1000);
      const end = Math.floor(now / 1000);
      const url = new URL(`${COINBASE_BASE}/products/${encodeURIComponent(inst)}/candles`);
      url.searchParams.set("granularity", "60");
      url.searchParams.set("start", String(start));
      url.searchParams.set("end", String(end));
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      const body = await res.json().catch(() => null);
      if (!res.ok || !Array.isArray(body)) {
        throw new Error(`Coinbase 1m: ${body?.message || res.statusText}`);
      }
      const rows = body.map((c) => {
        const tSec = Number(c[0]);
        const openMs = tSec * 1000;
        return binanceShape1m(openMs, c[3], c[2], c[1], c[4], c[5] ?? 0);
      });
      return filterSortSlice(rows, startTimeMs, lim);
    }
    case "bybit": {
      const url = new URL(`${BYBIT_BASE}/v5/market/kline`);
      url.searchParams.set("category", "spot");
      url.searchParams.set("symbol", inst);
      url.searchParams.set("interval", "1");
      url.searchParams.set("start", String(startTimeMs));
      url.searchParams.set("end", String(now));
      url.searchParams.set("limit", String(Math.min(1000, lim + 50)));
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || Number(j.retCode) !== 0 || !j.result?.list) {
        throw new Error(`Bybit 1m: ${j?.retMsg || res.statusText}`);
      }
      const rows = j.result.list.map((p) => {
        const a = typeof p === "string" ? p.split(",") : p;
        if (!a || a.length < 6) return null;
        const openMs = Number(a[0]);
        return binanceShape1m(openMs, a[1], a[2], a[3], a[4], a[5]);
      }).filter(Boolean);
      return filterSortSlice(rows, startTimeMs, lim);
    }
    case "kraken": {
      const url = new URL(`${KRAKEN_BASE}/0/public/OHLC`);
      url.searchParams.set("pair", inst);
      url.searchParams.set("interval", "1");
      url.searchParams.set("since", String(Math.floor(startTimeMs / 1000)));
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      const j = await res.json().catch(() => ({}));
      if (j.error?.length) throw new Error(`Kraken 1m: ${j.error.join(", ")}`);
      const result = j.result;
      if (!result || typeof result !== "object") throw new Error("Kraken 1m: bad response");
      const keys = Object.keys(result).filter((k) => k !== "last");
      if (!keys.length) return [];
      const raw = result[keys[0]];
      if (!Array.isArray(raw)) return [];
      const rows = raw.map((c) => {
        const t = Number(c[0]);
        const openMs = t < 1e12 ? t * 1000 : t;
        return binanceShape1m(openMs, c[1], c[2], c[3], c[4], c[6] ?? 0);
      });
      return filterSortSlice(rows, startTimeMs, lim);
    }
    case "bitget": {
      const url = new URL(`${BITGET_BASE}/api/v2/spot/market/candles`);
      url.searchParams.set("symbol", inst);
      url.searchParams.set("granularity", "1min");
      url.searchParams.set("limit", String(Math.min(1000, lim + 50)));
      url.searchParams.set("startTime", String(startTimeMs));
      url.searchParams.set("endTime", String(now));
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || String(j.code) !== "00000" || !Array.isArray(j.data)) {
        throw new Error(`Bitget 1m: ${j?.msg || j.code || res.statusText}`);
      }
      const rows = j.data.map((r) => {
        if (!Array.isArray(r) || r.length < 6) return null;
        const openMs = Number(r[0]);
        return binanceShape1m(openMs, r[1], r[2], r[3], r[4], r[5]);
      }).filter(Boolean);
      return filterSortSlice(rows, startTimeMs, lim);
    }
    case "kucoin": {
      const url = new URL(`${KUCOIN_BASE}/api/v1/market/candles`);
      url.searchParams.set("symbol", inst);
      url.searchParams.set("type", "1min");
      url.searchParams.set("startAt", String(Math.floor(startTimeMs / 1000)));
      url.searchParams.set("endAt", String(Math.floor(now / 1000)));
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || String(j.code) !== "200000" || !Array.isArray(j.data)) {
        throw new Error(`KuCoin 1m: ${j?.msg || j.code || res.statusText}`);
      }
      const rows = j.data.map((r) => {
        if (!Array.isArray(r) || r.length < 7) return null;
        const t = Number(r[0]);
        const openMs = t < 1e12 ? t * 1000 : t;
        const open = r[1];
        const close = r[2];
        const high = r[3];
        const low = r[4];
        const vol = r[5];
        return binanceShape1m(openMs, open, high, low, close, vol);
      }).filter(Boolean);
      return filterSortSlice(rows, startTimeMs, lim);
    }
    case "upbit": {
      const collected = [];
      let to = now;
      for (let i = 0; i < 40 && collected.length < lim + 250; i++) {
        const url = new URL(`${UPBIT_BASE}/v1/candles/minutes/1`);
        url.searchParams.set("market", inst);
        url.searchParams.set("count", "200");
        url.searchParams.set("to", String(to));
        const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
        const body = await res.json().catch(() => null);
        if (!res.ok || !Array.isArray(body) || body.length === 0) break;
        for (const o of body) {
          const ts = Number(o.timestamp);
          if (!Number.isFinite(ts)) continue;
          collected.push(
            binanceShape1m(
              ts,
              o.opening_price,
              o.high_price,
              o.low_price,
              o.trade_price,
              o.candle_acc_trade_volume ?? 0,
            ),
          );
        }
        const minTs = Math.min(...body.map((x) => Number(x.timestamp)));
        if (minTs <= startTimeMs) break;
        to = minTs - 1;
      }
      return filterSortSlice(collected, startTimeMs, lim);
    }
    case "cryptocom": {
      const url = new URL(`${CRYPTOCOM_BASE}/public/get-candlestick`);
      url.searchParams.set("instrument_name", inst);
      url.searchParams.set("timeframe", "1m");
      url.searchParams.set("count", String(Math.min(500, lim + 100)));
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || Number(j.code) !== 0 || !j.result?.data) {
        throw new Error(`Crypto.com 1m: ${j.message || j.code || res.statusText}`);
      }
      const rows = j.result.data.map((x) => {
        const t = Number(x.t);
        const openMs = t < 1e12 ? t * 1000 : t;
        return binanceShape1m(openMs, x.o, x.h, x.l, x.c, x.v ?? 0);
      });
      return filterSortSlice(rows, startTimeMs, lim);
    }
    default:
      throw new Error(`CEX 1m not implemented: ${key}`);
  }
}
