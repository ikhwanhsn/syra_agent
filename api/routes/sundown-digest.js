// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";

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
      description: "Get the latest sundown digest in crypto market",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/sundown-digest",
    }),
    async (req, res) => {
      const result = await fetchSundownDigest();
      const sundownDigest = result;
      if (!sundownDigest) {
        return res.status(404).json({ error: "Sundown digest not found" });
      }
      if (sundownDigest?.length > 0) {
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
      description: "Get the latest sundown digest in crypto market",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/sundown-digest",
    }),
    async (req, res) => {
      const result = await fetchSundownDigest();
      const sundownDigest = result;
      if (!sundownDigest) {
        return res.status(404).json({ error: "Sundown digest not found" });
      }
      if (sundownDigest?.length > 0) {
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
