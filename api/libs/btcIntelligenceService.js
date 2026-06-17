/**
 * BTC intelligence aggregation — Binance taker ratio bubblemap + multi-source overview.
 * Falls back to CoinGecko when Binance/Coinbase direct APIs are unreachable.
 */
import { fetchBinanceSpotPublic } from "./binanceSpotClient.js";
import { coingeckoDataApiHeaders, getCoingeckoDataApiBaseUrl } from "../utils/coingeckoAPI.js";
import {
  BTC_SNAPSHOT_KEYS,
  btcBubblemapSnapshotKey,
  readBtcSnapshot,
  readBtcSnapshotPayload,
} from "./btcIntelligenceStore.js";
import { btcRateLimitedFetch } from "./btcProviderRateLimiter.js";

const COINGECKO_CACHE_TTL_MS = 45_000;
const BINANCE_FUTURES_BASE = "https://fapi.binance.com/fapi/v1";
const COINBASE_CANDLES_URL = "https://api.exchange.coinbase.com/products/BTC-USD/candles";
const COINBASE_TICKER_URL = "https://api.exchange.coinbase.com/products/BTC-USD/ticker";
const FEAR_GREED_URL = "https://api.alternative.me/fng/?limit=1";

export const BTC_VALID_INTERVALS = ["1m", "5m", "15m", "1h", "4h", "1d"];
const VALID_INTERVALS = new Set(BTC_VALID_INTERVALS);

export const BTC_BUBBLEMAP_PRESETS = (() => {
  const presets = [];
  for (const exchange of ["binance", "coinbase"]) {
    for (const interval of BTC_VALID_INTERVALS) {
      presets.push({ exchange, interval, limit: 200 });
    }
  }
  return presets;
})();
const COINBASE_GRANULARITY = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "1h": 3600,
  "4h": 21600,
  "1d": 86400,
};

/** CoinGecko OHLC granularity is coarse — map UI intervals to `days` param. */
const INTERVAL_TO_COINGECKO_DAYS = {
  "1m": 1,
  "5m": 1,
  "15m": 1,
  "1h": 7,
  "4h": 7,
  "1d": 30,
};

/** @type {Map<string, { data: unknown; expiresAt: number }>} */
const cache = new Map();

/**
 * @template T
 * @param {string} key
 * @param {number} ttlMs
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
async function withCache(key, ttlMs, fn) {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && now < hit.expiresAt) return /** @type {T} */ (hit.data);
  const data = await fn();
  cache.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T | null>}
 */
async function safeExec(fn) {
  try {
    return await fn();
  } catch {
    return null;
  }
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @param {number[]} values
 * @returns {number[]}
 */
function percentileRanks(values) {
  const n = values.length;
  if (n === 0) return [];
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array(n).fill(0);
  let i = 0;
  while (i < n) {
    let j = i;
    while (j + 1 < n && indexed[j + 1].v === indexed[i].v) j += 1;
    const rank = (i + j) / 2;
    const percentile = n <= 1 ? 100 : (rank / (n - 1)) * 100;
    for (let k = i; k <= j; k += 1) {
      ranks[indexed[k].i] = percentile;
    }
    i = j + 1;
  }
  return ranks;
}

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
function toPositiveNumber(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * @param {unknown} raw
 * @returns {number | null}
 */
function toNumber(raw) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {string} url
 * @param {RequestInit} [init]
 */
async function fetchJson(url, init = {}) {
  const response = await btcRateLimitedFetch(url, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  return response.json();
}

function coingeckoHeaders() {
  return coingeckoDataApiHeaders();
}

function coingeckoBase() {
  return getCoingeckoDataApiBaseUrl();
}

/**
 * @param {Array<{
 *   time: number;
 *   price: number;
 *   ratio: number;
 *   takerBuyVolume: number;
 *   takerSellVolume: number;
 * }>} points
 */
function attachExtremePercentiles(points) {
  const deviations = points.map((p) => Math.abs(p.ratio - 1));
  const percentiles = percentileRanks(deviations);
  return points.map((p, idx) => ({
    ...p,
    extremePercentile: percentiles[idx] ?? 0,
  }));
}

/**
 * Buy-pressure proxy from OHLC candle.
 * @param {number} low
 * @param {number} high
 * @param {number} close
 */
function proxyRatioFromOhlc(low, high, close) {
  const buyLeg = Math.max(close - low, 0);
  const sellLeg = Math.max(high - close, 0);
  if (sellLeg > 0) return buyLeg / sellLeg;
  if (buyLeg > 0) return 10;
  return 1;
}

/**
 * @param {unknown} rows
 * @returns {Array<{
 *   time: number;
 *   price: number;
 *   ratio: number;
 *   takerBuyVolume: number;
 *   takerSellVolume: number;
 * }>}
 */
function parseBinanceKlines(rows) {
  if (!Array.isArray(rows)) return [];
  const points = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 10) continue;
    const time = toNumber(row[0]);
    const close = toNumber(row[4]);
    const totalVol = toPositiveNumber(row[5]);
    const takerBuy = toPositiveNumber(row[9]);
    if (time == null || close == null || totalVol == null || takerBuy == null) continue;
    const takerSell = Math.max(totalVol - takerBuy, 0);
    let ratio = 1;
    if (takerSell > 0) {
      ratio = takerBuy / takerSell;
    } else if (takerBuy > 0) {
      ratio = 10;
    }
    points.push({
      time,
      price: close,
      ratio,
      takerBuyVolume: takerBuy,
      takerSellVolume: takerSell,
    });
  }
  points.sort((a, b) => a.time - b.time);
  return points;
}

/**
 * Coinbase candles: [time, low, high, open, close, volume] newest first.
 * @param {unknown} rows
 */
function parseCoinbaseCandles(rows) {
  if (!Array.isArray(rows)) return [];
  const points = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 6) continue;
    const time = toNumber(row[0]);
    const low = toNumber(row[1]);
    const high = toNumber(row[2]);
    const close = toNumber(row[4]);
    const volume = toPositiveNumber(row[5]);
    if (time == null || low == null || high == null || close == null) continue;
    const ratio = proxyRatioFromOhlc(low, high, close);
    const range = Math.max(high - low, 1e-9);
    const buyLeg = Math.max(close - low, 0);
    const sellLeg = Math.max(high - close, 0);
    points.push({
      time: time * 1000,
      price: close,
      ratio,
      takerBuyVolume: volume != null ? volume * (buyLeg / range) : 0,
      takerSellVolume: volume != null ? volume * (sellLeg / range) : 0,
    });
  }
  points.sort((a, b) => a.time - b.time);
  return points;
}

/**
 * CoinGecko OHLC: [timestamp, open, high, low, close]
 * @param {unknown} rows
 */
function parseCoingeckoOhlc(rows) {
  if (!Array.isArray(rows)) return [];
  const points = [];
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 5) continue;
    const time = toNumber(row[0]);
    const high = toNumber(row[2]);
    const low = toNumber(row[3]);
    const close = toNumber(row[4]);
    if (time == null || low == null || high == null || close == null) continue;
    const ratio = proxyRatioFromOhlc(low, high, close);
    points.push({
      time,
      price: close,
      ratio,
      takerBuyVolume: 0,
      takerSellVolume: 0,
    });
  }
  points.sort((a, b) => a.time - b.time);
  return points;
}

async function fetchCoingeckoBitcoinSnapshot() {
  return withCache("coingecko:bitcoin-snapshot", COINGECKO_CACHE_TTL_MS, async () => {
    const base = coingeckoBase();
    const headers = coingeckoHeaders();
    const [coin, global] = await Promise.all([
      fetchJson(
        `${base}/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
        { headers },
      ),
      fetchJson(`${base}/global`, { headers }),
    ]);
    const md = coin?.market_data;
    return {
      price: toNumber(md?.current_price?.usd),
      change24hPct: toNumber(md?.price_change_percentage_24h),
      high24h: toNumber(md?.high_24h?.usd),
      low24h: toNumber(md?.low_24h?.usd),
      volumeUsd24h: toNumber(md?.total_volume?.usd),
      marketCapUsd: toNumber(md?.market_cap?.usd),
      dominancePct: toNumber(global?.data?.market_cap_percentage?.btc),
    };
  });
}

async function fetchCoingeckoExchangePrices() {
  return safeExec(async () => {
    const base = coingeckoBase();
    const headers = coingeckoHeaders();
    const json = await fetchJson(
      `${base}/coins/bitcoin/tickers?exchange_ids=binance,gdax&include_exchange_logo=false&page=1`,
      { headers },
    );
    const tickers = Array.isArray(json?.tickers) ? json.tickers : [];
    let binancePrice = null;
    let coinbasePrice = null;
    for (const t of tickers) {
      const exchangeId = String(t?.market?.identifier || "").toLowerCase();
      const target = String(t?.target || "").toUpperCase();
      const last = toNumber(t?.converted_last?.usd) ?? toNumber(t?.last);
      if (last == null) continue;
      if (exchangeId === "binance" && (target === "USDT" || target === "USD") && binancePrice == null) {
        binancePrice = last;
      }
      if (exchangeId === "gdax" && target === "USD" && coinbasePrice == null) {
        coinbasePrice = last;
      }
    }
    if (binancePrice == null && coinbasePrice == null) return null;
    return { binancePrice, coinbasePrice };
  });
}

async function fetchCoingeckoOhlc(days) {
  const base = coingeckoBase();
  const headers = coingeckoHeaders();
  const rows = await fetchJson(`${base}/coins/bitcoin/ohlc?vs_currency=usd&days=${days}`, { headers });
  return parseCoingeckoOhlc(rows);
}

async function fetchCoingeckoDerivatives() {
  return safeExec(async () => {
    const base = coingeckoBase();
    const headers = coingeckoHeaders();
    const rows = await fetchJson(`${base}/derivatives`, { headers });
    if (!Array.isArray(rows)) return null;
    const btcPerp = rows.find(
      (r) =>
        r &&
        String(r.symbol || "").toUpperCase() === "BTCUSDT" &&
        /binance/i.test(String(r.market || "")) &&
        String(r.contract_type || "").toLowerCase() === "perpetual",
    );
    if (!btcPerp) return null;
    const fundingRate = toNumber(btcPerp.funding_rate);
    const markPrice = toNumber(btcPerp.index) ?? toNumber(btcPerp.price);
    const openInterestUsd = toNumber(btcPerp.open_interest);
    let openInterestBtc = null;
    if (openInterestUsd != null && markPrice != null && markPrice > 0) {
      openInterestBtc = openInterestUsd / markPrice;
    }
    return { fundingRate, markPrice, openInterestBtc };
  });
}

async function fetchBinanceKlines(interval, limit) {
  return safeExec(async () => {
    const rows = await fetchBinanceSpotPublic("klines", {
      symbol: "BTCUSDT",
      interval,
      limit: String(limit),
    });
    return parseBinanceKlines(rows);
  });
}

async function fetchCoinbaseCandles(interval, limit) {
  return safeExec(async () => {
    const granularity = COINBASE_GRANULARITY[interval];
    const rows = await fetchJson(`${COINBASE_CANDLES_URL}?granularity=${granularity}`);
    return parseCoinbaseCandles(rows).slice(-limit);
  });
}

/**
 * Live fetch — used by background scheduler only.
 * @param {{ exchange?: string; interval?: string; limit?: number }} opts
 */
export async function computeBtcBubblemap(opts = {}) {
  const exchange = String(opts.exchange || "binance").toLowerCase();
  const interval = VALID_INTERVALS.has(opts.interval) ? opts.interval : "1h";
  const limit = clamp(Math.floor(Number(opts.limit) || 200), 20, 500);

  let points = [];
  let ratioSource = "taker";

  if (exchange === "coinbase") {
    ratioSource = "proxy";
    points = (await fetchCoinbaseCandles(interval, limit)) ?? [];
  } else {
    points = (await fetchBinanceKlines(interval, limit)) ?? [];
  }

  if (points.length < 2) {
    ratioSource = "proxy";
    const days = INTERVAL_TO_COINGECKO_DAYS[interval] ?? 7;
    const cgPoints = await safeExec(() => fetchCoingeckoOhlc(days));
    points = (cgPoints ?? []).slice(-limit);
  }

  if (points.length < 2) {
    throw new Error("Unable to load BTC candle data from any provider");
  }

  const enriched = attachExtremePercentiles(points);
  return {
    exchange: exchange === "coinbase" ? "coinbase" : "binance",
    interval,
    ratioSource,
    symbol: exchange === "coinbase" ? "BTC-USD" : "BTCUSDT",
    points: enriched,
    computedAt: new Date().toISOString(),
  };
}

/**
 * @param {{ exchange?: string; interval?: string; limit?: number }} opts
 */
export async function getBtcBubblemap(opts = {}) {
  const exchange = String(opts.exchange || "binance").toLowerCase();
  const interval = VALID_INTERVALS.has(opts.interval) ? opts.interval : "1h";
  const limit = clamp(Math.floor(Number(opts.limit) || 200), 20, 500);
  const key = btcBubblemapSnapshotKey(exchange, interval, limit);
  const payload = await readBtcSnapshotPayload(key);
  if (payload) return payload;
  return null;
}

async function fetchBinanceTicker24h() {
  return safeExec(async () => {
    const data = await fetchBinanceSpotPublic("ticker/24hr", { symbol: "BTCUSDT" });
    if (!data || typeof data !== "object") return null;
    const lastPrice = toNumber(data.lastPrice);
    const priceChangePercent = toNumber(data.priceChangePercent);
    const highPrice = toNumber(data.highPrice);
    const lowPrice = toNumber(data.lowPrice);
    const volume = toNumber(data.volume);
    const quoteVolume = toNumber(data.quoteVolume);
    if (lastPrice == null) return null;
    return {
      price: lastPrice,
      change24hPct: priceChangePercent,
      high24h: highPrice,
      low24h: lowPrice,
      volumeBtc: volume,
      volumeUsd: quoteVolume,
    };
  });
}

async function fetchCoinbaseSpotPrice() {
  return safeExec(async () => {
    const data = await fetchJson(COINBASE_TICKER_URL);
    const price = toNumber(data?.price);
    if (price == null) return null;
    return { price };
  });
}

async function fetchBinanceFuturesMetrics() {
  return safeExec(async () => {
    const [premiumRes, oiRes] = await Promise.all([
      btcRateLimitedFetch(`${BINANCE_FUTURES_BASE}/premiumIndex?symbol=BTCUSDT`),
      btcRateLimitedFetch(`${BINANCE_FUTURES_BASE}/openInterest?symbol=BTCUSDT`),
    ]);
    if (!premiumRes.ok) return null;
    const premium = await premiumRes.json();
    const fundingRate = toNumber(premium?.lastFundingRate);
    const markPrice = toNumber(premium?.indexPrice) ?? toNumber(premium?.markPrice);
    let openInterestBtc = null;
    if (oiRes.ok) {
      const oi = await oiRes.json();
      openInterestBtc = toNumber(oi?.openInterest);
    }
    return { fundingRate, markPrice, openInterestBtc };
  });
}

async function fetchFearGreed() {
  return safeExec(async () => {
    const json = await fetchJson(FEAR_GREED_URL);
    const row = Array.isArray(json?.data) ? json.data[0] : null;
    if (!row) return null;
    const value = toNumber(row.value);
    const classification = typeof row.value_classification === "string" ? row.value_classification : null;
    if (value == null) return null;
    return { value, classification };
  });
}

/** Live fetch — used by background scheduler only. */
export async function computeBtcOverview() {
  const [tickerR, coinbaseR, coingeckoR, futuresR, fearGreedR, cgExchangeR] = await Promise.allSettled([
    fetchBinanceTicker24h(),
    fetchCoinbaseSpotPrice(),
    fetchCoingeckoBitcoinSnapshot(),
    fetchBinanceFuturesMetrics(),
    fetchFearGreed(),
    fetchCoingeckoExchangePrices(),
  ]);

  const ticker = tickerR.status === "fulfilled" ? tickerR.value : null;
  const coinbase = coinbaseR.status === "fulfilled" ? coinbaseR.value : null;
  const coingecko = coingeckoR.status === "fulfilled" ? coingeckoR.value : null;
  const futures = futuresR.status === "fulfilled" ? futuresR.value : null;
  const fearGreed = fearGreedR.status === "fulfilled" ? fearGreedR.value : null;
  const cgExchange = cgExchangeR.status === "fulfilled" ? cgExchangeR.value : null;

  let derivatives = futures;
  if (!derivatives?.fundingRate && !derivatives?.openInterestBtc) {
    const cgDeriv = await fetchCoingeckoDerivatives();
    if (cgDeriv) derivatives = cgDeriv;
  }

  const binancePrice = ticker?.price ?? cgExchange?.binancePrice ?? coingecko?.price ?? null;
  const coinbasePrice = coinbase?.price ?? cgExchange?.coinbasePrice ?? null;

  let premiumPct = null;
  if (binancePrice != null && coinbasePrice != null && binancePrice > 0) {
    premiumPct = ((coinbasePrice - binancePrice) / binancePrice) * 100;
  }

  return {
    price: {
      usd: binancePrice ?? coingecko?.price ?? null,
      change24hPct: ticker?.change24hPct ?? coingecko?.change24hPct ?? null,
      high24h: ticker?.high24h ?? coingecko?.high24h ?? null,
      low24h: ticker?.low24h ?? coingecko?.low24h ?? null,
      volumeBtc24h: ticker?.volumeBtc ?? null,
      volumeUsd24h: ticker?.volumeUsd ?? coingecko?.volumeUsd24h ?? null,
    },
    exchanges: {
      binance: { priceUsd: binancePrice },
      coinbase: { priceUsd: coinbasePrice },
      coinbasePremiumPct: premiumPct,
    },
    market: {
      marketCapUsd: coingecko?.marketCapUsd ?? null,
      dominancePct: coingecko?.dominancePct ?? null,
    },
    derivatives: {
      fundingRate: derivatives?.fundingRate ?? null,
      markPrice: derivatives?.markPrice ?? null,
      openInterestBtc: derivatives?.openInterestBtc ?? null,
    },
    sentiment: {
      fearGreedIndex: fearGreed?.value ?? null,
      fearGreedLabel: fearGreed?.classification ?? null,
    },
    computedAt: new Date().toISOString(),
  };
}

export async function getBtcOverview() {
  const payload = await readBtcSnapshotPayload(BTC_SNAPSHOT_KEYS.overview);
  if (payload) return payload;
  return null;
}

/**
 * @param {string} key
 */
export async function getBtcSnapshotMeta(key) {
  const snap = await readBtcSnapshot(key);
  if (!snap) return null;
  return {
    computedAt: snap.computedAt.toISOString(),
    ageMs: Date.now() - snap.computedAt.getTime(),
    refreshDurationMs: snap.refreshDurationMs,
    lastError: snap.lastError,
    source: "db",
  };
}
