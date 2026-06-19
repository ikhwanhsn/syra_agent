/**
 * Crypto news routes – news, sentiment, event, trending-headline, sundown-digest.
 * Powered by the internal news agent (RSS + OpenRouter LLM + Mongo sentiment).
 */
import express from "express";
import { getResourceDescription } from "../../config/x402ResourceCatalog.js";
import { getV2Payment } from "../../utils/getV2Payment.js";
import { X402_API_PRICE_NEWS_USD } from "../../config/x402Pricing.js";
import { resolveTickerLocal } from "../../utils/coingeckoAPI.js";
import {
  fetchNewsCategoryGeneral,
  fetchNewsCategoryAllTickers,
  fetchNewsTickers,
  fetchNewsTickersOnly,
  fetchSentimentGeneral,
  fetchSentimentAllTickers,
  fetchSentimentTicker,
  fetchEventsGeneral,
  fetchEventsTicker,
  fetchSundownDigest,
  fetchTrendingHeadlinesGeneral,
  fetchTrendingHeadlinesTicker,
} from "../../libs/internalNewsAgent.js";
import { getArticlesWithinHours } from "../../libs/newsAggregator.js";
import { INTERNAL_NEWS_SENTIMENT_BATCH_SIZE } from "../../config/internalNewsConfig.js";
import {
  classifyArticleSentiments,
  aggregateSentimentStats,
} from "../../agents/news-intelligence-agent.js";

const {
  requirePayment,
  settlePaymentAndSetResponse,
  settlePaymentWithFallback,
  encodePaymentResponseHeader,
  runBuybackForRequest,
} = await getV2Payment();

const CACHE_TTL_MS = 90 * 1000;

/** Smaller default so /news returns faster; override INTERNAL_NEWS_ITEMS or CRYPTONEWS_NEWS_ITEMS. */
const NEWS_LIST_ITEMS = Math.min(
  100,
  Math.max(
    15,
    Number.parseInt(
      process.env.INTERNAL_NEWS_ITEMS || process.env.CRYPTONEWS_NEWS_ITEMS || "36",
      10,
    ),
  ),
);
/** Cap merged articles before JSON; override INTERNAL_NEWS_MAX_RESPONSE or CRYPTONEWS_NEWS_MAX_RESPONSE. */
const MAX_NEWS_RESPONSE = Math.min(
  200,
  Math.max(
    20,
    Number.parseInt(
      process.env.INTERNAL_NEWS_MAX_RESPONSE || process.env.CRYPTONEWS_NEWS_MAX_RESPONSE || "72",
      10,
    ),
  ),
);
/** When true, general news uses one feed only (faster). INTERNAL_NEWS_GENERAL_SINGLE_SECTION or CRYPTONEWS_GENERAL_USE_SINGLE_SECTION. */
const GENERAL_NEWS_SINGLE_SECTION =
  String(
    process.env.INTERNAL_NEWS_GENERAL_SINGLE_SECTION ||
      process.env.CRYPTONEWS_GENERAL_USE_SINGLE_SECTION ||
      "",
  ).toLowerCase() === "true";

function cacheKey(ticker) {
  return String(ticker || "general").trim().toLowerCase() || "general";
}

// --- Caches ---
const newsCache = new Map();
const sentimentCache = new Map();
const eventCache = new Map();
const trendingCache = new Map();
let sundownCache = null;
let sundownCacheExpires = 0;

// --- News ---
function getCachedNews(ticker) {
  const key = cacheKey(ticker);
  const entry = newsCache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}
function setCachedNews(ticker, data) {
  newsCache.set(cacheKey(ticker), { data, expires: Date.now() + CACHE_TTL_MS });
}

async function fetchNewsForTicker(ticker) {
  const n = NEWS_LIST_ITEMS;
  const cap = (rows) => (Array.isArray(rows) ? rows.slice(0, MAX_NEWS_RESPONSE) : rows);
  if (ticker === "general" || !ticker) {
    if (GENERAL_NEWS_SINGLE_SECTION) {
      return cap(await fetchNewsCategoryGeneral(n));
    }
    const [a, b] = await Promise.all([
      fetchNewsCategoryGeneral(n),
      fetchNewsCategoryAllTickers(n),
    ]);
    return cap(a.concat(b));
  }
  const [a, b] = await Promise.all([fetchNewsTickers(ticker, n), fetchNewsTickersOnly(ticker, n)]);
  return cap(a.concat(b));
}

async function getNewsForRequest(ticker) {
  let news = getCachedNews(ticker);
  if (news === null) {
    news = await fetchNewsForTicker(ticker);
    if (Array.isArray(news) && news.length > 0) setCachedNews(ticker, news);
  }
  return news;
}

// --- Sentiment ---
function getCachedSentiment(ticker) {
  const entry = sentimentCache.get(cacheKey(ticker));
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}
function setCachedSentiment(ticker, data) {
  sentimentCache.set(cacheKey(ticker), { data, expires: Date.now() + CACHE_TTL_MS });
}

async function getSentimentForTicker(ticker) {
  let cached = getCachedSentiment(ticker);
  if (cached !== null) return cached;
  let result;
  if (ticker !== "general") {
    const raw = await fetchSentimentTicker(ticker);
    result = Object.keys(raw).map((date) => ({ date, ticker: raw[date] }));
  } else {
    const [general, allTicker] = await Promise.all([
      fetchSentimentGeneral(),
      fetchSentimentAllTickers(),
    ]);
    result = Object.keys(general).map((date) => ({
      date,
      general: general[date],
      allTicker: allTicker[date],
    }));
  }
  if (Array.isArray(result) && result.length > 0) {
    setCachedSentiment(ticker, result);
    return result;
  }
  const live = await computeLivePreviewSentiment(ticker);
  if (live.length > 0) setCachedSentiment(ticker, live);
  return live;
}

function setPaymentResponseAndSendSentiment(res, data, settle) {
  const reason = settle?.errorReason || "";
  const isFacilitatorFailure = /Facilitator|500|Internal server error/i.test(reason);
  if (!settle?.success && !isFacilitatorFailure) throw new Error(reason || "Settlement failed");
  const effectiveSettle = settle?.success ? settle : { success: true };
  res.setHeader("Payment-Response", encodePaymentResponseHeader(effectiveSettle));
  res.json({ sentimentAnalysis: data });
}

// --- Event ---
function getCachedEvent(ticker) {
  const entry = eventCache.get(cacheKey(ticker));
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}
function setCachedEvent(ticker, data) {
  eventCache.set(cacheKey(ticker), { data, expires: Date.now() + CACHE_TTL_MS });
}

async function getEventForTicker(ticker) {
  let cached = getCachedEvent(ticker);
  if (cached !== null) return cached;
  let result;
  if (ticker !== "general") {
    const raw = await fetchEventsTicker(ticker);
    result = Object.keys(raw).map((date) => ({ date, ticker: raw[date] }));
  } else {
    const general = await fetchEventsGeneral();
    result = Object.keys(general).map((date) => ({ date, general: general[date] }));
  }
  if (Array.isArray(result) && result.length > 0) setCachedEvent(ticker, result);
  return result;
}

// --- Sundown ---
function getCachedSundown() {
  if (sundownCache !== null && Date.now() < sundownCacheExpires) return sundownCache;
  return null;
}
function setCachedSundown(data) {
  sundownCache = data;
  sundownCacheExpires = Date.now() + CACHE_TTL_MS;
}

async function getSundownData() {
  const cached = getCachedSundown();
  if (cached !== null) return cached;
  const result = await fetchSundownDigest();
  if (Array.isArray(result) && result.length > 0) setCachedSundown(result);
  return result;
}

function setPaymentResponseAndSendSundown(res, data, settle) {
  const reason = settle?.errorReason || "";
  const isFacilitatorFailure = /Facilitator|500|Internal server error/i.test(reason);
  if (!settle?.success && !isFacilitatorFailure) throw new Error(reason || "Settlement failed");
  const effectiveSettle = settle?.success ? settle : { success: true };
  res.setHeader("Payment-Response", encodePaymentResponseHeader(effectiveSettle));
  res.json({ sundownDigest: data });
}

// --- Trending headline ---
function getCachedTrending(ticker) {
  const entry = trendingCache.get(cacheKey(ticker));
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}
function setCachedTrending(ticker, data) {
  trendingCache.set(cacheKey(ticker), { data, expires: Date.now() + CACHE_TTL_MS });
}

async function getTrendingForTicker(ticker) {
  let cached = getCachedTrending(ticker);
  if (cached !== null) return cached;
  const result =
    ticker !== "general"
      ? await fetchTrendingHeadlinesTicker(ticker)
      : await fetchTrendingHeadlinesGeneral();
  if (Array.isArray(result) && result.length > 0) setCachedTrending(ticker, result);
  return result;
}

function setPaymentResponseAndSendTrending(res, data, settle) {
  const reason = settle?.errorReason || "";
  const isFacilitatorFailure = /Facilitator|500|Internal server error/i.test(reason);
  if (!settle?.success && !isFacilitatorFailure) throw new Error(reason || "Settlement failed");
  const effectiveSettle = settle?.success ? settle : { success: true };
  res.setHeader("Payment-Response", encodePaymentResponseHeader(effectiveSettle));
  res.json({ trendingHeadline: data });
}

// --- Resolve ticker helper (RSS news only needs a symbol label — no CoinGecko network call) ---
function resolveNewsTicker(rawTicker) {
  return resolveTickerLocal(rawTicker);
}

/** @type {Map<string, { expires: number; data: Array<{ date: string; general?: object; ticker?: object }> }>} */
const previewSentimentLiveCache = new Map();

/**
 * When Mongo series is empty, classify recent RSS articles once (cached).
 * @param {string} ticker
 * @returns {Promise<Array<{ date: string; general?: object; ticker?: object }>>}
 */
async function computeLivePreviewSentiment(ticker) {
  const key = cacheKey(ticker);
  const hit = previewSentimentLiveCache.get(key);
  if (hit && Date.now() < hit.expires) return hit.data;

  try {
    const articles = await getArticlesWithinHours(24);
    const batch = articles.slice(0, INTERNAL_NEWS_SENTIMENT_BATCH_SIZE);
    if (batch.length === 0) return [];

    const classifications = await classifyArticleSentiments(batch);
    const stats = aggregateSentimentStats(classifications);
    const date = new Date().toISOString().slice(0, 10);
    const row =
      ticker !== "general"
        ? { date, ticker: stats }
        : { date, general: stats };

    const data = [row];
    previewSentimentLiveCache.set(key, { data, expires: Date.now() + CACHE_TTL_MS });
    return data;
  } catch (err) {
    const msg = err?.message || String(err);
    console.warn("[internal-news] live sentiment fallback failed:", msg);
    return [];
  }
}

/**
 * Single x402 router for news endpoints: /news, /sentiment, /event, /trending-headline, /sundown-digest.
 * Mount at "/" so these paths remain /news, /sentiment, etc.
 */
export async function createCryptonewsRouter() {
  const router = express.Router();

  // Prewarm news cache
  fetchNewsForTicker("general").then((data) => {
    if (Array.isArray(data) && data.length > 0) setCachedNews("general", data);
  }).catch(() => {});

  // ---------- NEWS ----------
  if (process.env.NODE_ENV !== "production") {
    router.get("/news/dev", async (req, res) => {
      let ticker = req.query.ticker || "general";
      ticker = await resolveNewsTicker(ticker);
      const news = await getNewsForRequest(ticker);
      if (!news) return res.status(404).json({ error: "News not found" });
      if (news.length === 0) return res.status(500).json({ error: "Failed to fetch news" });
      res.json({ news });
    });
  }
  router.get(
    "/news",
    requirePayment({
      price: X402_API_PRICE_NEWS_USD,
      description: getResourceDescription("news"),
      method: "GET",
      discoverable: true,
      resource: "/news",
      inputSchema: {
        queryParams: {
          ticker: { type: "string", required: false, description: "Ticker (e.g. BTC, ETH) or 'general'" },
        },
      },
      outputSchema: { news: { type: "array", description: "News articles" } },
    }),
    async (req, res) => {
      try {
        const ticker = await resolveNewsTicker(req.query.ticker || "general");
        const news = await getNewsForRequest(ticker);
        if (!news) return res.status(404).json({ error: "News not found" });
        if (news.length === 0) return res.status(500).json({ error: "Failed to fetch news" });
        try {
          await settlePaymentAndSetResponse(res, req);
        } catch (settleErr) {
          const sm = settleErr?.message || String(settleErr);
          console.warn("[internal-news] /news settlement error:", sm);
          throw settleErr;
        }
        res.json({ news });
      } catch (err) {
        const msg = err?.message || String(err);
        console.warn("[internal-news] /news error:", msg);
        return res.status(503).json({
          error: "News service is temporarily unavailable. Please try again later.",
        });
      }
    }
  );
  router.post(
    "/news",
    requirePayment({
      price: X402_API_PRICE_NEWS_USD,
      description: getResourceDescription("news"),
      method: "POST",
      discoverable: true,
      resource: "/news",
      inputSchema: {
        bodyType: "json",
        bodyFields: { ticker: { type: "string", required: false, description: "Ticker or 'general'" } },
      },
      outputSchema: { news: { type: "array", description: "News articles" } },
    }),
    async (req, res) => {
      try {
        const ticker = await resolveNewsTicker(req.body.ticker || "general");
        const news = await getNewsForRequest(ticker);
        if (!news) return res.status(404).json({ error: "News not found" });
        if (news.length === 0) return res.status(500).json({ error: "Failed to fetch news" });
        try {
          await settlePaymentAndSetResponse(res, req);
        } catch (settleErr) {
          const sm = settleErr?.message || String(settleErr);
          console.warn("[internal-news] /news settlement error:", sm);
          throw settleErr;
        }
        res.json({ news });
      } catch (err) {
        const msg = err?.message || String(err);
        console.warn("[internal-news] /news error:", msg);
        return res.status(503).json({
          error: "News service is temporarily unavailable. Please try again later.",
        });
      }
    }
  );

  // ---------- SENTIMENT ----------
  if (process.env.NODE_ENV !== "production") {
    router.get("/sentiment/dev", async (req, res) => {
      let ticker = req.query.ticker || "general";
      ticker = await resolveNewsTicker(ticker);
      const sentimentAnalysis = await getSentimentForTicker(ticker);
      if (!sentimentAnalysis) return res.status(404).json({ error: "Sentiment analysis not found" });
      if (sentimentAnalysis.length === 0) return res.status(500).json({ error: "Failed to fetch sentiment analysis" });
      res.json({ sentimentAnalysis });
    });
  }
  router.get(
    "/sentiment",
    requirePayment({
      description: getResourceDescription("sentiment"),
      method: "GET",
      discoverable: true,
      resource: "/sentiment",
      inputSchema: {
        queryParams: { ticker: { type: "string", required: false, description: "Ticker or 'general'" } },
      },
      outputSchema: { sentimentAnalysis: { type: "array", description: "Daily sentiment scores" } },
    }),
    async (req, res) => {
      try {
        const ticker = await resolveNewsTicker(req.query.ticker || "general");
        const sentimentAnalysis = await getSentimentForTicker(ticker);
        if (!sentimentAnalysis) return res.status(404).json({ error: "Sentiment analysis not found" });
        if (sentimentAnalysis.length === 0) {
          return res.status(503).json({ error: "Sentiment service is temporarily unavailable. Please try again later." });
        }
        const { payload, accepted } = req.x402Payment;
        const settle = await settlePaymentWithFallback(payload, accepted, req);
        setPaymentResponseAndSendSentiment(res, sentimentAnalysis, settle);
        runBuybackForRequest(req);
      } catch (err) {
        console.warn("[internal-news] /sentiment error:", err?.message || err);
        return res.status(503).json({ error: "Sentiment service is temporarily unavailable. Please try again later." });
      }
    }
  );
  router.post(
    "/sentiment",
    requirePayment({
      description: getResourceDescription("sentiment"),
      method: "POST",
      discoverable: true,
      resource: "/sentiment",
      inputSchema: {
        bodyType: "json",
        bodyFields: { ticker: { type: "string", required: false, description: "Ticker or 'general'" } },
      },
      outputSchema: { sentimentAnalysis: { type: "array", description: "Daily sentiment scores" } },
    }),
    async (req, res) => {
      try {
        const ticker = await resolveNewsTicker(req.body.ticker || "general");
        const sentimentAnalysis = await getSentimentForTicker(ticker);
        if (!sentimentAnalysis) return res.status(404).json({ error: "Sentiment analysis not found" });
        if (sentimentAnalysis.length === 0) {
          return res.status(503).json({ error: "Sentiment service is temporarily unavailable. Please try again later." });
        }
        const { payload, accepted } = req.x402Payment;
        const settle = await settlePaymentWithFallback(payload, accepted, req);
        setPaymentResponseAndSendSentiment(res, sentimentAnalysis, settle);
        runBuybackForRequest(req);
      } catch (err) {
        console.warn("[internal-news] /sentiment error:", err?.message || err);
        return res.status(503).json({ error: "Sentiment service is temporarily unavailable. Please try again later." });
      }
    }
  );

  // ---------- EVENT ----------
  if (process.env.NODE_ENV !== "production") {
    router.get("/event/dev", async (req, res) => {
      let ticker = req.query.ticker || "general";
      ticker = await resolveNewsTicker(ticker);
      const event = await getEventForTicker(ticker);
      if (!event) return res.status(404).json({ error: "Event not found" });
      if (event.length === 0) return res.status(500).json({ error: "Failed to fetch event" });
      res.json({ event });
    });
  }
  router.get(
    "/event",
    requirePayment({
      description: getResourceDescription("event"),
      method: "GET",
      discoverable: true,
      resource: "/event",
      inputSchema: {
        queryParams: { ticker: { type: "string", required: false, description: "Ticker or 'general'" } },
      },
      outputSchema: { event: { type: "array", description: "Crypto events" } },
    }),
    async (req, res) => {
      let ticker = req.query.ticker || "general";
      ticker = await resolveNewsTicker(ticker);
      try {
        const event = await getEventForTicker(ticker);
        if (!event) return res.status(404).json({ error: "Event not found" });
        if (event.length === 0) return res.status(500).json({ error: "Failed to fetch event" });
        try {
          await settlePaymentAndSetResponse(res, req);
        } catch (settleErr) {
          console.warn("[internal-news] /event settlement error:", settleErr?.message || settleErr);
          throw settleErr;
        }
        res.json({ event });
      } catch (err) {
        console.warn("[internal-news] /event error:", err?.message || err);
        return res.status(503).json({ error: "Event service is temporarily unavailable. Please try again later." });
      }
    }
  );
  router.post(
    "/event",
    requirePayment({
      description: getResourceDescription("event"),
      method: "POST",
      discoverable: true,
      resource: "/event",
      inputSchema: {
        bodyType: "json",
        bodyFields: { ticker: { type: "string", required: false, description: "Ticker or 'general'" } },
      },
      outputSchema: { event: { type: "array", description: "Crypto events" } },
    }),
    async (req, res) => {
      let ticker = req.body.ticker || "general";
      ticker = await resolveNewsTicker(ticker);
      try {
        const event = await getEventForTicker(ticker);
        if (!event) return res.status(404).json({ error: "Event not found" });
        if (event.length === 0) return res.status(500).json({ error: "Failed to fetch event" });
        try {
          await settlePaymentAndSetResponse(res, req);
        } catch (settleErr) {
          console.warn("[internal-news] /event settlement error:", settleErr?.message || settleErr);
          throw settleErr;
        }
        res.json({ event });
      } catch (err) {
        console.warn("[internal-news] /event error:", err?.message || err);
        return res.status(503).json({ error: "Event service is temporarily unavailable. Please try again later." });
      }
    }
  );

  // ---------- TRENDING-HEADLINE ----------
  if (process.env.NODE_ENV !== "production") {
    router.get("/trending-headline/dev", async (req, res) => {
      let ticker = req.query.ticker || "general";
      ticker = await resolveNewsTicker(ticker);
      const trendingHeadline = await getTrendingForTicker(ticker);
      if (!trendingHeadline) return res.status(404).json({ error: "Trending headline not found" });
      if (trendingHeadline.length === 0) return res.status(500).json({ error: "Failed to fetch trending headline" });
      res.json({ trendingHeadline });
    });
  }
  router.get(
    "/trending-headline",
    requirePayment({
      description: getResourceDescription("trending-headline"),
      method: "GET",
      discoverable: true,
      resource: "/trending-headline",
      inputSchema: {
        queryParams: { ticker: { type: "string", required: false, description: "Ticker or 'general'" } },
      },
      outputSchema: { trendingHeadline: { type: "array", description: "Trending headlines" } },
    }),
    async (req, res) => {
      let ticker = req.query.ticker || "general";
      ticker = await resolveNewsTicker(ticker);
      try {
        const { payload, accepted } = req.x402Payment;
        const [trendingHeadline, settle] = await Promise.all([
          getTrendingForTicker(ticker),
          settlePaymentWithFallback(payload, accepted, req),
        ]);
        if (!trendingHeadline) return res.status(404).json({ error: "Trending headline not found" });
        if (trendingHeadline.length === 0) return res.status(500).json({ error: "Failed to fetch trending headline" });
        setPaymentResponseAndSendTrending(res, trendingHeadline, settle);
        runBuybackForRequest(req);
      } catch (err) {
        console.warn("[internal-news] /trending-headline upstream error:", err?.message || err);
        return res.status(503).json({ error: "Trending headlines are temporarily unavailable. Please try again later." });
      }
    }
  );
  router.post(
    "/trending-headline",
    requirePayment({
      description: getResourceDescription("trending-headline"),
      method: "POST",
      discoverable: true,
      resource: "/trending-headline",
      inputSchema: {
        bodyType: "json",
        bodyFields: { ticker: { type: "string", required: false, description: "Ticker or 'general'" } },
      },
      outputSchema: { trendingHeadline: { type: "array", description: "Trending headlines" } },
    }),
    async (req, res) => {
      let ticker = req.body.ticker || "general";
      ticker = await resolveNewsTicker(ticker);
      try {
        const { payload, accepted } = req.x402Payment;
        const [trendingHeadline, settle] = await Promise.all([
          getTrendingForTicker(ticker),
          settlePaymentWithFallback(payload, accepted, req),
        ]);
        if (!trendingHeadline) return res.status(404).json({ error: "Trending headline not found" });
        if (trendingHeadline.length === 0) return res.status(500).json({ error: "Failed to fetch trending headline" });
        setPaymentResponseAndSendTrending(res, trendingHeadline, settle);
        runBuybackForRequest(req);
      } catch (err) {
        console.warn("[internal-news] /trending-headline upstream error:", err?.message || err);
        return res.status(503).json({ error: "Trending headlines are temporarily unavailable. Please try again later." });
      }
    }
  );

  // ---------- SUNDOWN-DIGEST ----------
  if (process.env.NODE_ENV !== "production") {
    router.get("/sundown-digest/dev", async (_req, res) => {
      const sundownDigest = await getSundownData();
      if (!sundownDigest) return res.status(404).json({ error: "Sundown digest not found" });
      if (sundownDigest.length === 0) return res.status(500).json({ error: "Failed to fetch sundown digest" });
      res.json({ sundownDigest });
    });
  }
  router.get(
    "/sundown-digest",
    requirePayment({
      description: getResourceDescription("sundown-digest"),
      method: "GET",
      discoverable: true,
      resource: "/sundown-digest",
      outputSchema: { sundownDigest: { type: "array", description: "Daily digest items" } },
    }),
    async (req, res) => {
      try {
        const { payload, accepted } = req.x402Payment;
        const [sundownDigest, settle] = await Promise.all([
          getSundownData(),
          settlePaymentWithFallback(payload, accepted, req),
        ]);
        if (!sundownDigest) return res.status(404).json({ error: "Sundown digest not found" });
        if (sundownDigest.length === 0) return res.status(500).json({ error: "Failed to fetch sundown digest" });
        setPaymentResponseAndSendSundown(res, sundownDigest, settle);
        runBuybackForRequest(req);
      } catch (err) {
        console.warn("[internal-news] /sundown-digest upstream error:", err?.message || err);
        return res.status(503).json({ error: "Sundown digest is temporarily unavailable. Please try again later." });
      }
    }
  );
  router.post(
    "/sundown-digest",
    requirePayment({
      description: getResourceDescription("sundown-digest"),
      method: "POST",
      discoverable: true,
      resource: "/sundown-digest",
      outputSchema: { sundownDigest: { type: "array", description: "Daily digest items" } },
    }),
    async (req, res) => {
      try {
        const { payload, accepted } = req.x402Payment;
        const [sundownDigest, settle] = await Promise.all([
          getSundownData(),
          settlePaymentWithFallback(payload, accepted, req),
        ]);
        if (!sundownDigest) return res.status(404).json({ error: "Sundown digest not found" });
        if (sundownDigest.length === 0) return res.status(500).json({ error: "Failed to fetch sundown digest" });
        setPaymentResponseAndSendSundown(res, sundownDigest, settle);
        runBuybackForRequest(req);
      } catch (err) {
        console.warn("[internal-news] /sundown-digest upstream error:", err?.message || err);
        return res.status(503).json({ error: "Sundown digest is temporarily unavailable. Please try again later." });
      }
    }
  );

  return router;
}

/** Preview (no x402) news router for /preview/news */
export async function createNewsRouterRegular() {
  const router = express.Router();
  router.get("/", async (req, res) => {
    try {
      let ticker = req.query.ticker || "general";
      ticker = await resolveNewsTicker(ticker);
      const news = await getNewsForRequest(ticker);
      if (!news) return res.status(404).json({ error: "News not found" });
      if (news.length === 0) {
        return res.status(503).json({
          error: "Syra news agent has no headlines yet. Try again shortly.",
        });
      }
      res.json({ news, source: "internal" });
    } catch (err) {
      const msg = err?.message || String(err);
      console.warn("[internal-news] /preview/news error:", msg);
      return res.status(503).json({
        error: "News service is temporarily unavailable. Please try again later.",
      });
    }
  });
  return router;
}

function emptyPreviewSentimentPayload() {
  return {
    sentiment: {
      data: {},
      total: {
        "Total Positive": 0,
        "Total Negative": 0,
        "Total Neutral": 0,
        "Sentiment Score": 0,
      },
    },
    sentimentAnalysis: [],
    source: "empty",
  };
}

/** Preview (no x402) sentiment router for /preview/sentiment */
export async function createSentimentRouterRegular() {
  const router = express.Router();

  function buildSentimentData(result) {
    const data = {};
    for (const item of result) {
      const raw = item.ticker ?? item.general ?? item.allTicker ?? item;
      if (raw && typeof raw === "object") data[item.date] = { ...raw, sentiment_score: raw.sentiment_score ?? raw.Sentiment_Score };
    }
    return data;
  }
  function buildSentimentTotal(result) {
    let totalPos = 0, totalNeg = 0, totalNeutral = 0;
    const scores = [];
    for (const item of result) {
      const raw = item.ticker ?? item.general ?? item.allTicker ?? item;
      if (raw && typeof raw === "object") {
        if (typeof raw.Positive === "number") totalPos += raw.Positive;
        if (typeof raw.Negative === "number") totalNeg += raw.Negative;
        if (typeof raw.Neutral === "number") totalNeutral += raw.Neutral;
        const s = raw.sentiment_score ?? raw.Sentiment_Score;
        if (typeof s === "number") scores.push(s);
      }
    }
    const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    return {
      "Total Positive": totalPos,
      "Total Negative": totalNeg,
      "Total Neutral": totalNeutral,
      "Sentiment Score": avgScore,
    };
  }

  router.get("/", async (req, res) => {
    try {
      let ticker = req.query.ticker || "general";
      ticker = await resolveNewsTicker(ticker);

      let result;
      let source = "series";

      if (ticker !== "general") {
        const tickerSentimentAnalysis = await fetchSentimentTicker(ticker);
        result = Object.keys(tickerSentimentAnalysis).map((date) => ({
          date,
          ticker: tickerSentimentAnalysis[date],
        }));
      } else {
        const generalSentimentAnalysis = await fetchSentimentGeneral();
        const allTickerSentimentAnalysis = await fetchSentimentAllTickers();
        const dates = new Set([
          ...Object.keys(generalSentimentAnalysis),
          ...Object.keys(allTickerSentimentAnalysis),
        ]);
        result = [...dates].sort().map((date) => ({
          date,
          general: generalSentimentAnalysis[date],
          allTicker: allTickerSentimentAnalysis[date],
        }));
      }

      if (!result?.length) {
        result = await computeLivePreviewSentiment(ticker);
        source = result.length > 0 ? "live" : "empty";
      }

      if (!result?.length) {
        return res.json(emptyPreviewSentimentPayload());
      }

      return res.json({
        sentiment: { data: buildSentimentData(result), total: buildSentimentTotal(result) },
        sentimentAnalysis: result,
        source,
      });
    } catch (err) {
      const msg = err?.message || String(err);
      console.warn("[internal-news] /preview/sentiment error:", msg);
      return res.json(emptyPreviewSentimentPayload());
    }
  });
  return router;
}
