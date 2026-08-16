/**
 * News + real price momentum scoring for the xStocks universe.
 */
import { XSTOCKS_CATALOG } from "../config/equityTokens.js";
import { fetchXStocksAsset } from "./xstocksAssetRegistry.js";
import { getAssetNews, getAssetEvents } from "./assetNewsFeed.js";
import StocksPriceSnapshot from "../models/StocksPriceSnapshot.js";
import {
  computeMomentumFromPrices,
  loadMomentumPriceSeries,
} from "./stocksPriceMomentum.js";

/** @typedef {{ symbol: string; name: string; mint: string; nasdaqTicker: string | null; isTradingHalted: boolean }} UniverseEntry */

/** @typedef {{ symbol: string; sentimentScore: number; eventScore: number; freshnessScore: number; momentumScore: number; trendScore: number; volatilityScore: number; volatilityPct: number; volumeScore: number; spreadScore: number; direction: 'long' | 'short' | 'neutral'; compositeScore: number; topHeadline: string | null; newsCount: number; fetchedAt: string }} StockNewsSignal */

const CACHE_TTL_MS = 90_000;
/** @type {Map<string, { expires: number; data: StockNewsSignal }>} */
const signalCache = new Map();

const BULLISH_RE =
  /\b(beat|beats|surge|surges|rally|rallies|upgrade|upgraded|record|profit|growth|bullish|soar|soars|jump|jumps|gain|gains|outperform|buy rating|raised guidance|all-time high)\b/i;
const BEARISH_RE =
  /\b(miss|misses|plunge|plunges|downgrade|downgraded|lawsuit|probe|loss|losses|bearish|tumble|tumbles|fall|falls|cut|cuts|sell rating|lowered guidance|recall|fraud|investigation)\b/i;

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

function articleText(row) {
  return `${row?.title ?? row?.news_title ?? ""} ${row?.text ?? row?.description ?? ""}`;
}

/**
 * Headline lexicon sentiment in [-1, 1]. Returns 0 only when there are no keyword hits.
 * @param {unknown[]} newsRows
 */
export function extractHeadlineSentiment(newsRows) {
  if (!Array.isArray(newsRows) || newsRows.length === 0) return 0;
  let pos = 0;
  let neg = 0;
  for (const row of newsRows) {
    const text = articleText(row);
    const bull = BULLISH_RE.test(text);
    const bear = BEARISH_RE.test(text);
    if (bull && !bear) pos += 1;
    else if (bear && !bull) neg += 1;
  }
  const hits = pos + neg;
  if (hits === 0) return 0;
  return Math.max(-1, Math.min(1, (pos - neg) / hits));
}

/**
 * Age-decayed, de-duplicated event score in [0, 1]. Does not saturate at 1 event.
 * @param {unknown[]} eventRows
 * @param {number} [nowMs]
 */
export function extractEventScore(eventRows, nowMs = Date.now()) {
  if (!Array.isArray(eventRows) || eventRows.length === 0) return 0;
  const seen = new Set();
  let weight = 0;
  for (const row of eventRows) {
    const dateStr = typeof row?.date === "string" ? row.date : null;
    const bucket = Array.isArray(row?.ticker)
      ? row.ticker
      : Array.isArray(row?.general)
        ? row.general
        : [];
    for (const ev of bucket) {
      const name = String(ev?.event_name ?? ev?.title ?? "").trim().toLowerCase();
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const published = dateStr ? new Date(dateStr).getTime() : nowMs;
      const ageHours = Number.isFinite(published) ? (nowMs - published) / 3_600_000 : 24;
      const decay = Math.max(0, 1 - ageHours / 48);
      weight += decay;
    }
  }
  if (weight <= 0) return 0;
  return 1 - Math.exp(-weight / 2);
}

/**
 * @param {unknown[]} newsRows
 */
export function extractFreshnessScore(newsRows) {
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
 * Warn when a scored field does not discriminate across the universe.
 * @param {StockNewsSignal[]} signals
 * @param {(msg: string) => void} [log]
 */
export function warnIfSignalsCollapsed(signals, log = console.warn) {
  if (!Array.isArray(signals) || signals.length < 2) return { collapsed: [] };
  const fields = ["sentimentScore", "eventScore", "momentumScore", "trendScore"];
  const collapsed = [];
  for (const field of fields) {
    const vals = signals.map((s) => Number(s[field])).filter(Number.isFinite);
    if (vals.length < 2) continue;
    const span = Math.max(...vals) - Math.min(...vals);
    if (span < 0.02) collapsed.push(field);
  }
  if (collapsed.length > 0) {
    log(`[stocks signals] collapsed fields: ${collapsed.join(",")}`);
  }
  return { collapsed };
}

function directionFromScores({ compositeScore, momentumScore, trendScore }) {
  if (trendScore > 0.54 && momentumScore >= 0.32) return "long";
  if (momentumScore > 0.58 && trendScore > 0.52) return "long";
  if (momentumScore < 0.42 && trendScore < 0.48) return "short";
  if (compositeScore > 0.12) return "long";
  if (compositeScore < -0.12) return "short";
  return "neutral";
}

/**
 * @param {string} symbol
 * @param {{
 *   priceUsd?: number;
 *   nasdaqPriceUsd?: number;
 *   priceChange24h?: number | null;
 *   spreadPct?: number | null;
 *   liquidityUsd?: number | null;
 *   source?: string;
 *   mint?: string;
 * }} [priceCtx]
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

  const [news, events] = await Promise.all([
    getAssetNews(ticker, kw, 12),
    getAssetEvents(ticker, kw),
  ]);

  const sentimentScore = extractHeadlineSentiment(news);
  const eventScore = extractEventScore(events);
  const freshnessScore = extractFreshnessScore(news);

  let onchainCloses = [];
  try {
    const snap = await StocksPriceSnapshot.findOne({ symbol: catalogEntry.symbol }).lean();
    onchainCloses = (snap?.samples || []).map((s) => Number(s.priceUsd)).filter((p) => p > 0);
  } catch {
    onchainCloses = [];
  }

  const series = await loadMomentumPriceSeries(
    catalogEntry.symbol,
    catalogEntry.nasdaqTicker ?? null,
    onchainCloses,
  );
  const mom = computeMomentumFromPrices(series, priceCtx.priceChange24h ?? null);

  const spreadScore =
    priceCtx.spreadPct != null && Number.isFinite(Number(priceCtx.spreadPct))
      ? Math.max(0, 1 - Math.abs(Number(priceCtx.spreadPct)) / 8)
      : priceCtx.priceUsd && priceCtx.nasdaqPriceUsd && priceCtx.nasdaqPriceUsd > 0
        ? Math.max(0, 1 - Math.abs(priceCtx.priceUsd / priceCtx.nasdaqPriceUsd - 1))
        : 0.5;

  const absChg = Math.abs(Number(priceCtx.priceChange24h) || mom.returnPct || 0);
  const volumeScore = Math.min(
    1,
    (Array.isArray(news) ? news.length / 8 : 0) * 0.35 + Math.min(1, absChg / 6) * 0.65,
  );

  const momentumCentered = (mom.momentumScore - 0.5) * 2;
  const trendCentered = (mom.trendScore - 0.5) * 2;
  const compositeScore =
    sentimentScore * 0.15 +
    eventScore * 0.15 +
    freshnessScore * 0.15 +
    momentumCentered * 0.35 +
    trendCentered * 0.2;

  const direction = directionFromScores({
    compositeScore,
    momentumScore: mom.momentumScore,
    trendScore: mom.trendScore,
  });

  const topHeadline =
    Array.isArray(news) && news.length > 0
      ? String(news[0]?.title ?? news[0]?.news_title ?? "").slice(0, 200) || null
      : null;

  const data = {
    symbol: catalogEntry.symbol,
    sentimentScore,
    eventScore,
    freshnessScore,
    momentumScore: mom.momentumScore,
    trendScore: mom.trendScore,
    volatilityScore: mom.volatilityScore,
    volatilityPct: mom.volatilityPct,
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
 * @param {Record<string, { priceUsd?: number; nasdaqPriceUsd?: number; priceChange24h?: number; spreadPct?: number; liquidityUsd?: number; source?: string; mint?: string }>} [priceMap]
 * @returns {Promise<StockNewsSignal[]>}
 */
export async function fetchAllStockNewsSignals(symbols, priceMap = {}) {
  const results = await Promise.all(
    symbols.map((sym) => fetchStockNewsSignal(sym, priceMap[sym] ?? {})),
  );
  const signals = results.filter(Boolean);
  warnIfSignalsCollapsed(signals);
  return signals;
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
    trend_score: signal.trendScore ?? 0.5,
    volatility_score: signal.volatilityScore ?? 0.5,
    volume_score: signal.volumeScore,
    spread_score: signal.spreadScore,
  };

  for (const [field, value] of Object.entries(fields)) {
    const weight = Number(w[field] ?? 0);
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
    trend_score: signal.trendScore ?? 0.5,
    volatility_score: signal.volatilityScore ?? 0.5,
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
    passes = signal.direction === "long" || signal.direction === "short" ? 1 : 0;
    if (!passes) reasons.push("neutral direction");
  }

  return { pass: passes >= minPasses, reasons };
}
