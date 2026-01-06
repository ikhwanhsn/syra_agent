import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";
import { saveToLeaderboard } from "../scripts/saveToLeaderboard.js";

export async function createSignalRouter() {
  const router = express.Router();

  // Fixed price for all users
  const FIXED_PRICE = "0.15";

  // GET Route Example
  router.get(
    "/",
    (req, res, next) =>
      requirePayment({
        price: FIXED_PRICE,
        description: "Get signal information for a specific token",
        method: "GET",
        discoverable: true, // Make it discoverable on x402scan
        resource: "/signal",
        inputSchema: {
          queryParams: {
            token: {
              type: "string",
              required: false,
              description: "Token name for the signal",
            },
          },
        },
      })(req, res, next),
    async (req, res) => {
      try {
        const token = req.query.token || "solana";

        const signal = await fetch(
          `${process.env.N8N_WEBHOOK_URL_SIGNAL}?token=${token}`
        ).then((res) => res.json());

        if (signal) {
          const paymentResult = await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements
          );

          // Buyback and burn SYRA token (80% of revenue)
          let burnResult = null;
          try {
            // Use the fixed price (0.15 USD)
            const priceUSD = 0.15;

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
            volume: priceUSD,
          });

          res.json({ signal });
        } else {
          res.status(500).json({ error: "Failed to fetch signal" });
        }
      } catch (error) {
        console.error("Error GET:", error);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  // POST Route Example
  router.post(
    "/",
    (req, res, next) =>
      requirePayment({
        price: FIXED_PRICE,
        description: "Get signal information for a specific token",
        method: "POST",
        discoverable: true, // Make it discoverable on x402scan
        resource: "/signal",
        inputSchema: {
          bodyType: "json",
          bodyFields: {
            token: {
              type: "string",
              required: false,
              description: "Token name for the signal",
            },
          },
        },
      })(req, res, next),
    async (req, res) => {
      try {
        const { token } = req.body;

        const signal = await fetch(
          `${process.env.N8N_WEBHOOK_URL_SIGNAL}?token=${token || "bitcoin"}`
        ).then((res) => res.json());

        if (signal) {
          const paymentResult = await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements
          );

          // Buyback and burn SYRA token (80% of revenue)
          let burnResult = null;
          try {
            // Use the fixed price (0.15 USD)
            const priceUSD = 0.15;

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
            volume: priceUSD,
          });

          res.json({ signal });
        } else {
          res.status(500).json({ error: "Failed to fetch signal" });
        }
      } catch (error) {
        console.error("Error POST:", error);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  return router;
}
