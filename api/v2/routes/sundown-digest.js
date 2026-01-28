// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { saveToLeaderboard } from "../../scripts/saveToLeaderboard.js";

export async function createSundownDigestRouter() {
  const router = express.Router();
  const PRICE_USD = 0.15;

  const fetchSundownDigest = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/sundown-digest?page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
    );
    const data = await response.json();
    return data.data || [];
  };

  // Apply middleware to routes
  router.get(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "Daily end-of-day summary of key crypto market events and movements",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/sundown-digest",
      outputSchema: {
        sundownDigest: {
          type: "array",
          description: "Array of daily digest items with summary, key events, and market highlights",
        },
      },
    }),
    async (req, res) => {
      const result = await fetchSundownDigest();
      const sundownDigest = result;
      if (!sundownDigest) {
        return res.status(404).json({ error: "Sundown digest not found" });
      }
      if (sundownDigest?.length > 0) {
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
          sundownDigest,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch sundown digest",
        });
      }
    }
  );

  router.post(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "Daily end-of-day summary of key crypto market events and movements",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/sundown-digest",
      outputSchema: {
        sundownDigest: {
          type: "array",
          description: "Array of daily digest items with summary, key events, and market highlights",
        },
      },
    }),
    async (req, res) => {
      const result = await fetchSundownDigest();
      const sundownDigest = result;
      if (!sundownDigest) {
        return res.status(404).json({ error: "Sundown digest not found" });
      }
      if (sundownDigest?.length > 0) {
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
          sundownDigest,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch sundown digest",
        });
      }
    }
  );

  return router;
}
