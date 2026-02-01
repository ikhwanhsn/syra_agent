import express from "express";
import {
  requirePayment,
  settlePaymentAndSetResponse,
} from "../utils/x402Payment.js";
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
          await settlePaymentAndSetResponse(res, req);
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
        const token = req.body?.token || "bitcoin";
        const signal = await fetch(
          `${process.env.N8N_WEBHOOK_URL_SIGNAL}?token=${token}`
        ).then((r) => r.json());
        if (!signal) {
          return res.status(500).json({ error: "Failed to fetch signal" });
        }
        await settlePaymentAndSetResponse(res, req);
        res.json({ signal });
      } catch (error) {
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  return router;
}
