import express from "express";
import { getX402Handler, requirePayment, settlePaymentAndRecord } from "../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";
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
        discoverable: true, // Make it discoverable on x402scan
        resource: "/signal",
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
          await settlePaymentAndRecord(req);

          // Buyback and burn SYRA token (80% of revenue)
          let burnResult = null;
          try {
            // Use the global x402 API price
            const priceUSD = X402_API_PRICE_USD;

            burnResult = await buybackAndBurnSYRA(priceUSD);
          } catch (burnError) {
            // Continue even if burn fails - payment was successful
          }

          res.json({ signal });
        } else {
          res.status(500).json({ error: "Failed to fetch signal" });
        }
      } catch (error) {
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
        discoverable: true, // Make it discoverable on x402scan
        resource: "/signal",
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
          await settlePaymentAndRecord(req);

          // Buyback and burn SYRA token (80% of revenue)
          let burnResult = null;
          try {
            // Use the global x402 API price
            const priceUSD = X402_API_PRICE_USD;

            burnResult = await buybackAndBurnSYRA(priceUSD);
          } catch (burnError) {
            // Continue even if burn fails - payment was successful
          }

          res.json({ signal });
        } else {
          res.status(500).json({ error: "Failed to fetch signal" });
        }
      } catch (error) {
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  return router;
}

/** Regular (no x402) signal router for landing/dashboard – same data, no payment. */
export async function createSignalRouterRegular() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const token = req.query.token || "solana";
      const signal = await fetch(
        `${process.env.N8N_WEBHOOK_URL_SIGNAL}?token=${token}`
      ).then((r) => r.json());
      if (signal) res.json({ signal, token });
      else res.status(500).json({ error: "Failed to fetch signal" });
    } catch (error) {
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}
