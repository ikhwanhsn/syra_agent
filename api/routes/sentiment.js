// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment, settlePaymentAndRecord } from "../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";
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

  // Apply middleware to routes
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Get market sentiment analysis for crypto assets over last 30 days",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
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
      const ticker = req.query.ticker || "general";
      let result;
      if (ticker !== "general") {
        const tickerSentimentAnalysis = await fetchTickerSentimentAnalysis(
          ticker
        );
        result = Object.keys(tickerSentimentAnalysis).map((date) => ({
          date,
          ticker: tickerSentimentAnalysis[date],
        }));
      } else {
        const generalSentimentAnalysis = await fetchGeneralSentimentAnalysis();
        const allTickerSentimentAnalysis =
          await fetchAllTickerSentimentAnalysis();
        result = Object.keys(generalSentimentAnalysis).map((date) => ({
          date,
          general: generalSentimentAnalysis[date],
          allTicker: allTickerSentimentAnalysis[date],
        }));
      }
      const sentimentAnalysis = result;
      if (!sentimentAnalysis) {
        return res.status(404).json({ error: "Sentiment analysis not found" });
      }
      if (sentimentAnalysis?.length > 0) {
        // Settle payment ONLY on success
        await settlePaymentAndRecord(req);

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = X402_API_PRICE_USD;

          burnResult = await buybackAndBurnSYRA(priceUSD);
        } catch (burnError) {
          // Continue even if burn fails - payment was successful
        }

        res.json({
          sentimentAnalysis,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch sentiment analysis",
        });
      }
    }
  );

  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Get market sentiment analysis for crypto assets over last 30 days",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
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
      const ticker = req.body.ticker || "general";
      let result;
      if (ticker !== "general") {
        const tickerSentimentAnalysis = await fetchTickerSentimentAnalysis(
          ticker
        );
        result = Object.keys(tickerSentimentAnalysis).map((date) => ({
          date,
          ticker: tickerSentimentAnalysis[date],
        }));
      } else {
        const generalSentimentAnalysis = await fetchGeneralSentimentAnalysis();
        const allTickerSentimentAnalysis =
          await fetchAllTickerSentimentAnalysis();
        result = Object.keys(generalSentimentAnalysis).map((date) => ({
          date,
          general: generalSentimentAnalysis[date],
          allTicker: allTickerSentimentAnalysis[date],
        }));
      }
      const sentimentAnalysis = result;
      if (!sentimentAnalysis) {
        return res.status(404).json({ error: "Sentiment analysis not found" });
      }
      if (sentimentAnalysis?.length > 0) {
        // Settle payment ONLY on success
        await settlePaymentAndRecord(req);

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = X402_API_PRICE_USD;

          burnResult = await buybackAndBurnSYRA(priceUSD);
        } catch (burnError) {
          // Continue even if burn fails - payment was successful
        }

        res.json({
          sentimentAnalysis,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch sentiment analysis",
        });
      }
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
