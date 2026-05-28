/**
 * CoinGecko Alpha pipeline — daily top gainers, news/X catalyst research, predictions.
 */

import pLimit from "p-limit";
import { callOpenRouter } from "./openrouter.js";
import { parseJsonObjectFromLlm } from "./llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  coingeckoDataApiHeaders,
  getCoingeckoDataApiBaseUrl,
} from "../utils/coingeckoAPI.js";
import {
  fetchNewsTickers,
  fetchNewsTickersOnly,
} from "./internalNewsAgent.js";
import { searchRecentTweets, isXApiBearerConfigured } from "./xApiClient.js";
import {
  loadAlphaXBatchSnapshot,
  saveAlphaXBatchSnapshot,
} from "./alphaXBatchPipeline.js";
import {
  COINGECKO_ALPHA_CRON_MS,
  COINGECKO_ALPHA_DB_ID,
  COINGECKO_ALPHA_HISTORY_DAYS,
  COINGECKO_ALPHA_MIN_MARKET_CAP_USD,
  COINGECKO_ALPHA_RESEARCH_TOP_N,
} from "../config/coingeckoAlphaConfig.js";

const STABLE_OR_WRAPPED_RE =
  /^(usdt|usdc|busd|dai|tusd|usdd|fdusd|usde|pyusd|eurc|usds|weth|wbtc|steth|cbeth|reth|frxeth|wsteth|wbnb|wsol)$/i;

/**
 * @param {unknown} v
 * @returns {v is string}
 */
function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

/**
 * @param {unknown} raw
 * @returns {Array<{
 *   id: string;
 *   symbol: string;
 *   name: string;
 *   image: string | null;
 *   priceUsd: number;
 *   marketCapUsd: number;
 *   volume24hUsd: number;
 *   priceChange24hPct: number;
 * }>}
 */
function normalizeMarketsRows(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = /** @type {Record<string, unknown>} */ (row);
    const id = typeof o.id === "string" ? o.id : "";
    const symbol = typeof o.symbol === "string" ? o.symbol.toUpperCase() : "";
    const name = typeof o.name === "string" ? o.name : symbol;
    const priceUsd = typeof o.current_price === "number" ? o.current_price : NaN;
    const marketCapUsd = typeof o.market_cap === "number" ? o.market_cap : NaN;
    const volume24hUsd = typeof o.total_volume === "number" ? o.total_volume : NaN;
    const priceChange24hPct =
      o.price_change_percentage_24h_in_currency != null &&
      typeof o.price_change_percentage_24h_in_currency === "object"
        ? Number(
            /** @type {Record<string, unknown>} */ (o.price_change_percentage_24h_in_currency).usd,
          )
        : typeof o.price_change_percentage_24h === "number"
          ? o.price_change_percentage_24h
          : NaN;
    const image = typeof o.image === "string" ? o.image : null;
    if (!id || !symbol || !Number.isFinite(priceChange24hPct)) continue;
    if (STABLE_OR_WRAPPED_RE.test(symbol)) continue;
    if (!Number.isFinite(marketCapUsd) || marketCapUsd < COINGECKO_ALPHA_MIN_MARKET_CAP_USD) continue;
    out.push({
      id,
      symbol,
      name,
      image,
      priceUsd: Number.isFinite(priceUsd) ? priceUsd : 0,
      marketCapUsd,
      volume24hUsd: Number.isFinite(volume24hUsd) ? volume24hUsd : 0,
      priceChange24hPct,
    });
  }
  return out.sort((a, b) => b.priceChange24hPct - a.priceChange24hPct);
}

/**
 * @returns {Promise<ReturnType<typeof normalizeMarketsRows>>}
 */
async function fetchTopGainersMarkets() {
  const base = getCoingeckoDataApiBaseUrl();
  const url = new URL(`${base}/coins/markets`);
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("order", "price_change_percentage_24h_desc");
  url.searchParams.set("per_page", "100");
  url.searchParams.set("page", "1");
  url.searchParams.set("sparkline", "false");
  url.searchParams.set("price_change_percentage", "24h");

  const signal =
    typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
      ? AbortSignal.timeout(20_000)
      : undefined;

  const res = await fetch(url.toString(), {
    headers: coingeckoDataApiHeaders(),
    signal,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`CoinGecko markets HTTP ${res.status}: ${t.slice(0, 200)}`);
  }
  const raw = await res.json().catch(() => null);
  return normalizeMarketsRows(raw);
}

/**
 * @param {string} symbol
 * @returns {Promise<{ headlines: string[]; articles: Array<{ title: string; source?: string; url?: string }> }>}
 */
async function fetchNewsBundleForSymbol(symbol) {
  const ticker = String(symbol || "").trim().toUpperCase();
  if (!ticker) return { headlines: [], articles: [] };
  const [a, b] = await Promise.all([
    fetchNewsTickers(ticker, 12).catch(() => []),
    fetchNewsTickersOnly(ticker, 12).catch(() => []),
  ]);
  const merged = [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])];
  const seen = new Set();
  /** @type {Array<{ title: string; source?: string; url?: string }>} */
  const articles = [];
  for (const item of merged) {
    if (!item || typeof item !== "object") continue;
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!title || seen.has(title)) continue;
    seen.add(title);
    articles.push({
      title,
      source: typeof item.source === "string" ? item.source : undefined,
      url: typeof item.url === "string" ? item.url : undefined,
    });
    if (articles.length >= 8) break;
  }
  return {
    headlines: articles.map((x) => x.title),
    articles,
  };
}

/**
 * @param {string} symbol
 * @param {string} name
 * @returns {Promise<string[]>}
 */
async function fetchXSnippetsForToken(symbol, name) {
  if (!isXApiBearerConfigured()) return [];
  const sym = String(symbol || "").trim();
  const nm = String(name || "").trim();
  const query = `(${sym} OR "${nm}") (pump OR rally OR surge OR listing OR partnership) lang:en -is:retweet`;
  try {
    const body = await searchRecentTweets(query, {
      max_results: 12,
      tweetFields: "created_at,public_metrics,text,author_id",
      expansions: "author_id",
      userFields: "username,name,verified",
    });
    const tweets = Array.isArray(body?.data) ? body.data : [];
    const usersById = new Map();
    const users = Array.isArray(body?.includes?.users) ? body.includes.users : [];
    for (const u of users) {
      if (u && typeof u.id === "string" && typeof u.username === "string") {
        usersById.set(u.id, u.username);
      }
    }
    return tweets
      .map((t) => {
        if (!t || typeof t.text !== "string") return null;
        const authorId = typeof t.author_id === "string" ? t.author_id : "";
        const handle = usersById.get(authorId);
        const prefix = handle ? `@${handle}: ` : "";
        const text = t.text.replace(/\s+/g, " ").trim().slice(0, 220);
        return `${prefix}${text}`;
      })
      .filter(Boolean)
      .slice(0, 6);
  } catch {
    return [];
  }
}

/**
 * @param {object} prior
 * @param {object} nextBrief
 * @returns {object[]}
 */
function mergeHistory(prior, nextBrief) {
  const prevHist = Array.isArray(prior?.history) ? prior.history : [];
  const today = nextBrief.date;
  const entry = {
    date: today,
    topGainerSymbol: nextBrief.topGainer?.symbol ?? "",
    topGainerChangePct: nextBrief.topGainer?.priceChange24hPct ?? null,
    pumpReasonSummary:
      nextBrief.dailyDigests?.[0]?.pumpReason?.slice(0, 400) ??
      nextBrief.meta?.narrativeSummary?.slice(0, 400) ??
      "",
  };
  const withoutToday = prevHist.filter((h) => h && h.date !== today);
  return [entry, ...withoutToday].slice(0, COINGECKO_ALPHA_HISTORY_DAYS);
}

/**
 * @param {string} responseText
 */
function parseDailyAnalysis(responseText) {
  const parsed = parseJsonObjectFromLlm(responseText);
  if (!parsed || typeof parsed !== "object") throw new Error("llm_bad_shape");
  const o = /** @type {Record<string, unknown>} */ (parsed);

  const narrativeTitle = typeof o.narrativeTitle === "string" ? o.narrativeTitle.trim() : "";
  const narrativeSummary = typeof o.narrativeSummary === "string" ? o.narrativeSummary.trim() : "";
  const patternsLearned = Array.isArray(o.patternsLearned)
    ? o.patternsLearned.map(String).filter(Boolean).slice(0, 8)
    : [];
  const riskCaveats = Array.isArray(o.riskCaveats)
    ? o.riskCaveats.map(String).filter(Boolean).slice(0, 8)
    : [];

  const digestsRaw = Array.isArray(o.dailyDigests) ? o.dailyDigests : [];
  const dailyDigests = digestsRaw
    .map((d) => {
      const r = d && typeof d === "object" ? d : null;
      const coinId = r && typeof r.coinId === "string" ? r.coinId : "";
      const symbol = r && typeof r.symbol === "string" ? r.symbol : "";
      const name = r && typeof r.name === "string" ? r.name : "";
      const pumpReason = r && typeof r.pumpReason === "string" ? r.pumpReason : "";
      const catalysts = Array.isArray(r?.catalysts) ? r.catalysts.map(String).slice(0, 6) : [];
      const confidence =
        r && (r.confidence === "low" || r.confidence === "medium" || r.confidence === "high")
          ? r.confidence
          : "medium";
      return coinId && symbol && pumpReason
        ? { coinId, symbol, name: name || symbol, pumpReason, catalysts, confidence }
        : null;
    })
    .filter(Boolean);

  const predsRaw = Array.isArray(o.predictions) ? o.predictions : [];
  const predictions = predsRaw
    .map((p) => {
      const r = p && typeof p === "object" ? p : null;
      const coinId = r && typeof r.coinId === "string" ? r.coinId : "";
      const symbol = r && typeof r.symbol === "string" ? r.symbol : "";
      const name = r && typeof r.name === "string" ? r.name : "";
      const thesis = r && typeof r.thesis === "string" ? r.thesis : "";
      const catalystWatch = Array.isArray(r?.catalystWatch)
        ? r.catalystWatch.map(String).slice(0, 5)
        : [];
      const timeframe =
        r && (r.timeframe === "24h" || r.timeframe === "48h" || r.timeframe === "72h")
          ? r.timeframe
          : "48h";
      const confidence =
        r && (r.confidence === "low" || r.confidence === "medium" || r.confidence === "high")
          ? r.confidence
          : "low";
      return coinId && symbol && thesis
        ? { coinId, symbol, name: name || symbol, thesis, catalystWatch, timeframe, confidence }
        : null;
    })
    .filter(Boolean)
    .slice(0, 8);

  if (!narrativeTitle || !narrativeSummary || !dailyDigests.length) {
    throw new Error("llm_missing_fields");
  }

  return {
    meta: { narrativeTitle, narrativeSummary, patternsLearned, riskCaveats },
    dailyDigests,
    predictions,
  };
}

/**
 * @param {object} [opts]
 * @param {boolean} [opts.force]
 */
export async function runCoingeckoAlphaPipeline(opts = {}) {
  const gainers = await fetchTopGainersMarkets();
  if (gainers.length === 0) {
    throw new Error("No qualifying top gainers from CoinGecko");
  }

  const researchSet = gainers.slice(0, COINGECKO_ALPHA_RESEARCH_TOP_N);
  const limit = pLimit(3);

  const researchBundles = await Promise.all(
    researchSet.map((g) =>
      limit(async () => {
        const [news, xSnippets] = await Promise.all([
          fetchNewsBundleForSymbol(g.symbol),
          fetchXSnippetsForToken(g.symbol, g.name),
        ]);
        return {
          ...g,
          newsHeadlines: news.headlines,
          newsArticles: news.articles,
          xSnippets,
        };
      }),
    ),
  );

  const priorSnap = await loadAlphaXBatchSnapshot(COINGECKO_ALPHA_DB_ID);
  const priorPayload = priorSnap?.data && typeof priorSnap.data === "object" ? priorSnap.data : null;
  const historyForLlm = Array.isArray(priorPayload?.history) ? priorPayload.history : [];

  const now = new Date();
  const date = now.toISOString().slice(0, 10);

  const SYSTEM_PROMPT = `You are Syra's CoinGecko Alpha analyst.
You receive structured JSON: today's top 24h gainers (market cap filtered), recent news headlines, optional X/Twitter snippets, and historical daily top-gainer summaries.

Your job:
1) For each token in "tokensToAnalyze", explain WHY it pumped today — grounded only in provided news/X/market fields. If evidence is thin, say so and lower confidence.
2) Extract cross-token patterns from history + today's set (narratives, sector rotation, listing/news catalysts).
3) Predict up to 6 tokens that may outperform in the next 24–72h based on similar catalyst patterns — NOT guaranteed; informational only.

CRITICAL:
- Output ONLY one JSON object (no markdown).
- Do not invent specific news events not supported by headlines/snippets.
- Predictions must cite pattern logic from history or today's movers.
- This is not investment advice.`;

  const userPayload = {
    date,
    tokensToAnalyze: researchBundles.map((t) => ({
      coinId: t.id,
      symbol: t.symbol,
      name: t.name,
      priceChange24hPct: t.priceChange24hPct,
      marketCapUsd: t.marketCapUsd,
      volume24hUsd: t.volume24hUsd,
      newsHeadlines: t.newsHeadlines,
      xSnippets: t.xSnippets,
    })),
    allTopGainers: gainers.slice(0, 25).map((g) => ({
      coinId: g.id,
      symbol: g.symbol,
      priceChange24hPct: g.priceChange24hPct,
      marketCapUsd: g.marketCapUsd,
    })),
    historicalTopGainers: historyForLlm,
  };

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Analyze and return JSON:
{
  "narrativeTitle": string,
  "narrativeSummary": string,
  "patternsLearned": string[],
  "riskCaveats": string[],
  "dailyDigests": Array<{
    "coinId": string,
    "symbol": string,
    "name": string,
    "pumpReason": string,
    "catalysts": string[],
    "confidence": "low"|"medium"|"high"
  }>,
  "predictions": Array<{
    "coinId": string,
    "symbol": string,
    "name": string,
    "thesis": string,
    "catalystWatch": string[],
    "timeframe": "24h"|"48h"|"72h",
    "confidence": "low"|"medium"|"high"
  }>
}

Input:
${JSON.stringify(userPayload, null, 2)}`,
    },
  ];

  let lastResponse = "";
  const llmOpts = { max_tokens: 1400, temperature: 0.32 };
  let analysis;
  try {
    const result = await callOpenRouter(withLlmIdentitySystemNote(messages, null), llmOpts);
    lastResponse = typeof result?.response === "string" ? result.response : "";
    analysis = parseDailyAnalysis(lastResponse);
  } catch {
    const retryMessages = [
      ...messages,
      { role: "assistant", content: lastResponse ? lastResponse.slice(0, 8000) : "" },
      {
        role: "user",
        content:
          "Return ONLY valid JSON matching the schema. dailyDigests must have one entry per token in tokensToAnalyze.",
      },
    ];
    const result2 = await callOpenRouter(withLlmIdentitySystemNote(retryMessages, null), llmOpts);
    lastResponse = typeof result2?.response === "string" ? result2.response : "";
    analysis = parseDailyAnalysis(lastResponse);
  }

  const digestById = new Map(analysis.dailyDigests.map((d) => [d.coinId, d]));

  const dailyDigests = researchBundles.map((t) => {
    const d = digestById.get(t.id);
    return {
      coinId: t.id,
      symbol: t.symbol,
      name: t.name,
      image: t.image,
      priceUsd: t.priceUsd,
      priceChange24hPct: t.priceChange24hPct,
      marketCapUsd: t.marketCapUsd,
      volume24hUsd: t.volume24hUsd,
      pumpReason: d?.pumpReason ?? "Insufficient headline or social evidence for a confident catalyst read.",
      catalysts: d?.catalysts ?? [],
      confidence: d?.confidence ?? "low",
      newsHeadlines: t.newsHeadlines,
      xSnippets: t.xSnippets,
    };
  });

  const topGainer = gainers[0];
  const brief = {
    date,
    updatedAt: now.toISOString(),
    topGainer,
    topGainers: gainers.slice(0, 25),
    dailyDigests,
    meta: analysis.meta,
    predictions: analysis.predictions,
    researchCount: researchBundles.length,
    xApiEnabled: isXApiBearerConfigured(),
  };

  brief.history = mergeHistory(priorPayload, brief);

  const { savedAt } = await saveAlphaXBatchSnapshot(COINGECKO_ALPHA_DB_ID, brief);

  return { success: true, savedAt, data: brief, forced: opts.force === true };
}

/**
 * @returns {Promise<{ data: object; savedAt: string } | null>}
 */
export async function getCoingeckoAlphaBriefForRead() {
  const hit = await loadAlphaXBatchSnapshot(COINGECKO_ALPHA_DB_ID);
  if (!hit) return null;
  return hit;
}

/**
 * @returns {boolean}
 */
export function isCoingeckoAlphaBriefStale(savedAtIso) {
  if (!isNonEmptyString(savedAtIso)) return true;
  const t = Date.parse(savedAtIso);
  if (!Number.isFinite(t)) return true;
  const ageMs = Date.now() - t;
  return ageMs >= COINGECKO_ALPHA_CRON_MS;
}

/**
 * ISO timestamp when the next scheduled refresh is due (savedAt + cron interval).
 * @param {string | undefined} savedAtIso
 * @returns {string | null}
 */
export function getCoingeckoAlphaNextRefreshAt(savedAtIso) {
  if (!isNonEmptyString(savedAtIso)) return null;
  const t = Date.parse(savedAtIso);
  if (!Number.isFinite(t)) return null;
  return new Date(t + COINGECKO_ALPHA_CRON_MS).toISOString();
}
