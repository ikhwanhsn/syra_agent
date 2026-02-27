import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

export async function createSignalRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      try {
        const token = req.query.token || "bitcoin";
        const signal = await fetch(
          `${process.env.N8N_WEBHOOK_URL_SIGNAL}?token=${token}`
        ).then((r) => r.json());
        if (signal) res.json({ signal });
        else res.status(500).json({ error: "Failed to fetch signal" });
      } catch (error) {
        res.status(500).json({ error: "Server error" });
      }
    });
  }

  // GET Route Example
  router.get(
    "/",
    (req, res, next) =>
      requirePayment({
        price: X402_API_PRICE_USD,
        description: "Get AI-generated trading signals with entry/exit recommendations",
        method: "GET",
        discoverable: true,
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
        const token = req.query.token || "bitcoin";

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
