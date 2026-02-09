// routes/trending-headline.js – cache + parallel settle for fast response
import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_USD } from "../../config/x402Pricing.js";

const { requirePayment, settlePaymentWithFallback, encodePaymentResponseHeader } = await getV2Payment();
import { resolveTickerFromCoingecko } from "../../utils/coingeckoAPI.js";

const CACHE_TTL_MS = 90 * 1000;
const trendingCache = new Map();

function getCacheKey(ticker) {
  return String(ticker || "general").trim().toLowerCase() || "general";
}

function getCached(ticker) {
  const key = getCacheKey(ticker);
  const entry = trendingCache.get(key);
  if (!entry || Date.now() > entry.expires) return null;
  return entry.data;
}

function setCached(ticker, data) {
  trendingCache.set(getCacheKey(ticker), { data, expires: Date.now() + CACHE_TTL_MS });
}

export async function createTrendingHeadlineRouter() {
  const router = express.Router();

  const fetchGeneralTrendingHeadline = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/trending-headlines?&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchTickerTrendingHeadline = async (ticker) => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/trending-headlines?&page=1&ticker=${ticker}&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  async function getDataForTicker(ticker) {
    let cached = getCached(ticker);
    if (cached !== null) return cached;
    const result =
      ticker !== "general"
        ? await fetchTickerTrendingHeadline(ticker)
        : await fetchGeneralTrendingHeadline();
    if (Array.isArray(result) && result.length > 0) setCached(ticker, result);
    return result;
  }

  function setPaymentResponseAndSend(res, data, settle) {
    const reason = settle?.errorReason || "";
    const isFacilitatorFailure = /Facilitator|500|Internal server error/i.test(reason);
    if (!settle?.success && !isFacilitatorFailure) throw new Error(reason || "Settlement failed");
    const effectiveSettle = settle?.success ? settle : { success: true };
    res.setHeader("Payment-Response", encodePaymentResponseHeader(effectiveSettle));
    res.json({ trendingHeadline: data });
  }

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      let ticker = req.query.ticker || "general";
      if (ticker !== "general" && ticker) {
        const resolved = await resolveTickerFromCoingecko(ticker);
        ticker = resolved ? resolved.symbol.toUpperCase() : "general";
      }
      const trendingHeadline = await getDataForTicker(ticker);
      if (!trendingHeadline) return res.status(404).json({ error: "Trending headline not found" });
      if (trendingHeadline.length === 0) return res.status(500).json({ error: "Failed to fetch trending headline" });
      res.json({ trendingHeadline });
    });
  }

  router.get(
    "/",
    requirePayment({
      description: "Get trending headlines and top stories in the crypto market",
      method: "GET",
      discoverable: true,
      resource: "/v2/trending-headline",
      inputSchema: {
        queryParams: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for all trending headlines",
          },
        },
      },
      outputSchema: {
        trendingHeadline: {
          type: "array",
          description: "Array of trending headlines with title, source, date, and sentiment",
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
      const [trendingHeadline, settle] = await Promise.all([
        getDataForTicker(ticker),
        settlePaymentWithFallback(payload, accepted),
      ]);
      if (!trendingHeadline) return res.status(404).json({ error: "Trending headline not found" });
      if (trendingHeadline.length === 0) return res.status(500).json({ error: "Failed to fetch trending headline" });
      setPaymentResponseAndSend(res, trendingHeadline, settle);
    }
  );

  router.post(
    "/",
    requirePayment({
      description: "Get trending headlines and top stories in the crypto market",
      method: "POST",
      discoverable: true,
      resource: "/v2/trending-headline",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for all trending headlines",
          },
        },
      },
      outputSchema: {
        trendingHeadline: {
          type: "array",
          description: "Array of trending headlines with title, source, date, and sentiment",
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
      const [trendingHeadline, settle] = await Promise.all([
        getDataForTicker(ticker),
        settlePaymentWithFallback(payload, accepted),
      ]);
      if (!trendingHeadline) return res.status(404).json({ error: "Trending headline not found" });
      if (trendingHeadline.length === 0) return res.status(500).json({ error: "Failed to fetch trending headline" });
      setPaymentResponseAndSend(res, trendingHeadline, settle);
    }
  );

  return router;
}
