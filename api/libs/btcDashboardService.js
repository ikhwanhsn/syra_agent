/**
 * BTC Intelligence Hub — batched dashboard sections for GET /btc/dashboard.
 */
import { fetchBinanceSpotPublic } from "./binanceSpotClient.js";
import { fetchBinanceOhlcBatch } from "./binanceOhlcBatch.js";
import { buildIndicatorResponse } from "./indicators/indicatorEngine.js";
import { loadSignal } from "../routes/signal.js";
import { fetchNewsTickers } from "./internalNewsAgent.js";
import { getArticlesWithinHours } from "./newsAggregator.js";
import {
  classifyArticleSentiments,
  aggregateSentimentStats,
} from "../agents/news-intelligence-agent.js";
import { INTERNAL_NEWS_SENTIMENT_BATCH_SIZE } from "../config/internalNewsConfig.js";
import { coingeckoDataApiHeaders, getCoingeckoDataApiBaseUrl } from "../utils/coingeckoAPI.js";
import { computeBtcOverview } from "./btcIntelligenceService.js";
import { BTC_SNAPSHOT_KEYS, readBtcSnapshotPayload } from "./btcIntelligenceStore.js";
import {
  BTC_CORRELATION_SYMBOLS,
  btcCorrelationPairs,
  computeCorrelationFromOHLC,
} from "./btcCorrelationMatrix.js";
import { btcRateLimitedFetch } from "./btcProviderRateLimiter.js";

/** Approximate next Bitcoin halving (block 840,000). */
const NEXT_HALVING_AT = new Date("2028-04-20T00:00:00.000Z");

const BINANCE_FUTURES_BASE = "https://fapi.binance.com/fapi/v1";
const BINANCE_FUTURES_DATA = "https://fapi.binance.com/futures/data";
const FEAR_GREED_HISTORY_URL = "https://api.alternative.me/fng/?limit=30";
const COINBASE_BOOK_URL = "https://api.exchange.coinbase.com/products/BTC-USD/book";
const COINBASE_CANDLES_URL = "https://api.exchange.coinbase.com/products/BTC-USD/candles";

const INDICATOR_SOURCES = [
  { source: "binance", symbol: "BTCUSDT" },
  { source: "coinbase", symbol: "BTC-USD" },
  { source: "coingecko", symbol: "bitcoin" },
];

const COINGECKO_CORRELATION_COINS = [
  { id: "bitcoin", symbol: "BTCUSDT" },
  { id: "ethereum", symbol: "ETHUSDT" },
  { id: "binancecoin", symbol: "BNBUSDT" },
  { id: "solana", symbol: "SOLUSDT" },
  { id: "ripple", symbol: "XRPUSDT" },
  { id: "cardano", symbol: "ADAUSDT" },
  { id: "avalanche-2", symbol: "AVAXUSDT" },
  { id: "dogecoin", symbol: "DOGEUSDT" },
  { id: "chainlink", symbol: "LINKUSDT" },
];

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T | null>}
 */
async function safeExec(fn) {
  try {
    return await fn();
  } catch (err) {
    console.warn("[btc-dashboard]", err instanceof Error ? err.message : err);
    return null;
  }
}

function toNumber(raw) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

async function fetchJson(url, init = {}) {
  const response = await btcRateLimitedFetch(url, init);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

function cgHeaders() {
  return coingeckoDataApiHeaders();
}

function cgBase() {
  return getCoingeckoDataApiBaseUrl();
}

function pctChange(from, to) {
  if (from == null || to == null || from === 0) return null;
  return ((to - from) / from) * 100;
}

function findPriceAtOrBefore(prices, targetMs) {
  if (!Array.isArray(prices) || prices.length === 0) return null;
  let best = null;
  for (const [ts, price] of prices) {
    if (ts <= targetMs) best = price;
    else break;
  }
  return best ?? prices[0]?.[1] ?? null;
}

function proxyBuyPctFromOhlc(low, high, close) {
  if (low == null || high == null || close == null || high <= low) return 50;
  return ((close - low) / (high - low)) * 100;
}

function mapTechnicalsFromIndicators(data) {
  const ind = data.indicators ?? {};
  const macdLatest = ind.macd?.latest;
  const bbLatest = ind.bollinger?.latest;
  return {
    asOf: data.asOf,
    lastClose: data.lastClose,
    source: data.source ?? null,
    rsi: ind.rsi?.latest ?? null,
    rsiSignal: ind.rsi?.signal ?? null,
    macdHistogram:
      macdLatest && typeof macdLatest === "object" && "histogram" in macdLatest
        ? macdLatest.histogram
        : typeof macdLatest === "number"
          ? macdLatest
          : null,
    macdSignal: ind.macd?.signal ?? null,
    ema21: ind.ema?.latest ?? null,
    emaSignal: ind.ema?.signal ?? null,
    bollingerUpper:
      bbLatest && typeof bbLatest === "object" && "upper" in bbLatest ? bbLatest.upper : null,
    bollingerLower:
      bbLatest && typeof bbLatest === "object" && "lower" in bbLatest ? bbLatest.lower : null,
    bollingerSignal: ind.bollinger?.signal ?? null,
  };
}

async function buildIndicatorWithFallback(indicators, interval = "1h", limit = 200) {
  let lastErr;
  for (const { source, symbol } of INDICATOR_SOURCES) {
    try {
      const data = await buildIndicatorResponse({
        symbol,
        source,
        interval,
        limit,
        series: false,
        indicators,
      });
      return { ...data, source };
    } catch (err) {
      lastErr = err;
      console.warn(
        `[btc-dashboard] indicators ${source} failed:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  throw lastErr ?? new Error("No indicator source available");
}

async function fetchCoingeckoDerivatives() {
  const rows = await fetchJson(`${cgBase()}/derivatives`, { headers: cgHeaders() });
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
}

function syntheticFundingSeries(rate, count = 56) {
  const now = Date.now();
  const step = 8 * 60 * 60 * 1000;
  return Array.from({ length: count }, (_, i) => ({
    time: now - (count - 1 - i) * step,
    rate,
  }));
}

function syntheticOiSeries(oiBtc, count = 48) {
  const now = Date.now();
  const step = 60 * 60 * 1000;
  return Array.from({ length: count }, (_, i) => ({
    time: now - (count - 1 - i) * step,
    oiBtc,
    oiUsd: null,
  }));
}

function proxyLongShortRatio(fundingRate, buyPct24h) {
  let ratio = 1;
  if (fundingRate != null) ratio += fundingRate * 20;
  if (buyPct24h != null) ratio += (buyPct24h - 50) / 100;
  return Math.max(0.5, Math.min(2.5, ratio));
}

function mapSignalPayload(s) {
  const rec = s.tradingRecommendation;
  const meta = s.metadata;
  const quick = s.quickSummary;
  const reasoning = rec?.reasoning;
  return {
    bias:
      rec?.clearSignal ??
      rec?.action ??
      meta?.TRADING_SIGNAL ??
      quick?.signal ??
      s.clearSignal ??
      s.action ??
      null,
    confidence:
      rec?.confidence ?? meta?.SIGNAL_STRENGTH ?? quick?.confidence ?? s.confidence ?? null,
    reasoning: Array.isArray(reasoning) ? reasoning.join(" ") : reasoning ?? s.summary ?? null,
    source: s.source ?? null,
    asOf: meta?.analysisDate ?? meta?.timestamp ?? s.asOf ?? null,
  };
}

async function fetchTechnicals() {
  return safeExec(async () => {
    const data = await buildIndicatorWithFallback([
      { id: "rsi", params: { period: 14 } },
      { id: "macd", params: {} },
      { id: "ema", params: { period: 21 } },
      { id: "bollinger", params: { period: 20 } },
    ]);
    return mapTechnicalsFromIndicators(data);
  });
}

async function fetchPerformance() {
  return safeExec(async () => {
    const base = cgBase();
    const json = await fetchJson(
      `${base}/coins/bitcoin/market_chart?vs_currency=usd&days=365`,
      { headers: cgHeaders() },
    );
    const prices = Array.isArray(json?.prices) ? json.prices : [];
    if (prices.length < 2) return null;
    const now = Date.now();
    const last = prices[prices.length - 1][1];
    const windows = [
      { key: "24h", ms: 24 * 60 * 60 * 1000 },
      { key: "7d", ms: 7 * 24 * 60 * 60 * 1000 },
      { key: "30d", ms: 30 * 24 * 60 * 60 * 1000 },
      { key: "90d", ms: 90 * 24 * 60 * 60 * 1000 },
      { key: "1y", ms: 365 * 24 * 60 * 60 * 1000 },
    ];
    const changes = {};
    for (const w of windows) {
      const ref = findPriceAtOrBefore(prices, now - w.ms);
      changes[w.key] = pctChange(ref, last);
    }
    return { currentPrice: last, changes };
  });
}

async function fetchVolatility(overview) {
  return safeExec(async () => {
    let atr = null;
    let lastClose = overview?.price?.usd ?? null;
    try {
      const atrData = await buildIndicatorWithFallback(
        [{ id: "atr", params: { period: 14 } }],
        "1h",
        100,
      );
      atr = atrData.indicators?.atr?.latest ?? null;
      lastClose = lastClose ?? atrData.lastClose ?? null;
    } catch {
      /* ATR optional when all candle sources fail */
    }
    const price = overview?.price?.usd ?? lastClose ?? null;
    const high = overview?.price?.high24h ?? null;
    const low = overview?.price?.low24h ?? null;
    let rangePositionPct = null;
    if (price != null && high != null && low != null && high > low) {
      rangePositionPct = ((price - low) / (high - low)) * 100;
    }
    const atrPct = atr != null && price != null && price > 0 ? (atr / price) * 100 : null;
    if (atr == null && rangePositionPct == null) return null;
    return { atr14: atr, atrPct, rangePositionPct, high24h: high, low24h: low };
  });
}

function parseOrderBookDepth(bids, asks) {
  if (!Array.isArray(bids) || !Array.isArray(asks) || bids.length === 0 || asks.length === 0) {
    return null;
  }
  const bestBid = toNumber(bids[0]?.[0]);
  const bestAsk = toNumber(asks[0]?.[0]);
  if (bestBid == null || bestAsk == null) return null;
  const mid = (bestBid + bestAsk) / 2;
  const band = mid * 0.01;

  let bidNotional = 0;
  let askNotional = 0;
  for (const [p, q] of bids) {
    const price = toNumber(p);
    const qty = toNumber(q);
    if (price == null || qty == null || price < mid - band) continue;
    bidNotional += price * qty;
  }
  for (const [p, q] of asks) {
    const price = toNumber(p);
    const qty = toNumber(q);
    if (price == null || qty == null || price > mid + band) continue;
    askNotional += price * qty;
  }
  const total = bidNotional + askNotional;
  const imbalancePct = total > 0 ? ((bidNotional - askNotional) / total) * 100 : null;
  return {
    midPrice: mid,
    bidNotional,
    askNotional,
    imbalancePct,
    spreadBps: mid > 0 ? ((bestAsk - bestBid) / mid) * 10000 : null,
  };
}

async function fetchCoingeckoOrderBookProxy(overview, buyPct24h) {
  const json = await fetchJson(
    `${cgBase()}/coins/bitcoin/tickers?exchange_ids=binance,gdax,kraken,okex&include_exchange_logo=false&page=1`,
    { headers: cgHeaders() },
  );
  const tickers = Array.isArray(json?.tickers) ? json.tickers : [];
  const majors = tickers.filter((t) => {
    const target = String(t?.target || "").toUpperCase();
    return target === "USDT" || target === "USD";
  });
  if (majors.length === 0) return null;

  let totalVol = 0;
  let spreadSum = 0;
  let spreadCount = 0;
  let midPrice = overview?.price?.usd ?? null;

  for (const t of majors) {
    const vol = toNumber(t.converted_volume?.usd);
    const spread = toNumber(t.bid_ask_spread_percentage);
    const last = toNumber(t.converted_last?.usd) ?? toNumber(t.last);
    if (vol != null) totalVol += vol;
    if (spread != null) {
      spreadSum += spread;
      spreadCount += 1;
    }
    if (last != null && midPrice == null) midPrice = last;
  }

  if (midPrice == null || totalVol <= 0) return null;

  let imbalancePct = buyPct24h != null ? (buyPct24h - 50) * 2 : null;
  if (imbalancePct == null) {
    const funding = overview?.derivatives?.fundingRate;
    if (funding != null) {
      imbalancePct = Math.max(-50, Math.min(50, funding * 50_000));
    }
  }

  const bidShare = imbalancePct != null ? 0.5 + imbalancePct / 200 : 0.5;
  const bookSlice = totalVol * 0.01;
  const spreadBps = spreadCount > 0 ? (spreadSum / spreadCount) * 100 : null;

  return {
    midPrice,
    bidNotional: bookSlice * bidShare,
    askNotional: bookSlice * (1 - bidShare),
    imbalancePct,
    spreadBps,
    fallback: true,
  };
}

async function fetchOrderBook(overview, buyPct24h) {
  return safeExec(async () => {
    try {
      const depth = await fetchBinanceSpotPublic("depth", { symbol: "BTCUSDT", limit: "100" });
      const parsed = parseOrderBookDepth(depth?.bids, depth?.asks);
      if (parsed) return parsed;
    } catch (err) {
      console.warn(
        "[btc-dashboard] order book binance failed:",
        err instanceof Error ? err.message : err,
      );
    }

    try {
      const book = await fetchJson(`${COINBASE_BOOK_URL}?level=2`);
      const parsed = parseOrderBookDepth(book?.bids, book?.asks);
      if (parsed) return { ...parsed, fallback: true };
    } catch (err) {
      console.warn(
        "[btc-dashboard] order book coinbase failed:",
        err instanceof Error ? err.message : err,
      );
    }

    try {
      const kraken = await fetchJson(
        "https://api.kraken.com/0/public/Depth?pair=XBTUSD&count=100",
      );
      const book = kraken?.result?.XXBTZUSD;
      const parsed = parseOrderBookDepth(book?.bids, book?.asks);
      if (parsed) return { ...parsed, fallback: true };
    } catch (err) {
      console.warn(
        "[btc-dashboard] order book kraken failed:",
        err instanceof Error ? err.message : err,
      );
    }

    try {
      const okx = await fetchJson(
        "https://www.okx.com/api/v5/market/books?instId=BTC-USDT&sz=100",
      );
      const book = okx?.data?.[0];
      const parsed = parseOrderBookDepth(book?.bids, book?.asks);
      if (parsed) return { ...parsed, fallback: true };
    } catch (err) {
      console.warn(
        "[btc-dashboard] order book okx failed:",
        err instanceof Error ? err.message : err,
      );
    }

    try {
      const cg = await fetchCoingeckoOrderBookProxy(overview, buyPct24h);
      if (cg) return cg;
    } catch (err) {
      console.warn(
        "[btc-dashboard] order book coingecko failed:",
        err instanceof Error ? err.message : err,
      );
    }

    return null;
  });
}

async function resolveDerivativesSnapshot(overview) {
  const fromOverview = overview?.derivatives;
  if (fromOverview?.fundingRate != null || fromOverview?.openInterestBtc != null) {
    return fromOverview;
  }
  return (await safeExec(() => fetchCoingeckoDerivatives())) ?? null;
}

async function fetchFundingHistory(overview) {
  return safeExec(async () => {
    try {
      const rows = await fetchJson(`${BINANCE_FUTURES_BASE}/fundingRate?symbol=BTCUSDT&limit=100`);
      if (Array.isArray(rows) && rows.length > 0) {
        const series = rows
          .map((r) => ({
            time: toNumber(r.fundingTime),
            rate: toNumber(r.fundingRate),
          }))
          .filter((r) => r.time != null && r.rate != null)
          .sort((a, b) => a.time - b.time);

        const current = series.at(-1)?.rate ?? null;
        const annualized = current != null ? current * 3 * 365 * 100 : null;
        return { current, annualizedPct: annualized, series: series.slice(-56) };
      }
    } catch (err) {
      console.warn(
        "[btc-dashboard] funding binance failed:",
        err instanceof Error ? err.message : err,
      );
    }

    const deriv = await resolveDerivativesSnapshot(overview);
    const current = deriv?.fundingRate ?? null;
    if (current == null) return null;
    return {
      current,
      annualizedPct: current * 3 * 365 * 100,
      series: syntheticFundingSeries(current),
      fallback: true,
    };
  });
}

async function fetchOpenInterestHistory(overview) {
  return safeExec(async () => {
    try {
      const rows = await fetchJson(
        `${BINANCE_FUTURES_DATA}/openInterestHist?symbol=BTCUSDT&period=1h&limit=48`,
      );
      if (Array.isArray(rows) && rows.length > 0) {
        const series = rows
          .map((r) => ({
            time: toNumber(r.timestamp),
            oiBtc: toNumber(r.sumOpenInterest),
            oiUsd: toNumber(r.sumOpenInterestValue),
          }))
          .filter((r) => r.time != null && r.oiBtc != null)
          .sort((a, b) => a.time - b.time);

        const latest = series.at(-1)?.oiBtc ?? null;
        const prev24 = series.length >= 24 ? series[series.length - 24]?.oiBtc : series[0]?.oiBtc;
        const change24hPct = pctChange(prev24, latest);
        return { latestBtc: latest, change24hPct, series };
      }
    } catch (err) {
      console.warn("[btc-dashboard] OI binance failed:", err instanceof Error ? err.message : err);
    }

    const deriv = await resolveDerivativesSnapshot(overview);
    const latest = deriv?.openInterestBtc ?? null;
    if (latest == null) return null;
    return {
      latestBtc: latest,
      change24hPct: null,
      series: syntheticOiSeries(latest),
      fallback: true,
    };
  });
}

async function fetchLongShortHistory(overview, buyPct24h) {
  return safeExec(async () => {
    try {
      const rows = await fetchJson(
        `${BINANCE_FUTURES_DATA}/globalLongShortAccountRatio?symbol=BTCUSDT&period=1h&limit=48`,
      );
      if (Array.isArray(rows) && rows.length > 0) {
        const series = rows
          .map((r) => ({
            time: toNumber(r.timestamp),
            ratio: toNumber(r.longShortRatio),
            longPct: toNumber(r.longAccount),
            shortPct: toNumber(r.shortAccount),
          }))
          .filter((r) => r.time != null && r.ratio != null)
          .sort((a, b) => a.time - b.time);

        return { latest: series.at(-1)?.ratio ?? null, series };
      }
    } catch (err) {
      console.warn(
        "[btc-dashboard] long/short binance failed:",
        err instanceof Error ? err.message : err,
      );
    }

    const deriv = await resolveDerivativesSnapshot(overview);
    const ratio = proxyLongShortRatio(deriv?.fundingRate, buyPct24h);
    const now = Date.now();
    const step = 60 * 60 * 1000;
    const series = Array.from({ length: 48 }, (_, i) => ({
      time: now - (47 - i) * step,
      ratio,
      longPct: null,
      shortPct: null,
    }));
    return { latest: ratio, series, fallback: true };
  });
}

async function fetchTakerFlowFromOhlc(rows) {
  const bars = [];
  let totalBuy = 0;
  let totalVol = 0;
  for (const row of rows) {
    if (!Array.isArray(row) || row.length < 5) continue;
    const time = toNumber(row[0]);
    const high = toNumber(row[2]);
    const low = toNumber(row[3]);
    const close = toNumber(row[4]);
    const vol = toNumber(row[5]) ?? 1;
    if (time == null || close == null || high == null || low == null) continue;
    const buyPct = proxyBuyPctFromOhlc(low, high, close);
    const buy = (buyPct / 100) * vol;
    bars.push({ time, buyPct, volume: vol });
    totalBuy += buy;
    totalVol += vol;
  }
  if (bars.length === 0) return null;
  return {
    buyPct24h: totalVol > 0 ? (totalBuy / totalVol) * 100 : null,
    bars: bars.slice(-24),
    fallback: true,
  };
}

async function fetchTakerFlowSummary() {
  return safeExec(async () => {
    try {
      const rows = await fetchBinanceSpotPublic("klines", {
        symbol: "BTCUSDT",
        interval: "1h",
        limit: "24",
      });
      if (Array.isArray(rows)) {
        const bars = [];
        let totalBuy = 0;
        let totalVol = 0;
        for (const row of rows) {
          if (!Array.isArray(row) || row.length < 10) continue;
          const time = toNumber(row[0]);
          const vol = toNumber(row[5]);
          const buy = toNumber(row[9]);
          if (time == null || vol == null || buy == null || vol <= 0) continue;
          const buyPct = (buy / vol) * 100;
          bars.push({ time, buyPct, volume: vol });
          totalBuy += buy;
          totalVol += vol;
        }
        if (bars.length > 0) {
          return {
            buyPct24h: totalVol > 0 ? (totalBuy / totalVol) * 100 : null,
            bars,
          };
        }
      }
    } catch (err) {
      console.warn(
        "[btc-dashboard] taker flow binance failed:",
        err instanceof Error ? err.message : err,
      );
    }

    try {
      const coinbaseRows = await fetchJson(`${COINBASE_CANDLES_URL}?granularity=3600`);
      if (Array.isArray(coinbaseRows) && coinbaseRows.length > 0) {
        const normalized = coinbaseRows
          .map((c) => [c[0] < 1e12 ? c[0] * 1000 : c[0], c[3], c[2], c[1], c[4], c[5]])
          .sort((a, b) => a[0] - b[0])
          .slice(-24);
        const out = await fetchTakerFlowFromOhlc(normalized);
        if (out) return out;
      }
    } catch (err) {
      console.warn(
        "[btc-dashboard] taker flow coinbase failed:",
        err instanceof Error ? err.message : err,
      );
    }

    const cgRows = await fetchJson(`${cgBase()}/coins/bitcoin/ohlc?vs_currency=usd&days=7`, {
      headers: cgHeaders(),
    });
    if (!Array.isArray(cgRows)) return null;
    return fetchTakerFlowFromOhlc(cgRows.slice(-24));
  });
}

async function fetchCoingeckoCorrelations() {
  const base = cgBase();
  const headers = cgHeaders();
  const results = [];
  for (const { id, symbol } of COINGECKO_CORRELATION_COINS) {
    try {
      const json = await fetchJson(`${base}/coins/${id}/market_chart?vs_currency=usd&days=7`, {
        headers,
      });
      const prices = Array.isArray(json?.prices) ? json.prices : [];
      if (prices.length < 2) continue;
      const data = prices.map(([time, close]) => ({ time, close: String(close) }));
      results.push({ symbol, success: true, data });
    } catch {
      /* skip coin on failure */
    }
  }
  if (results.length < 2) return null;
  return computeCorrelationFromOHLC({ results });
}

async function fetchCorrelations() {
  return safeExec(async () => {
    try {
      const batch = await fetchBinanceOhlcBatch(BTC_CORRELATION_SYMBOLS, "1h");
      const matrix = computeCorrelationFromOHLC(batch);
      const pairs = btcCorrelationPairs(matrix);
      if (pairs.length > 0) return { pairs, interval: "1h" };
    } catch (err) {
      console.warn(
        "[btc-dashboard] correlation binance failed:",
        err instanceof Error ? err.message : err,
      );
    }

    const matrix = await fetchCoingeckoCorrelations();
    const pairs = btcCorrelationPairs(matrix);
    return pairs.length > 0 ? { pairs, interval: "1h", fallback: true } : null;
  });
}

async function fetchFearGreedHistory() {
  return safeExec(async () => {
    const json = await fetchJson(FEAR_GREED_HISTORY_URL);
    const rows = Array.isArray(json?.data) ? json.data : [];
    const series = rows
      .map((r) => ({
        time: toNumber(r.timestamp) != null ? toNumber(r.timestamp) * 1000 : null,
        value: toNumber(r.value),
        label: typeof r.value_classification === "string" ? r.value_classification : null,
      }))
      .filter((r) => r.time != null && r.value != null)
      .sort((a, b) => a.time - b.time);
    return series.length > 0 ? { series } : null;
  });
}

async function fetchMarketStructure(overview) {
  return safeExec(async () => {
    const base = cgBase();
    const global = await fetchJson(`${base}/global`, { headers: cgHeaders() });
    const data = global?.data;
    const totalMcap = toNumber(data?.total_market_cap?.usd);
    const totalVol = toNumber(data?.total_volume?.usd);
    const btcDom = overview?.market?.dominancePct ?? toNumber(data?.market_cap_percentage?.btc);
    const ethDom = toNumber(data?.market_cap_percentage?.eth);
    let ethBtcRatio = null;
    if (btcDom != null && ethDom != null && btcDom > 0) {
      ethBtcRatio = ethDom / btcDom;
    }
    return {
      totalMarketCapUsd: totalMcap,
      totalVolumeUsd24h: totalVol,
      btcDominancePct: btcDom,
      ethBtcDominanceRatio: ethBtcRatio,
      altSeasonProxy: btcDom != null ? Math.max(0, Math.min(100, 100 - btcDom)) : null,
    };
  });
}

async function fetchBtcNews() {
  return safeExec(async () => {
    const rows = await fetchNewsTickers("BTC", 8);
    if (!Array.isArray(rows) || rows.length === 0) return null;
    return {
      items: rows.slice(0, 8).map((a) => ({
        title: String(a.title || "").trim(),
        url: a.url ?? a.link ?? null,
        date: a.date ?? a.published_at ?? a.pubDate ?? null,
        source: a.source ?? a.feed ?? null,
      })),
    };
  });
}

async function fetchBtcSentiment() {
  return safeExec(async () => {
    const articles = await getArticlesWithinHours(24);
    const btcArticles = articles.filter((a) => {
      const tickers = Array.isArray(a.tickers) ? a.tickers : [];
      if (tickers.includes("BTC")) return true;
      const blob = `${a.title || ""} ${a.description || ""}`.toLowerCase();
      return /\bbitcoin\b|\bbtc\b/.test(blob);
    });
    const batch = btcArticles.slice(0, INTERNAL_NEWS_SENTIMENT_BATCH_SIZE);
    if (batch.length === 0) return null;
    const classifications = await classifyArticleSentiments(batch);
    const stats = aggregateSentimentStats(classifications);
    return {
      positive: stats.Positive ?? 0,
      negative: stats.Negative ?? 0,
      neutral: stats.Neutral ?? 0,
      total: stats.Total ?? 0,
      score: stats.sentiment_score ?? null,
    };
  });
}

async function fetchBtcSignal() {
  return safeExec(async () => {
    const attempts = [
      () => loadSignal({ token: "bitcoin", limit: 200 }),
      () => loadSignal({ token: "bitcoin", source: "coingecko", limit: 200 }),
      () => loadSignal({ token: "bitcoin", source: "coinbase", limit: 200 }),
    ];
    for (const attempt of attempts) {
      try {
        const out = await attempt();
        const s = out?.signal;
        if (!s || typeof s !== "object") continue;
        const mapped = mapSignalPayload(s);
        if (mapped.bias) return mapped;
      } catch (err) {
        console.warn(
          "[btc-dashboard] signal source failed:",
          err instanceof Error ? err.message : err,
        );
      }
    }
    return null;
  });
}

async function fetchSupply() {
  return safeExec(async () => {
    const base = cgBase();
    const coin = await fetchJson(
      `${base}/coins/bitcoin?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false`,
      { headers: cgHeaders() },
    );
    const md = coin?.market_data;
    const circulating = toNumber(md?.circulating_supply);
    const maxSupply = toNumber(md?.max_supply) ?? 21_000_000;
    const pctMined = circulating != null && maxSupply > 0 ? (circulating / maxSupply) * 100 : null;
    const now = Date.now();
    const msToHalving = NEXT_HALVING_AT.getTime() - now;
    const daysToHalving = msToHalving > 0 ? Math.ceil(msToHalving / (24 * 60 * 60 * 1000)) : null;
    return {
      circulating,
      maxSupply,
      pctMined,
      nextHalvingAt: NEXT_HALVING_AT.toISOString(),
      daysToHalving,
    };
  });
}

export async function computeBtcDashboard(overviewInput, opts = {}) {
  const skipNews = opts.skipNews === true;
  const skipSentiment = opts.skipSentiment === true;
  const overview = overviewInput ?? (await computeBtcOverview());

  const [takerFlowR] = await Promise.allSettled([fetchTakerFlowSummary()]);
  const takerFlowPreview =
    takerFlowR.status === "fulfilled" ? takerFlowR.value?.buyPct24h ?? null : null;

  const settled = await Promise.allSettled([
    fetchTechnicals(),
    fetchPerformance(),
    fetchVolatility(overview),
    fetchOrderBook(overview, takerFlowPreview),
    fetchFundingHistory(overview),
    fetchOpenInterestHistory(overview),
    fetchLongShortHistory(overview, takerFlowPreview),
    fetchCorrelations(),
    fetchFearGreedHistory(),
    fetchMarketStructure(overview),
    skipNews ? Promise.resolve(null) : fetchBtcNews(),
    skipSentiment ? Promise.resolve(null) : fetchBtcSentiment(),
    fetchBtcSignal(),
    fetchSupply(),
  ]);

  const pick = (r) => (r.status === "fulfilled" ? r.value : null);
  const takerFlow = pick(takerFlowR);
  const [
    technicalsR,
    performanceR,
    volatilityR,
    orderBookR,
    fundingR,
    oiR,
    longShortR,
    correlationsR,
    fearGreedHistR,
    marketStructureR,
    newsR,
    sentimentR,
    signalR,
    supplyR,
  ] = settled;

  return {
    overview,
    sections: {
      technicals: pick(technicalsR),
      performance: pick(performanceR),
      volatility: pick(volatilityR),
      orderBook: pick(orderBookR),
      funding: pick(fundingR),
      openInterest: pick(oiR),
      longShort: pick(longShortR),
      takerFlow,
      correlations: pick(correlationsR),
      fearGreedHistory: pick(fearGreedHistR),
      marketStructure: pick(marketStructureR),
      news: pick(newsR),
      sentiment: pick(sentimentR),
      signal: pick(signalR),
      supply: pick(supplyR),
    },
    computedAt: new Date().toISOString(),
  };
}

/** Refresh news + sentiment only (RSS/LLM — slow, low frequency). */
export async function computeBtcDashboardNewsSentiment() {
  const [newsR, sentimentR] = await Promise.allSettled([fetchBtcNews(), fetchBtcSentiment()]);
  const pick = (r) => (r.status === "fulfilled" ? r.value : null);
  return {
    news: pick(newsR),
    sentiment: pick(sentimentR),
  };
}

export async function getBtcDashboard() {
  const payload = await readBtcSnapshotPayload(BTC_SNAPSHOT_KEYS.dashboard);
  return payload ?? null;
}
