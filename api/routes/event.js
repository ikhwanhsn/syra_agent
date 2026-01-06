// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";
import { saveToLeaderboard } from "../scripts/saveToLeaderboard.js";

export async function createEventRouter() {
  const router = express.Router();
  const PRICE_USD = 0.15;

  const fetchGeneralEvent = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/events?&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  const fetchTickerEvent = async (ticker) => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/events?&tickers=${ticker}&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  // Apply middleware to routes
  router.get(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "Get the latest event in crypto market",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/event",
      inputSchema: {
        queryParams: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker name for the event",
          },
        },
      },
    }),
    async (req, res) => {
      const ticker = req.query.ticker || "general";
      let result;
      if (ticker !== "general") {
        const tickerEvent = await fetchTickerEvent(ticker);
        result = Object.keys(tickerEvent).map((date) => ({
          date,
          ticker: tickerEvent[date],
        }));
      } else {
        const generalEvent = await fetchGeneralEvent();
        result = Object.keys(generalEvent).map((date) => ({
          date,
          general: generalEvent[date],
        }));
      }
      const event = result;
      if (!event) {
        return res.status(404).json({ error: "Sentiment analysis not found" });
      }
      if (event?.length > 0) {
        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
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

        // Save to leaderboard
        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: PRICE_USD,
        });

        res.json({
          event,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch event",
        });
      }
    }
  );

  router.post(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "Get the latest event in crypto market",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/event",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker name for the event",
          },
        },
      },
    }),
    async (req, res) => {
      const ticker = req.body.ticker || "general";
      let result;
      if (ticker !== "general") {
        const tickerEvent = await fetchTickerEvent(ticker);
        result = Object.keys(tickerEvent).map((date) => ({
          date,
          ticker: tickerEvent[date],
        }));
      } else {
        const generalEvent = await fetchGeneralEvent();
        result = Object.keys(generalEvent).map((date) => ({
          date,
          general: generalEvent[date],
        }));
      }
      const event = result;
      if (!event) {
        return res.status(404).json({ error: "Sentiment analysis not found" });
      }
      if (event?.length > 0) {
        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
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

        // Save to leaderboard
        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: PRICE_USD,
        });

        res.json({
          event,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch event",
        });
      }
    }
  );

  return router;
}
