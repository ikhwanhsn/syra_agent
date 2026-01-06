// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";
import { saveToLeaderboard } from "../scripts/saveToLeaderboard.js";

export async function createNewsRouter() {
  const router = express.Router();
  const PRICE_USD = 0.1;

  const fetchGeneralNews = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/category?section=general&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchAllTickerNews = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/category?section=alltickers&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchTickerNews = async (ticker) => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1?tickers=${ticker}&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchTickerNewsAdvance = async (ticker) => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1?tickers-only=${ticker}&items=100&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  // Apply middleware to routes
  router.get(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "News information service",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/news",
      inputSchema: {
        queryParams: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker name for the news",
          },
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
        await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = PRICE_USD;

          console.log(`Payment price: ${priceUSD} USD`);

          burnResult = await buybackAndBurnSYRA(priceUSD);
          console.log("Buyback and burn completed:", burnResult);
        } catch (burnError) {
          console.error("Buyback and burn failed:", burnError);
          // Continue even if burn fails - payment was successful
        }

        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: PRICE_USD,
        });

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
    }
  );

  router.post(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "News information service",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/news",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker name for the news",
          },
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
          req.x402Payment.paymentRequirements
        );
        console.log("Payment result:", paymentResult);

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = PRICE_USD;

          console.log(`Payment price: ${priceUSD} USD`);

          burnResult = await buybackAndBurnSYRA(priceUSD);
          console.log("Buyback and burn completed:", burnResult);
        } catch (burnError) {
          console.error("Buyback and burn failed:", burnError);
          // Continue even if burn fails - payment was successful
        }

        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: PRICE_USD,
        });

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
    }
  );

  return router;
}
