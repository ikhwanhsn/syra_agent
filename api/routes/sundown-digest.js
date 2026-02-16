// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment, settlePaymentAndRecord } from "../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
export async function createSundownDigestRouter() {
  const router = express.Router();

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
      price: X402_API_PRICE_USD,
      description: "Daily end-of-day summary of key crypto market events and movements",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/sundown-digest",
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
        await settlePaymentAndRecord(req);
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
      price: X402_API_PRICE_USD,
      description: "Daily end-of-day summary of key crypto market events and movements",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/sundown-digest",
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
        await settlePaymentAndRecord(req);
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
