/**
 * Bitget Agent Hub perception adapter.
 * Public market data (candles, ticker) works without API keys.
 * Skill Hub summaries are derived from CryptoAnalysisEngine output (maps to Agent Hub skill ids).
 */
import { buildCexSignalReport } from "../../cexSignalAnalysis.js";
import { extractSignalFields } from "../../experimentSignalExtract.js";

const BITGET_BASE = (process.env.BITGET_API_BASE_URL || "https://api.bitget.com").replace(/\/$/, "");

/** Bitget Agent Hub Skill Hub ids (documented analyst skills). */
export const BITGET_SKILL_IDS = Object.freeze([
  "macro-analyst",
  "market-intel",
  "news-briefing",
  "sentiment-analyst",
  "technical-analysis",
]);

/**
 * @returns {boolean}
 */
export function hasBitgetTradingCredentials() {
  const key = (process.env.BITGET_API_KEY || "").trim();
  const secret = (process.env.BITGET_SECRET_KEY || "").trim();
  const pass = (process.env.BITGET_PASSPHRASE || "").trim();
  return Boolean(key && secret && pass);
}

/**
 * @param {string} symbol e.g. BTCUSDT
 * @returns {Promise<{ symbol: string; last: number; bid: number | null; ask: number | null; ts: number }>}
 */
export async function fetchBitgetSpotTicker(symbol) {
  const sym = String(symbol || "BTCUSDT").trim().toUpperCase();
  const url = new URL(`${BITGET_BASE}/api/v2/spot/market/tickers`);
  url.searchParams.set("symbol", sym);
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || String(j.code) !== "00000" || !Array.isArray(j.data) || !j.data[0]) {
    throw new Error(`Bitget ticker: ${j?.msg || res.statusText || "bad response"}`);
  }
  const row = j.data[0];
  const last = Number(row.lastPr ?? row.close ?? row.last);
  if (!Number.isFinite(last) || last <= 0) {
    throw new Error("Bitget ticker: invalid last price");
  }
  const bid = Number(row.bidPr);
  const ask = Number(row.askPr);
  return {
    symbol: sym,
    last,
    bid: Number.isFinite(bid) ? bid : null,
    ask: Number.isFinite(ask) ? ask : null,
    ts: Date.now(),
  };
}

/**
 * @param {Record<string, unknown>} report
 * @returns {Record<string, { skillId: string; summary: string; signal?: string }>}
 */
function deriveSkillHubFromReport(report) {
  const ex = extractSignalFields(report);
  const rec = /** @type {Record<string, unknown> | undefined} */ (report?.tradingRecommendation);
  const reasoning =
    rec?.reasoning != null ? String(rec.reasoning).slice(0, 400) : "No narrative available.";
  const vol = /** @type {Record<string, unknown> | undefined} */ (report?.volatilityAnalysis);
  const trend = /** @type {Record<string, unknown> | undefined} */ (report?.trendAnalysis);

  return {
    "technical-analysis": {
      skillId: "technical-analysis",
      summary: `Signal ${ex.clearSignal}; RSI ${ex.rsi ?? "n/a"}; entry ${ex.entry ?? "n/a"}; TP ${ex.firstTarget ?? "n/a"}; SL ${ex.stopLoss ?? "n/a"}.`,
      signal: ex.clearSignal,
    },
    "sentiment-analyst": {
      skillId: "sentiment-analyst",
      summary: `Momentum ${trend?.momentum ?? "neutral"}; confidence ${ex.confidence ?? "n/a"}.`,
      signal: ex.clearSignal,
    },
    "macro-analyst": {
      skillId: "macro-analyst",
      summary: `Trend strength ${trend?.strength ?? "n/a"}; volatility regime ${vol?.regime ?? "n/a"}.`,
    },
    "market-intel": {
      skillId: "market-intel",
      summary: `Price ${ex.priceAtSignal ?? "n/a"}; support ${ex.support ?? "n/a"}; resistance ${ex.resistance ?? "n/a"}.`,
    },
    "news-briefing": {
      skillId: "news-briefing",
      summary: reasoning,
    },
  };
}

/**
 * Full perception snapshot for a vibe session tick.
 * @param {{ token: string; bar: string; limit: number; instId?: string }} params
 */
export async function perceiveBitgetMarket(params) {
  const token = String(params.token || "BTC").trim();
  const bar = String(params.bar || "1h").trim();
  const limit = Math.min(500, Math.max(50, Number(params.limit) || 200));

  const cex = await buildCexSignalReport("bitget", { token, bar, limit, instId: params.instId });
  const report = cex.report;
  const fields = extractSignalFields(report);
  const skills = deriveSkillHubFromReport(report);
  const ticker = await fetchBitgetSpotTicker(cex.meta?.symbol || `${token}USDT`);

  return {
    source: "bitget",
    symbol: cex.meta?.symbol || ticker.symbol,
    instrument: cex.instrument,
    anchorCloseMs: cex.anchorCloseMs,
    price: ticker.last,
    ticker,
    signal: fields,
    skills,
    reportSummary: {
      clearSignal: fields.clearSignal,
      entry: fields.entry,
      stopLoss: fields.stopLoss,
      firstTarget: fields.firstTarget,
      priceAtSignal: fields.priceAtSignal ?? ticker.last,
      confidence: fields.confidence,
      rsi: fields.rsi,
    },
    agentHub: {
      tools: "bitget_spot_public",
      skillHub: BITGET_SKILL_IDS,
      credentialsConfigured: hasBitgetTradingCredentials(),
    },
  };
}
