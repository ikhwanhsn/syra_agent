import express from "express";
import { getX402Handler, requirePayment } from "../../utils/x402Payment.js";
import { X402_API_PRICE_DEXSCREENER_USD } from "../../config/x402Pricing.js";
import { buybackAndBurnSYRA } from "../../utils/buybackAndBurnSYRA.js";
import { dexscreenerRequests } from "../../request/dexscreener.request.js";
export async function createDexscreenerRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_DEXSCREENER_USD,
      description: "DEXScreener aggregated data: token profiles, community takeovers, ads, and boosted tokens",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/dexscreener",
      outputSchema: {
        "dexscreener/token-profiles": {
          type: "array",
          description: "Latest token profiles on DEXScreener",
        },
        "dexscreener/community-takeovers": {
          type: "array",
          description: "Community takeover listings",
        },
        "dexscreener/ads": {
          type: "array",
          description: "Current advertisement listings",
        },
        "dexscreener/token-boosts": {
          type: "array",
          description: "Boosted token listings",
        },
        "dexscreener/token-boosts-top": {
          type: "array",
          description: "Top boosted tokens",
        },
      },
    }),
    async (req, res) => {
      try {
        const responses = await Promise.all(
          dexscreenerRequests.map(({ url }) => fetch(url))
        );

        for (const response of responses) {
          if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(
              `HTTP ${response.status} ${response.statusText} ${text}`
            );
          }
        }

        const allData = await Promise.all(
          responses.map((response) => response.json())
        );

        const data = {
          "dexscreener/token-profiles": allData[0],
          "dexscreener/community-takeovers": allData[1],
          "dexscreener/ads": allData[2],
          "dexscreener/token-boosts": allData[3],
          "dexscreener/token-boosts-top": allData[4],
        };

        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = X402_API_PRICE_DEXSCREENER_USD;

            burnResult = await buybackAndBurnSYRA(priceUSD);
          } catch (burnError) {
          // Continue even if burn fails - payment was successful
        }

        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_DEXSCREENER_USD,
      description: "DEXScreener aggregated data: token profiles, community takeovers, ads, and boosted tokens",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/dexscreener",
      outputSchema: {
        "dexscreener/token-profiles": {
          type: "array",
          description: "Latest token profiles on DEXScreener",
        },
        "dexscreener/community-takeovers": {
          type: "array",
          description: "Community takeover listings",
        },
        "dexscreener/ads": {
          type: "array",
          description: "Current advertisement listings",
        },
        "dexscreener/token-boosts": {
          type: "array",
          description: "Boosted token listings",
        },
        "dexscreener/token-boosts-top": {
          type: "array",
          description: "Top boosted tokens",
        },
      },
    }),
    async (req, res) => {
      try {
        const responses = await Promise.all(
          dexscreenerRequests.map(({ url }) => fetch(url))
        );

        for (const response of responses) {
          if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(
              `HTTP ${response.status} ${response.statusText} ${text}`
            );
          }
        }

        const allData = await Promise.all(
          responses.map((response) => response.json())
        );

        const data = {
          "dexscreener/token-profiles": allData[0],
          "dexscreener/community-takeovers": allData[1],
          "dexscreener/ads": allData[2],
          "dexscreener/token-boosts": allData[3],
          "dexscreener/token-boosts-top": allData[4],
        };

        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = X402_API_PRICE_DEXSCREENER_USD;

            burnResult = await buybackAndBurnSYRA(priceUSD);
          } catch (burnError) {
          // Continue even if burn fails - payment was successful
        }

        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  return router;
}
