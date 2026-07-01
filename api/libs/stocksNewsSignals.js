/**
 * Deterministic news/sentiment/event scoring for xStocks universe.
 */
import { XSTOCKS_CATALOG } from "../config/equityTokens.js";
import { fetchXStocksAsset } from "./xstocksAssetRegistry.js";
import {
  getAssetNews,
  getAssetSentiment,
  getAssetEvents,
} from "./assetNewsFeed.js";

/** @typedef {{ symbol: string; name: string; mint: string; nasdaqTicker: string | null; isTradingHalted: boolean }} UniverseEntry */

/** @typedef {{ symbol: string; sentimentScore: number; eventScore: number; freshnessScore: number; momentumScore: number; volumeScore: number; spreadScore: number; direction: 'long' | 'short' | 'neutral'; compositeScore: number; topHeadline: string | null; newsCount: number; fetchedAt: string }} StockNewsSignal */

const CACHE_TTL_MS = 90_000;
/** @type {Map<string, { expires: number; data: StockNewsSignal }>} */
const signalCache = new Map();

/**
 * @param {import('../config/equityTokens.js').EquityTokenEntry} entry
 */
function keywordQueryForEntry(entry) {
  const primary = [entry.symbol, entry.nasdaqTicker, entry.name].filter(Boolean);
  const all = [
    ...primary,
    entry.nasdaqTicker ? `${entry.nasdaqTicker} stock` : null,
    entry.name,
  ].filter(Boolean);
  return { primary, all };
}

/**
 * @param {unknown[]} sentimentRows
 */
function extractSentimentScore(sentimentRows) {
  if (!Array.isArray(sentimentRows) || sentimentRows.length === 0) return 0;
  const latest = sentimentRows[sentimentRows.length - 1];
  const bucket = latest?.ticker ?? latest?.general ?? latest?.allTicker;
  if (!bucket || typeof bucket !== "object") return 0;
  const b = /** @type {Record<string, number>} */ (bucket);
  const score = b.sentiment_score ?? b.Sentiment_Score;
  if (typeof score === "number" && Number.isFinite(score)) return Math.max(-1, Math.min(1, score));
  const total = (b.Total ?? 0) || (b.Positive ?? 0) + (b.Negative ?? 0) + (b.Neutral ?? 0);
  if (total <= 0) return 0;
  return Math.max(-1, Math.min(1, ((b.Positive ?? 0) - (b.Negative ?? 0)) / total));
}

/**
 * @param {unknown[]} eventRows
 */
function extractEventScore(eventRows) {
  if (!Array.isArray(eventRows) || eventRows.length === 0) return 0;
  let count = 0;
  for (const row of eventRows) {
    const bucket = row?.ticker ?? row?.general;
    if (Array.isArray(bucket)) count += bucket.length;
  }
  return Math.min(1, count / 5);
}

/**
 * @param {import('./assetNewsFeed.js').CryptonewsArticle[] | unknown[]} newsRows
 */
function extractFreshnessScore(newsRows) {
  if (!Array.isArray(newsRows) || newsRows.length === 0) return 0;
  const now = Date.now();
  let best = 0;
  for (const row of newsRows) {
    const ts = row?.date ?? row?.publishedAt ?? row?.news_url;
    const published = typeof ts === "string" ? new Date(ts).getTime() : now;
    if (!Number.isFinite(published)) continue;
    const ageHours = (now - published) / 3_600_000;
    const freshness = Math.max(0, 1 - ageHours / 24);
    best = Math.max(best, freshness);
  }
  return best;
}

/**
 * Deterministic momentum proxy from sentiment + event recency (no price in signal layer).
 * @param {number} sentimentScore
 * @param {number} eventScore
 * @param {number} freshnessScore
 */
function deriveMomentumScore(sentimentScore, eventScore, freshnessScore) {
  const raw = sentimentScore * 0.5 + eventScore * 0.3 + freshnessScore * 0.2;
  return Math.max(0, Math.min(1, (raw + 1) / 2));
}

/**
 * @param {string} symbol
 * @param {{ priceUsd?: number; nasdaqPriceUsd?: number }} [priceCtx]
 * @returns {Promise<StockNewsSignal | null>}
 */
export async function fetchStockNewsSignal(symbol, priceCtx = {}) {
  const sym = String(symbol || "").trim();
  if (!sym) return null;

  const cached = signalCache.get(sym);
  if (cached && Date.now() < cached.expires) return cached.data;

  const catalogEntry = XSTOCKS_CATALOG.find((t) => t.symbol.toUpperCase() === sym.toUpperCase());
  if (!catalogEntry) return null;

  const kw = keywordQueryForEntry(catalogEntry);
  const ticker = catalogEntry.nasdaqTicker || sym.replace(/x$/i, "");

  const [news, sentiment, events] = await Promise.all([
    getAssetNews(ticker, kw, 12),
    getAssetSentiment(ticker, kw),
    getAssetEvents(ticker, kw),
  ]);

  const sentimentScore = extractSentimentScore(sentiment);
  const eventScore = extractEventScore(events);
  const freshnessScore = extractFreshnessScore(news);
  const momentumScore = deriveMomentumScore(sentimentScore, eventScore, freshnessScore);

  const spreadScore =
    priceCtx.priceUsd && priceCtx.nasdaqPriceUsd && priceCtx.nasdaqPriceUsd > 0
      ? Math.max(0, 1 - Math.abs(priceCtx.priceUsd / priceCtx.nasdaqPriceUsd - 1))
      : 0.5;

  const volumeScore = news.length > 0 ? Math.min(1, news.length / 8) : 0;

  const compositeScore =
    sentimentScore * 0.35 + eventScore * 0.25 + freshnessScore * 0.2 + momentumScore * 0.2;

  let direction = "neutral";
  if (compositeScore > 0.08) direction = "long";
  else if (compositeScore < -0.08) direction = "short";

  const topHeadline =
    Array.isArray(news) && news.length > 0
      ? String(news[0]?.title ?? news[0]?.news_title ?? "").slice(0, 200) || null
      : null;

  const data = {
    symbol: catalogEntry.symbol,
    sentimentScore,
    eventScore,
    freshnessScore,
    momentumScore,
    volumeScore,
    spreadScore,
    direction,
    compositeScore,
    topHeadline,
    newsCount: Array.isArray(news) ? news.length : 0,
    fetchedAt: new Date().toISOString(),
  };

  signalCache.set(sym, { expires: Date.now() + CACHE_TTL_MS, data });
  return data;
}

/**
 * @returns {Promise<UniverseEntry[]>}
 */
export async function resolveStocksUniverse() {
  const entries = XSTOCKS_CATALOG.filter((t) => t.mint && t.mint.length > 30);
  const out = [];

  for (const entry of entries) {
    let mint = entry.mint;
    let halted = false;
    try {
      const live = await fetchXStocksAsset(entry.symbol);
      if (live?.solanaMint) mint = live.solanaMint;
      if (live?.isTradingHalted) halted = true;
    } catch {
      /* use catalog mint */
    }
    if (halted) continue;
    out.push({
      symbol: entry.symbol,
      name: entry.name,
      mint,
      nasdaqTicker: entry.nasdaqTicker ?? null,
      isTradingHalted: halted,
    });
  }

  return out;
}

/**
 * @param {string[]} symbols
 * @param {Record<string, { priceUsd?: number; nasdaqPriceUsd?: number }>} [priceMap]
 * @returns {Promise<StockNewsSignal[]>}
 */
export async function fetchAllStockNewsSignals(symbols, priceMap = {}) {
  const results = await Promise.all(
    symbols.map((sym) => fetchStockNewsSignal(sym, priceMap[sym] ?? {})),
  );
  return results.filter(Boolean);
}

/**
 * @param {Record<string, number>} weights
 * @param {StockNewsSignal} signal
 */
export function scoreStockSignal(weights, signal) {
  const w = weights || {};
  let score = 0;
  let weightSum = 0;
  const fields = {
    sentiment_score: signal.sentimentScore,
    event_score: signal.eventScore,
    freshness_score: signal.freshnessScore,
    momentum_score: signal.momentumScore,
    volume_score: signal.volumeScore,
    spread_score: signal.spreadScore,
  };

  for (const [field, value] of Object.entries(fields)) {
    const weight = Number(w[field] ?? 1);
    if (!Number.isFinite(weight) || weight <= 0) continue;
    const normalized = field === "sentiment_score" ? (value + 1) / 2 : value;
    score += normalized * weight;
    weightSum += weight;
  }

  return weightSum > 0 ? score / weightSum : 0;
}

/**
 * @param {{ signalGate?: { all?: Array<{ field: string; op: string; value: number }>; any?: Array<{ field: string; op: string; value: number }>; minPasses?: number } }} strategy
 * @param {StockNewsSignal} signal
 */
export function applyStocksSignalGate(strategy, signal) {
  const gate = strategy.signalGate || {};
  const fields = {
    sentiment_score: signal.sentimentScore,
    event_score: signal.eventScore,
    freshness_score: signal.freshnessScore,
    momentum_score: signal.momentumScore,
    volume_score: signal.volumeScore,
    spread_score: signal.spreadScore,
  };

  /** @param {{ field: string; op: string; value: number }} rule */
  function evalRule(rule) {
    const val = fields[rule.field];
    if (val == null || !Number.isFinite(val)) return false;
    const target = Number(rule.value);
    switch (rule.op) {
      case "gte":
        return val >= target;
      case "lte":
        return val <= target;
      case "gt":
        return val > target;
      case "lt":
        return val < target;
      case "eq":
        return Math.abs(val - target) < 0.001;
      default:
        return false;
    }
  }

  const reasons = [];
  const allRules = gate.all || [];
  const anyRules = gate.any || [];
  const minPasses = gate.minPasses ?? 1;

  let passes = 0;

  if (allRules.length > 0) {
    const allPass = allRules.every((r) => {
      const ok = evalRule(r);
      if (!ok) reasons.push(`all:${r.field} ${r.op} ${r.value} failed`);
      return ok;
    });
    if (allPass) passes += 1;
  }

  if (anyRules.length > 0) {
    const anyPass = anyRules.some((r) => evalRule(r));
    if (anyPass) passes += 1;
    else reasons.push("any rules failed");
  }

  if (allRules.length === 0 && anyRules.length === 0) {
    passes = signal.direction === "long" ? 1 : 0;
    if (!passes) reasons.push("neutral direction");
  }

  return { pass: passes >= minPasses, reasons };
}
