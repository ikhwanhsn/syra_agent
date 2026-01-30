import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { X402_API_PRICE_NEWS_USD } from "../../config/x402Pricing.js";
import { saveToLeaderboard } from "../../scripts/saveToLeaderboard.js";

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

  // GET endpoint with V2 x402 format
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_NEWS_USD,
      description: "Get latest crypto news and market updates",
      method: "GET",
      discoverable: true,
      resource: "/v2/news",
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
      if (!news) {
        return res.status(404).json({ error: "News not found" });
      }
      if (news?.length > 0) {
        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements,
        );

        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: X402_API_PRICE_NEWS_USD,
        });

        res.json({
          news,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch news",
        });
      }
    },
  );

  // POST endpoint with V2 x402 format
  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_NEWS_USD,
      description: "Get latest crypto news and market updates",
      method: "POST",
      discoverable: true,
      resource: "/v2/news",
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
      const ticker = req.body.ticker || "general";
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
      if (!news) {
        return res.status(404).json({ error: "News not found" });
      }
      if (news?.length > 0) {
        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements,
        );

        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: X402_API_PRICE_NEWS_USD,
        });

        res.json({
          news,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch news",
        });
      }
    },
  );

  return router;
}
