import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { saveToLeaderboard } from "../../scripts/saveToLeaderboard.js";

import { X402_API_PRICE_USD } from "../../config/x402Pricing.js";

export async function createSignalRouter() {
  const router = express.Router();

  // GET Route Example
  router.get(
    "/",
    (req, res, next) =>
      requirePayment({
        price: X402_API_PRICE_USD,
        description: "Get AI-generated trading signals with entry/exit recommendations",
        method: "GET",
        discoverable: true,
        resource: "/v2/signal",
        inputSchema: {
          queryParams: {
            token: {
              type: "string",
              required: false,
              description: "Token name for the signal (e.g., solana, bitcoin)",
            },
          },
        },
        outputSchema: {
          signal: {
            type: "object",
            description: "Trading signal with recommendation, entry price, targets, and analysis",
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
        price: X402_API_PRICE_USD,
        description: "Get AI-generated trading signals with entry/exit recommendations",
        method: "POST",
        discoverable: true,
        resource: "/v2/signal",
        inputSchema: {
          bodyType: "json",
          bodyFields: {
            token: {
              type: "string",
              required: false,
              description: "Token name for the signal (e.g., solana, bitcoin)",
            },
          },
        },
        outputSchema: {
          signal: {
            type: "object",
            description: "Trading signal with recommendation, entry price, targets, and analysis",
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
