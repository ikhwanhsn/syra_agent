import express from "express";
import { getX402Handler, requirePayment } from "../../utils/x402Payment.js";
import { buybackAndBurnSYRA } from "../../utils/buybackAndBurnSYRA.js";
import { dexscreenerRequests } from "../../request/dexscreener.request.js";

export async function createDexscreenerRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: "0.05",
      description:
        "Dexscreener all data (token profiles, community takeovers, ads, token boosts, token boosts top)",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/dexscreener",
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
        await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = 0.05;

          console.log(`Payment price: ${priceUSD} USD`);

          burnResult = await buybackAndBurnSYRA(priceUSD);
          console.log("Buyback and burn completed:", burnResult);
        } catch (burnError) {
          console.error("Buyback and burn failed:", burnError);
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
      price: "0.05",
      description:
        "Dexscreener all data (token profiles, community takeovers, ads, token boosts, token boosts top)",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/dexscreener",
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
        await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          // Use the price directly from requirePayment config (0.15 USD)
          const priceUSD = 0.05;

          console.log(`Payment price: ${priceUSD} USD`);

          burnResult = await buybackAndBurnSYRA(priceUSD);
          console.log("Buyback and burn completed:", burnResult);
        } catch (burnError) {
          console.error("Buyback and burn failed:", burnError);
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
