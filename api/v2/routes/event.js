// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../../config/x402Pricing.js";
import { saveToLeaderboard } from "../../scripts/saveToLeaderboard.js";

export async function createEventRouter() {
  const router = express.Router();

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
      description: "Get upcoming and recent crypto events, conferences, and launches",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/event",
      inputSchema: {
        queryParams: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for all events",
          },
        },
      },
      outputSchema: {
        event: {
          type: "array",
          description: "Array of crypto events with date, title, description, and related tokens",
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

        // Save to leaderboard
        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: X402_API_PRICE_USD,
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
      description: "Get upcoming and recent crypto events, conferences, and launches",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/event",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          ticker: {
            type: "string",
            required: false,
            description: "Ticker symbol (e.g., BTC, ETH) or 'general' for all events",
          },
        },
      },
      outputSchema: {
        event: {
          type: "array",
          description: "Array of crypto events with date, title, description, and related tokens",
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

        // Save to leaderboard
        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: X402_API_PRICE_USD,
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
