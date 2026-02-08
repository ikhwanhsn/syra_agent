// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment, settlePaymentAndRecord } from "../utils/x402Payment.js";
import { X402_API_PRICE_NEWS_USD } from "../config/x402Pricing.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";
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

  // Apply middleware to routes
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_NEWS_USD,
      description: "Get latest crypto news and market updates",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/news",
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
        await settlePaymentAndRecord(req);

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = X402_API_PRICE_NEWS_USD;

          burnResult = await buybackAndBurnSYRA(priceUSD);
        } catch (burnError) {
          // Continue even if burn fails - payment was successful
        }

        res.json({
          news,
          // tokenBuyback: burnResult
          //   ? {
          //       swapTransaction: burnResult.swapSignature,
          //       burnTransaction: burnResult.burnSignature,
          //       amountBurned: burnResult.amountBurned,
          //     }
          //   : null,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch news",
        });
      }
    },
  );

  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_NEWS_USD,
      description: "Get latest crypto news and market updates",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/news",
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
        await settlePaymentAndRecord(req);

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = X402_API_PRICE_NEWS_USD;

          burnResult = await buybackAndBurnSYRA(priceUSD);
        } catch (burnError) {
          // Continue even if burn fails - payment was successful
        }

        res.json({
          news,
          // paymentResult,
          // tokenBuyback: burnResult
          //   ? {
          //       swapTransaction: burnResult.swapSignature,
          //       burnTransaction: burnResult.burnSignature,
          //       amountBurned: burnResult.amountBurned,
          //     }
          //   : null,
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
