// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";
import { saveToLeaderboard } from "../scripts/saveToLeaderboard.js";

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

  // Apply middleware to routes
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Get trending headlines and top stories in the crypto market",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/trending-headline",
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

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = X402_API_PRICE_USD;

          console.log(`Payment price: ${priceUSD} USD`);

          burnResult = await buybackAndBurnSYRA(priceUSD);
          console.log("Buyback and burn completed:", burnResult);
        } catch (burnError) {
          console.error("Buyback and burn failed:", burnError);
          // Continue even if burn fails - payment was successful
        }

        // Save to leaderboard
        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: X402_API_PRICE_USD,
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
      price: X402_API_PRICE_USD,
      description: "Get trending headlines and top stories in the crypto market",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/trending-headline",
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

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = X402_API_PRICE_USD;

          console.log(`Payment price: ${priceUSD} USD`);

          burnResult = await buybackAndBurnSYRA(priceUSD);
          console.log("Buyback and burn completed:", burnResult);
        } catch (burnError) {
          console.error("Buyback and burn failed:", burnError);
          // Continue even if burn fails - payment was successful
        }

        // Save to leaderboard
        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: X402_API_PRICE_USD,
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
