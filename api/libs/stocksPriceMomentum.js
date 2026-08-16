/**
 * Real price momentum for xStocks: rolling on-chain samples + NASDAQ series + Dex 24h.
 */
import StocksPriceSnapshot from "../models/StocksPriceSnapshot.js";
import { fetchNasdaqIntradayCloses } from "./equityPriceFetchers.js";

const MAX_SAMPLES = 48;

function toNum(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * @param {number[]} prices
 * @param {number | null} [priceChange24h]
 */
export function computeMomentumFromPrices(prices, priceChange24h = null) {
  const series = (Array.isArray(prices) ? prices : [])
    .map((p) => toNum(p))
    .filter((p) => p > 0);

  let ret = 0;
  if (series.length >= 3) {
    ret = (series[series.length - 1] - series[0]) / series[0];
  } else if (priceChange24h != null && Number.isFinite(Number(priceChange24h))) {
    ret = Number(priceChange24h) / 100;
  }

  let vol = 0.015;
  if (series.length >= 4) {
    const rets = [];
    for (let i = 1; i < series.length; i += 1) {
      if (series[i - 1] > 0) rets.push((series[i] - series[i - 1]) / series[i - 1]);
    }
    if (rets.length > 0) {
      const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
      const varSum = rets.reduce((a, r) => a + (r - mean) ** 2, 0) / rets.length;
      vol = Math.sqrt(Math.max(0, varSum));
    }
  }

  const last = series.length ? series[series.length - 1] : 0;
  const meanPx =
    series.length > 0 ? series.reduce((a, b) => a + b, 0) / series.length : last;
  const trendRet = meanPx > 0 && last > 0 ? last / meanPx - 1 : ret;

  return {
    momentumScore: clamp(0.5 + ret * 8, 0, 1),
    trendScore: clamp(0.5 + trendRet * 10, 0, 1),
    volatilityScore: clamp(1 - vol * 20, 0, 1),
    volatilityPct: clamp(vol * 100, 0.2, 12),
    sampleCount: series.length,
    returnPct: ret * 100,
  };
}

/**
 * Persist a fill quote and return the rolling close series for this symbol.
 * @param {{
 *   symbol: string;
 *   mint?: string | null;
 *   nasdaqTicker?: string | null;
 *   priceUsd: number;
 *   source?: string;
 *   liquidityUsd?: number | null;
 *   spreadPct?: number | null;
 *   priceChange24h?: number | null;
 * }} quote
 * @returns {Promise<number[]>}
 */
export async function recordStocksPriceSample(quote) {
  const symbol = String(quote.symbol || "").trim();
  const priceUsd = toNum(quote.priceUsd);
  if (!symbol || !(priceUsd > 0)) return [];

  const sample = { t: new Date(), priceUsd, source: quote.source || "jupiter" };
  const doc = await StocksPriceSnapshot.findOneAndUpdate(
    { symbol },
    {
      $set: {
        mint: quote.mint ?? null,
        nasdaqTicker: quote.nasdaqTicker ?? null,
        lastPriceUsd: priceUsd,
        lastSource: sample.source,
        lastLiquidityUsd: quote.liquidityUsd ?? null,
        lastSpreadPct: quote.spreadPct ?? null,
        lastPriceChange24h: quote.priceChange24h ?? null,
      },
      $push: { samples: { $each: [sample], $slice: -MAX_SAMPLES } },
    },
    { upsert: true, new: true },
  ).lean();

  return (doc?.samples || []).map((s) => toNum(s.priceUsd)).filter((p) => p > 0);
}

/**
 * Merge persisted on-chain samples with NASDAQ intraday closes when available.
 * @param {string} symbol
 * @param {string | null} nasdaqTicker
 * @param {number[]} onchainCloses
 */
export async function loadMomentumPriceSeries(symbol, nasdaqTicker, onchainCloses) {
  const onchain = Array.isArray(onchainCloses) ? onchainCloses.filter((p) => p > 0) : [];
  let nasdaq = [];
  if (nasdaqTicker) {
    try {
      nasdaq = await fetchNasdaqIntradayCloses(nasdaqTicker);
    } catch {
      nasdaq = [];
    }
  }
  if (onchain.length >= 3) return onchain;
  if (nasdaq.length >= 3) return nasdaq;
  return onchain.length ? onchain : nasdaq;
}
