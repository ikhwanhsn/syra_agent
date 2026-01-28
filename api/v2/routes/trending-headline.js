// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment } from "../../utils/x402Payment.js";
import { saveToLeaderboard } from "../../scripts/saveToLeaderboard.js";

export async function createTrendingHeadlineRouter() {
  const router = express.Router();
  const PRICE_USD = 0.15;

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

  // Apply middleware to routes
  router.get(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "Get trending headlines and top stories in the crypto market (V2 API)",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/trending-headline",
      inputSchema: {
        queryParams: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for all trending headlines (V2 API)",
          },
        },
      },
      outputSchema: {
        trendingHeadline: {
          type: "array",
          description: "Array of trending headlines with title, source, date, and sentiment (V2 API)",
        },
      },
    }),
    async (req, res) => {
      const ticker = req.query.ticker || "general";
      let result;
      if (ticker !== "general") {
        const tickerTrendingHeadline = await fetchTickerTrendingHeadline(
          ticker
        );
        result = tickerTrendingHeadline;
      } else {
        const generalTrendingHeadline = await fetchGeneralTrendingHeadline();
        result = generalTrendingHeadline;
      }
      const trendingHeadline = result;
      if (!trendingHeadline) {
        return res.status(404).json({ error: "Trending headline not found" });
      }
      if (trendingHeadline?.length > 0) {
        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        // Save to leaderboard
        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: PRICE_USD,
        });

        res.json({
          trendingHeadline,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch trending headline",
        });
      }
    }
  );

  router.post(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "Get trending headlines and top stories in the crypto market (V2 API)",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/trending-headline",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for all trending headlines (V2 API)",
          },
        },
      },
      outputSchema: {
        trendingHeadline: {
          type: "array",
          description: "Array of trending headlines with title, source, date, and sentiment (V2 API)",
        },
      },
    }),
    async (req, res) => {
      const ticker = req.query.ticker || "general";
      let result;
      if (ticker !== "general") {
        const tickerTrendingHeadline = await fetchTickerTrendingHeadline(
          ticker
        );
        result = tickerTrendingHeadline;
      } else {
        const generalTrendingHeadline = await fetchGeneralTrendingHeadline();
        result = generalTrendingHeadline;
      }
      const trendingHeadline = result;
      if (!trendingHeadline) {
        return res.status(404).json({ error: "Trending headline not found" });
      }
      if (trendingHeadline?.length > 0) {
        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        // Save to leaderboard
        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: PRICE_USD,
        });

        res.json({
          trendingHeadline,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch trending headline",
        });
      }
    }
  );

  return router;
}
