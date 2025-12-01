import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { getSyraBalance } from "../scripts/getSyraBalance.js";

export async function createSignalRouter() {
  const router = express.Router();
  let price = "0.15";
  const syraBalance = await getSyraBalance();
  if (syraBalance > 0) {
    price = "0.05";
  }

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price,
      description: "Get signal information for a specific token",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      inputSchema: {
        queryParams: {
          token: {
            type: "string",
            required: false,
            description: "Token name for the signal",
          },
        },
      },
    }),
    async (req, res) => {
      const token = req.query.token || "solana";
      const signal = await fetch(
        `${process.env.N8N_WEBHOOK_URL_SIGNAL}?token=${token}`
      ).then((res) => res.json());

      if (signal) {
        // Settle payment ONLY on success
        await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        res.json({
          signal,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch signal",
        });
      }
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price,
      description: "Get signal information for a specific token",
      method: "POST",
      discoverable: true,
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
    }),
    async (req, res) => {
      const { token } = req.body;

      // Your search logic here
      const signal = await fetch(
        `${process.env.N8N_WEBHOOK_URL_SIGNAL}?token=${token || "bitcoin"}`
      ).then((res) => res.json());

      if (signal) {
        // Settle payment ONLY on success
        await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        res.json({
          signal,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch signal",
        });
      }
    }
  );

  return router;
}
