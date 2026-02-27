import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_NEWS_USD } from "../config/x402Pricing.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { resolveTickerFromCoingecko } from "../utils/coingeckoAPI.js";

/** Cache TTL in ms (90s) – repeated requests for same ticker return instantly. */
const NEWS_CACHE_TTL_MS = 90 * 1000;

/** In-memory cache: key = normalized ticker, value = { data, expires }. */
const newsCache = new Map();

function getCachedNews(ticker) {
  const key = String(ticker || "general").trim().toLowerCase() || "general";
  const entry = newsCache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

function setCachedNews(ticker, data) {
  const key = String(ticker || "general").trim().toLowerCase() || "general";
  newsCache.set(key, { data, expires: Date.now() + NEWS_CACHE_TTL_MS });
}

export async function createNewsRouter() {
  const router = express.Router();

  const fetchGeneralNews = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/category?section=general&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`,
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchAllTickerNews = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/category?section=alltickers&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`,
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchTickerNews = async (ticker) => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1?tickers=${ticker}&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`,
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchTickerNewsAdvance = async (ticker) => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1?tickers-only=${ticker}&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`,
    );
    const data = await response.json();
    return data.data || [];
  };

  /** Fetch news for a ticker (used for cache miss and prewarm). */
  async function fetchNewsForTicker(ticker) {
    if (ticker === "general" || !ticker) {
      const [generalNews, allTickerNews] = await Promise.all([
        fetchGeneralNews(),
        fetchAllTickerNews(),
      ]);
      return generalNews.concat(allTickerNews);
    }
    const [tickerNews, tickerNewsAdvance] = await Promise.all([
      fetchTickerNews(ticker),
      fetchTickerNewsAdvance(ticker),
    ]);
    return tickerNews.concat(tickerNewsAdvance);
  }

  /** Prewarm cache for "general" in background so first requests are fast. */
  fetchNewsForTicker("general").then((data) => {
    if (Array.isArray(data) && data.length > 0) {
      setCachedNews("general", data);
    }
  }).catch(() => {});

  /** Get news for ticker (cache or fetch). Used so we can run in parallel with settle. */
  async function getNewsForRequest(ticker) {
    let news = getCachedNews(ticker);
    if (news === null) {
      news = await fetchNewsForTicker(ticker);
      if (Array.isArray(news) && news.length > 0) setCachedNews(ticker, news);
    }
    return news;
  }

  /** Dev-only: GET .../dev returns news without payment (for browser/testing). Disabled in production. */
  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      let ticker = req.query.ticker || "general";
      if (ticker !== "general" && ticker) {
        const resolved = await resolveTickerFromCoingecko(ticker);
        ticker = resolved ? resolved.symbol.toUpperCase() : "general";
      }
      const news = await getNewsForRequest(ticker);
      if (!news) return res.status(404).json({ error: "News not found" });
      if (news.length === 0) return res.status(500).json({ error: "Failed to fetch news" });
      res.json({ news });
    });
  }

  // GET endpoint with V2 x402 format (resource omitted so 402 uses request URL: /news or /v2/news)
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_NEWS_USD,
      description: "Get latest crypto news and market updates",
      method: "GET",
      discoverable: true,
      inputSchema: {
        queryParams: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for all news",
          },
        },
      },
      outputSchema: {
        news: {
          type: "array",
          description: "Array of news articles with title, source, date, and content",
        },
      },
    }),
    async (req, res) => {
      let ticker = req.query.ticker || "general";
      if (ticker !== "general" && ticker) {
        const resolved = await resolveTickerFromCoingecko(ticker);
        ticker = resolved ? resolved.symbol.toUpperCase() : "general";
      }
      const news = await getNewsForRequest(ticker);
      if (!news) return res.status(404).json({ error: "News not found" });
      if (news.length === 0) return res.status(500).json({ error: "Failed to fetch news" });
      await settlePaymentAndSetResponse(res, req);
      res.json({ news });
    },
  );

  // POST endpoint with V2 x402 format (resource omitted so 402 uses request URL)
  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_NEWS_USD,
      description: "Get latest crypto news and market updates",
      method: "POST",
      discoverable: true,
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for all news",
          },
        },
      },
      outputSchema: {
        news: {
          type: "array",
          description: "Array of news articles with title, source, date, and content",
        },
      },
    }),
    async (req, res) => {
      let ticker = req.body.ticker || "general";
      if (ticker !== "general" && ticker) {
        const resolved = await resolveTickerFromCoingecko(ticker);
        ticker = resolved ? resolved.symbol.toUpperCase() : "general";
      }
      const news = await getNewsForRequest(ticker);
      if (!news) return res.status(404).json({ error: "News not found" });
      if (news.length === 0) return res.status(500).json({ error: "Failed to fetch news" });
      await settlePaymentAndSetResponse(res, req);
      res.json({ news });
    },
  );

  return router;
}

/** Regular (no x402) news router for landing/dashboard – same data, no payment. */
export async function createNewsRouterRegular() {
  const router = express.Router();

  const fetchGeneralNews = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/category?section=general&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`,
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchAllTickerNews = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/category?section=alltickers&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`,
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchTickerNews = async (ticker) => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1?tickers=${ticker}&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`,
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchTickerNewsAdvance = async (ticker) => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1?tickers-only=${ticker}&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`,
    );
    const data = await response.json();
    return data.data || [];
  };

  const handleGet = async (req, res) => {
    const ticker = req.query.ticker || "general";
    let result;
    if (ticker !== "general") {
      const tickerNews = await fetchTickerNews(ticker);
      const tickerNewsAdvance = await fetchTickerNewsAdvance(ticker);
      result = tickerNews.concat(tickerNewsAdvance);
    } else {
      const generalNews = await fetchGeneralNews();
      const allTickerNews = await fetchAllTickerNews();
      result = generalNews.concat(allTickerNews);
    }
    const news = result;
    if (!news) return res.status(404).json({ error: "News not found" });
    if (news?.length > 0) res.json({ news });
    else res.status(500).json({ error: "Failed to fetch news" });
  };

  router.get("/", handleGet);
  return router;
}
