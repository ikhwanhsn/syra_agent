/**
 * Live CoinGecko scout x402 service — brief, gainers, predictions views.
 */

import pLimit from "p-limit";
import { callOpenRouter } from "./openrouter.js";
import { parseJsonObjectFromLlm } from "./llmJsonObjectParse.js";
import { withLlmIdentitySystemNote } from "../routes/agent/chat.js";
import {
  coingeckoDataApiHeaders,
  getCoingeckoDataApiBaseUrl,
} from "../utils/coingeckoAPI.js";
import { fetchNewsTickers, fetchNewsTickersOnly } from "./internalNewsAgent.js";
import { searchRecentTweets, isXApiBearerConfigured } from "./xApiClient.js";
import { clampInt, parseBool, withScoutCache } from "./scoutCache.js";

const STABLE_OR_WRAPPED_RE =
  /^(usdt|usdc|busd|dai|tusd|usdd|fdusd|usde|pyusd|eurc|usds|weth|wbtc|steth|cbeth|reth|frxeth|wsteth|wbnb|wsol)$/i;

const DEFAULT_MIN_MARKET_CAP_USD = 1_000_000;
const VALID_VIEWS = new Set(["brief", "gainers", "predictions"]);

/**
 * @param {unknown} raw
 * @param {number} minMarketCapUsd
 */
function normalizeMarketsRows(raw, minMarketCapUsd) {
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
    if (!Number.isFinite(marketCapUsd) || marketCapUsd < minMarketCapUsd) continue;
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

async function fetchTopGainersMarkets(minMarketCapUsd) {
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
  return normalizeMarketsRows(raw, minMarketCapUsd);
}

async function fetchNewsBundleForSymbol(symbol) {
  const ticker = String(symbol || "").trim().toUpperCase();
  if (!ticker) return { headlines: [], articles: [] };
  const [a, b] = await Promise.all([
    fetchNewsTickers(ticker, 12).catch(() => []),
    fetchNewsTickersOnly(ticker, 12).catch(() => []),
  ]);
  const merged = [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])];
  const seen = new Set();
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
  return { headlines: articles.map((x) => x.title), articles };
}

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
        return `${prefix}${t.text.replace(/\s+/g, " ").trim().slice(0, 220)}`;
      })
      .filter(Boolean)
      .slice(0, 6);
  } catch {
    return [];
  }
}

function buildDeterministicBrief(gainers, topN, includeNews) {
  const topGainer = gainers[0] ?? null;
  const dailyDigests = gainers.slice(0, topN).map((g) => ({
    coinId: g.id,
    symbol: g.symbol,
    name: g.name,
    image: g.image,
    priceUsd: g.priceUsd,
    priceChange24hPct: g.priceChange24hPct,
    marketCapUsd: g.marketCapUsd,
    volume24hUsd: g.volume24hUsd,
    pumpReason: `${g.symbol} up ${g.priceChange24hPct.toFixed(1)}% in 24h with $${Math.round(g.marketCapUsd / 1_000_000)}M market cap — verify catalysts independently.`,
    catalysts: [`24h momentum +${g.priceChange24hPct.toFixed(1)}%`, "Volume/MC ratio on tape"],
    confidence: g.priceChange24hPct >= 25 ? "medium" : "low",
    newsHeadlines: [],
    xSnippets: [],
  }));

  const predictions = gainers.slice(0, Math.min(6, topN)).map((g) => ({
    coinId: g.id,
    symbol: g.symbol,
    name: g.name,
    thesis: `Momentum continuation candidate — ${g.symbol} leading 24h gainers with ${g.priceChange24hPct.toFixed(1)}% move.`,
    catalystWatch: ["Follow-through volume", "Sector rotation", "News confirmation"],
    timeframe: "48h",
    confidence: "low",
  }));

  return {
    date: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString(),
    topGainer,
    topGainers: gainers.slice(0, 25),
    dailyDigests,
    meta: {
      narrativeTitle: topGainer
        ? `${topGainer.symbol} leads 24h gainers (+${topGainer.priceChange24hPct.toFixed(1)}%)`
        : "CoinGecko gainers scan",
      narrativeSummary: `Live scan of top ${gainers.length} qualifying 24h gainers by market cap filter.`,
      patternsLearned: ["Momentum leaders cluster in high 24h % change with elevated volume"],
      riskCaveats: [
        "24h gainers often mean-revert — not investment advice.",
        "Deterministic read — enable llm=true for narrative enrichment.",
      ],
    },
    predictions,
    researchCount: topN,
    xApiEnabled: isXApiBearerConfigured(),
    includeNews,
  };
}

async function maybeEnhanceWithLlm(gainers, researchBundles, baseBrief) {
  const messages = [
    {
      role: "system",
      content: `You are Syra's CoinGecko scout analyst. Output ONLY JSON with narrativeTitle, narrativeSummary, patternsLearned[], riskCaveats[], dailyDigests[], predictions[]. Ground in provided market/news data only.`,
    },
    {
      role: "user",
      content: `Analyze:\n${JSON.stringify({ tokensToAnalyze: researchBundles, allTopGainers: gainers.slice(0, 25) }, null, 2)}`,
    },
  ];

  const result = await callOpenRouter(withLlmIdentitySystemNote(messages, null), {
    max_tokens: 1400,
    temperature: 0.32,
  });
  const parsed = parseJsonObjectFromLlm(result?.response ?? "");
  if (!parsed || typeof parsed !== "object") return baseBrief;
  const o = /** @type {Record<string, unknown>} */ (parsed);

  const narrativeTitle = typeof o.narrativeTitle === "string" ? o.narrativeTitle : baseBrief.meta.narrativeTitle;
  const narrativeSummary =
    typeof o.narrativeSummary === "string" ? o.narrativeSummary : baseBrief.meta.narrativeSummary;

  return {
    ...baseBrief,
    meta: {
      narrativeTitle,
      narrativeSummary,
      patternsLearned: Array.isArray(o.patternsLearned)
        ? o.patternsLearned.map(String).slice(0, 8)
        : baseBrief.meta.patternsLearned,
      riskCaveats: Array.isArray(o.riskCaveats)
        ? o.riskCaveats.map(String).slice(0, 8)
        : baseBrief.meta.riskCaveats,
    },
    dailyDigests: baseBrief.dailyDigests,
    predictions: Array.isArray(o.predictions) ? o.predictions : baseBrief.predictions,
    llmEnhanced: true,
  };
}

/**
 * @param {{ method?: string; query?: Record<string, unknown>; body?: Record<string, unknown> }} reqLike
 */
export function parseCoingeckoScoutParams(reqLike = {}) {
  const src =
    reqLike.method === "POST" && reqLike.body && typeof reqLike.body === "object"
      ? reqLike.body
      : reqLike.query ?? {};

  const viewRaw = String(src.view ?? "brief").trim().toLowerCase();

  return {
    view: VALID_VIEWS.has(viewRaw) ? viewRaw : "brief",
    topN: clampInt(src.topN, 1, 25, 8),
    minMarketCap: clampInt(src.minMarketCap, 100_000, 500_000_000, DEFAULT_MIN_MARKET_CAP_USD),
    includeNews: src.includeNews === undefined ? true : parseBool(src.includeNews),
    llm: parseBool(src.llm),
  };
}

/**
 * @param {ReturnType<typeof parseCoingeckoScoutParams>} params
 */
export async function getCoingeckoScout(params) {
  const cacheKey = `coingecko:scout:${params.view}:${params.topN}:${params.minMarketCap}:${params.includeNews}:${params.llm}`;

  return withScoutCache(cacheKey, async () => {
    const gainers = await fetchTopGainersMarkets(params.minMarketCap);
    if (gainers.length === 0) {
      throw new Error("No qualifying top gainers from CoinGecko");
    }

    let researchBundles = gainers.slice(0, params.topN).map((g) => ({ ...g, newsHeadlines: [], xSnippets: [] }));

    if (params.includeNews) {
      const limit = pLimit(3);
      researchBundles = await Promise.all(
        gainers.slice(0, params.topN).map((g) =>
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
    }

    let brief = buildDeterministicBrief(gainers, params.topN, params.includeNews);

    if (params.includeNews) {
      brief.dailyDigests = researchBundles.map((t) => {
        const existing = brief.dailyDigests.find((d) => d.coinId === t.id);
        return {
          ...(existing ?? {
            coinId: t.id,
            symbol: t.symbol,
            name: t.name,
            image: t.image,
            priceUsd: t.priceUsd,
            priceChange24hPct: t.priceChange24hPct,
            marketCapUsd: t.marketCapUsd,
            volume24hUsd: t.volume24hUsd,
            pumpReason: "",
            catalysts: [],
            confidence: "low",
          }),
          newsHeadlines: t.newsHeadlines ?? [],
          xSnippets: t.xSnippets ?? [],
        };
      });
    }

    if (params.llm) {
      brief = await maybeEnhanceWithLlm(gainers, researchBundles, brief);
    }

    brief.computedAt = new Date().toISOString();
    brief.view = params.view;

    if (params.view === "gainers") {
      return {
        view: "gainers",
        computedAt: brief.computedAt,
        topGainers: gainers.slice(0, params.topN),
        count: Math.min(params.topN, gainers.length),
      };
    }

    if (params.view === "predictions") {
      return {
        view: "predictions",
        computedAt: brief.computedAt,
        predictions: brief.predictions,
        meta: brief.meta,
      };
    }

    return brief;
  });
}
