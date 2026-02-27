// routes/sentiment.js – cache + parallel settle for fast response
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";

const { requirePayment, settlePaymentWithFallback, encodePaymentResponseHeader, runBuybackForRequest } = await getV2Payment();
import { resolveTickerFromCoingecko } from "../utils/coingeckoAPI.js";

const CACHE_TTL_MS = 90 * 1000;
const sentimentCache = new Map();

function getCacheKey(ticker) {
  return String(ticker || "general").trim().toLowerCase() || "general";
}

function getCached(ticker) {
  const key = getCacheKey(ticker);
  const entry = sentimentCache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

function setCached(ticker, data) {
  sentimentCache.set(getCacheKey(ticker), {
    data,
    expires: Date.now() + CACHE_TTL_MS,
  });
}

export async function createSentimentRouter() {
  const router = express.Router();

  const fetchGeneralSentimentAnalysis = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/stat?&section=general&date=last30days&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchAllTickerSentimentAnalysis = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/stat?&section=alltickers&date=last30days&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchTickerSentimentAnalysis = async (ticker) => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/stat?tickers=${ticker}&date=last30days&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  async function getDataForTicker(ticker) {
    let cached = getCached(ticker);
    if (cached !== null) return cached;
    let result;
    if (ticker !== "general") {
      const tickerSentimentAnalysis = await fetchTickerSentimentAnalysis(ticker);
      result = Object.keys(tickerSentimentAnalysis).map((date) => ({
        date,
        ticker: tickerSentimentAnalysis[date],
      }));
    } else {
      const [generalSentimentAnalysis, allTickerSentimentAnalysis] = await Promise.all([
        fetchGeneralSentimentAnalysis(),
        fetchAllTickerSentimentAnalysis(),
      ]);
      result = Object.keys(generalSentimentAnalysis).map((date) => ({
        date,
        general: generalSentimentAnalysis[date],
        allTicker: allTickerSentimentAnalysis[date],
      }));
    }
    if (Array.isArray(result) && result.length > 0) setCached(ticker, result);
    return result;
  }

  function setPaymentResponseAndSend(res, data, settle) {
    const reason = settle?.errorReason || "";
    const isFacilitatorFailure = /Facilitator|500|Internal server error/i.test(reason);
    if (!settle?.success && !isFacilitatorFailure) throw new Error(reason || "Settlement failed");
    const effectiveSettle = settle?.success ? settle : { success: true };
    res.setHeader("Payment-Response", encodePaymentResponseHeader(effectiveSettle));
    res.json({ sentimentAnalysis: data });
  }

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      let ticker = req.query.ticker || "general";
      if (ticker !== "general" && ticker) {
        const resolved = await resolveTickerFromCoingecko(ticker);
        ticker = resolved ? resolved.symbol.toUpperCase() : "general";
      }
      const sentimentAnalysis = await getDataForTicker(ticker);
      if (!sentimentAnalysis) return res.status(404).json({ error: "Sentiment analysis not found" });
      if (sentimentAnalysis.length === 0) return res.status(500).json({ error: "Failed to fetch sentiment analysis" });
      res.json({ sentimentAnalysis });
    });
  }

  router.get(
    "/",
    requirePayment({
      description: "Get market sentiment analysis for crypto assets over last 30 days",
      method: "GET",
      discoverable: true,
      resource: "/sentiment",
      inputSchema: {
        queryParams: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for market-wide sentiment",
          },
        },
      },
      outputSchema: {
        sentimentAnalysis: {
          type: "array",
          description: "Array of daily sentiment scores with positive, negative, and neutral percentages",
        },
      },
    }),
    async (req, res) => {
      let ticker = req.query.ticker || "general";
      if (ticker !== "general" && ticker) {
        const resolved = await resolveTickerFromCoingecko(ticker);
        ticker = resolved ? resolved.symbol.toUpperCase() : "general";
      }
      const { payload, accepted } = req.x402Payment;
      const [sentimentAnalysis, settle] = await Promise.all([
        getDataForTicker(ticker),
        settlePaymentWithFallback(payload, accepted),
      ]);
      if (!sentimentAnalysis) return res.status(404).json({ error: "Sentiment analysis not found" });
      if (sentimentAnalysis.length === 0) return res.status(500).json({ error: "Failed to fetch sentiment analysis" });
      setPaymentResponseAndSend(res, sentimentAnalysis, settle);
      runBuybackForRequest(req);
    }
  );

  router.post(
    "/",
    requirePayment({
      description: "Get market sentiment analysis for crypto assets over last 30 days",
      method: "POST",
      discoverable: true,
      resource: "/sentiment",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for market-wide sentiment",
          },
        },
      },
      outputSchema: {
        sentimentAnalysis: {
          type: "array",
          description: "Array of daily sentiment scores with positive, negative, and neutral percentages",
        },
      },
    }),
    async (req, res) => {
      let ticker = req.body.ticker || "general";
      if (ticker !== "general" && ticker) {
        const resolved = await resolveTickerFromCoingecko(ticker);
        ticker = resolved ? resolved.symbol.toUpperCase() : "general";
      }
      const { payload, accepted } = req.x402Payment;
      const [sentimentAnalysis, settle] = await Promise.all([
        getDataForTicker(ticker),
        settlePaymentWithFallback(payload, accepted),
      ]);
      if (!sentimentAnalysis) return res.status(404).json({ error: "Sentiment analysis not found" });
      if (sentimentAnalysis.length === 0) return res.status(500).json({ error: "Failed to fetch sentiment analysis" });
      setPaymentResponseAndSend(res, sentimentAnalysis, settle);
      runBuybackForRequest(req);
    }
  );

  return router;
}

/** Regular (no x402) sentiment router for landing/dashboard – same data, no payment. */
export async function createSentimentRouterRegular() {
  const router = express.Router();

  const fetchGeneralSentimentAnalysis = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/stat?&section=general&date=last30days&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchAllTickerSentimentAnalysis = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/stat?&section=alltickers&date=last30days&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchTickerSentimentAnalysis = async (ticker) => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/stat?tickers=${ticker}&date=last30days&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  const handleGet = async (req, res) => {
    const ticker = req.query.ticker || "general";
    let result;
    if (ticker !== "general") {
      const tickerSentimentAnalysis = await fetchTickerSentimentAnalysis(ticker);
      result = Object.keys(tickerSentimentAnalysis).map((date) => ({
        date,
        ticker: tickerSentimentAnalysis[date],
      }));
    } else {
      const generalSentimentAnalysis = await fetchGeneralSentimentAnalysis();
      const allTickerSentimentAnalysis = await fetchAllTickerSentimentAnalysis();
      result = Object.keys(generalSentimentAnalysis).map((date) => ({
        date,
        general: generalSentimentAnalysis[date],
        allTicker: allTickerSentimentAnalysis[date],
      }));
    }
    const sentimentAnalysis = result;
    if (!sentimentAnalysis) return res.status(404).json({ error: "Sentiment analysis not found" });
    if (sentimentAnalysis?.length > 0) res.json({ sentiment: { data: buildSentimentData(result), total: buildSentimentTotal(result) }, sentimentAnalysis });
    else res.status(500).json({ error: "Failed to fetch sentiment analysis" });
  };

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

  router.get("/", handleGet);
  return router;
}
