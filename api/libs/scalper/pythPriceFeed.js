/**
 * Pyth onchain-derived BTC price feed — Hermes (spot) + Benchmarks (OHLCV).
 * No API key required.
 */
import { PYTH_BTC_USD_FEED_ID } from "../../config/scalperConfig.js";

const HERMES_BASE = process.env.PYTH_HERMES_URL || "https://hermes.pyth.network";
const BENCHMARKS_BASE = process.env.PYTH_BENCHMARKS_URL || "https://benchmarks.pyth.network";

const SPOT_CACHE_TTL_MS = 5_000;
const BARS_CACHE_TTL_MS = 30_000;

/** @type {{ expires: number; priceUsd: number; publishTime: number | null } | null} */
let spotCache = null;
/** @type {Map<string, { expires: number; bars: number[][] }>} */
const barsCache = new Map();

/**
 * @param {{ price: string; expo: number }} parsed
 * @returns {number | null}
 */
function pythPriceToUsd(parsed) {
  if (!parsed || parsed.price == null || parsed.expo == null) return null;
  const px = Number(parsed.price) * 10 ** Number(parsed.expo);
  return Number.isFinite(px) && px > 0 ? px : null;
}

/**
 * @returns {Promise<{ priceUsd: number; source: string; publishTime: number | null } | null>}
 */
export async function fetchPythBtcSpotUsd() {
  if (spotCache && Date.now() < spotCache.expires) {
    return {
      priceUsd: spotCache.priceUsd,
      source: "pyth_hermes",
      publishTime: spotCache.publishTime,
    };
  }

  const url = `${HERMES_BASE}/v2/updates/price/latest?ids[]=${encodeURIComponent(PYTH_BTC_USD_FEED_ID)}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const parsed = json?.parsed?.[0]?.price ?? json?.parsed?.[0];
    const priceUsd = pythPriceToUsd(parsed);
    if (!(priceUsd > 0)) return null;

    const publishTime =
      typeof parsed?.publish_time === "number"
        ? parsed.publish_time
        : typeof parsed?.publishTime === "number"
          ? parsed.publishTime
          : null;

    spotCache = { expires: Date.now() + SPOT_CACHE_TTL_MS, priceUsd, publishTime };
    return { priceUsd, source: "pyth_hermes", publishTime };
  } catch (e) {
    console.warn("[pythPriceFeed] Hermes spot fetch failed:", e?.message || e);
    return null;
  }
}

/**
 * @param {string} resolution - TradingView resolution: 1, 5, 15, 60, etc.
 * @param {number} [barCount]
 * @returns {Promise<number[][]>} rows [tsMs, o, h, l, c, v]
 */
export async function fetchPythBtcOhlcvBars(resolution = "5", barCount = 30) {
  const cacheKey = `${resolution}:${barCount}`;
  const cached = barsCache.get(cacheKey);
  if (cached && Date.now() < cached.expires) return cached.bars;

  const resMin = Number(resolution) || 5;
  const toSec = Math.floor(Date.now() / 1000);
  const fromSec = toSec - resMin * 60 * (barCount + 5);

  const url = new URL(`${BENCHMARKS_BASE}/v1/shims/tradingview/history`);
  url.searchParams.set("symbol", "Crypto.BTC/USD");
  url.searchParams.set("resolution", String(resolution));
  url.searchParams.set("from", String(fromSec));
  url.searchParams.set("to", String(toSec));

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return cached?.bars ?? [];
    const json = await res.json();
    if (json?.s !== "ok" || !Array.isArray(json.t)) return cached?.bars ?? [];

    /** @type {number[][]} */
    const bars = [];
    for (let i = 0; i < json.t.length; i++) {
      const ts = Number(json.t[i]) * 1000;
      const o = Number(json.o?.[i]);
      const h = Number(json.h?.[i]);
      const l = Number(json.l?.[i]);
      const c = Number(json.c?.[i]);
      const v = Number(json.v?.[i] ?? 0);
      if ([ts, o, h, l, c].every((n) => Number.isFinite(n))) {
        bars.push([ts, o, h, l, c, Number.isFinite(v) ? v : 0]);
      }
    }

    bars.sort((a, b) => a[0] - b[0]);
    barsCache.set(cacheKey, { expires: Date.now() + BARS_CACHE_TTL_MS, bars });
    return bars;
  } catch (e) {
    console.warn("[pythPriceFeed] Benchmarks OHLCV fetch failed:", e?.message || e);
    return cached?.bars ?? [];
  }
}

/**
 * In-memory price ring for equity momentum (sampled each resolve/signal cycle).
 * @type {Map<string, Array<{ ts: number; priceUsd: number }>>}
 */
const equityPriceHistory = new Map();

const EQUITY_HISTORY_MAX = 60;

/**
 * @param {string} symbol
 * @param {number} priceUsd
 */
export function recordEquityPriceSample(symbol, priceUsd) {
  if (!(priceUsd > 0)) return;
  const key = String(symbol || "").toUpperCase();
  const row = equityPriceHistory.get(key) ?? [];
  row.push({ ts: Date.now(), priceUsd });
  while (row.length > EQUITY_HISTORY_MAX) row.shift();
  equityPriceHistory.set(key, row);
}

/**
 * @param {string} symbol
 * @param {number} lookbackMs
 * @returns {{ momentumPct: number; volatilityPct: number; samples: number } | null}
 */
export function computeEquityMomentum(symbol, lookbackMs = 5 * 60_000) {
  const key = String(symbol || "").toUpperCase();
  const rows = equityPriceHistory.get(key);
  if (!rows || rows.length < 3) return null;

  const cutoff = Date.now() - lookbackMs;
  const window = rows.filter((r) => r.ts >= cutoff);
  if (window.length < 3) return null;

  const first = window[0].priceUsd;
  const last = window[window.length - 1].priceUsd;
  if (!(first > 0) || !(last > 0)) return null;

  const momentumPct = ((last / first - 1) * 100);
  const returns = [];
  for (let i = 1; i < window.length; i++) {
    const prev = window[i - 1].priceUsd;
    const cur = window[i].priceUsd;
    if (prev > 0) returns.push((cur / prev - 1) * 100);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / Math.max(1, returns.length - 1);
  const volatilityPct = Math.sqrt(variance);

  return { momentumPct, volatilityPct, samples: window.length };
}

/**
 * @param {number[][]} bars
 * @returns {{ momentumPct: number; volatilityPct: number } | null}
 */
export function computeBtcBarMomentum(bars) {
  if (!Array.isArray(bars) || bars.length < 4) return null;
  const recent = bars.slice(-6);
  const first = recent[0][4];
  const last = recent[recent.length - 1][4];
  if (!(first > 0) || !(last > 0)) return null;

  const momentumPct = (last / first - 1) * 100;
  const returns = [];
  for (let i = 1; i < recent.length; i++) {
    const prev = recent[i - 1][4];
    const cur = recent[i][4];
    if (prev > 0) returns.push((cur / prev - 1) * 100);
  }
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((acc, r) => acc + (r - mean) ** 2, 0) / Math.max(1, returns.length - 1);
  return { momentumPct, volatilityPct: Math.sqrt(variance) };
}
