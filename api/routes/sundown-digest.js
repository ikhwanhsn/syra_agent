// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";
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
