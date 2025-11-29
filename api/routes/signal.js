import express from "express";
import { requirePayment } from "../utils/x402Payment.js";

export async function createSignalRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: "0.15",
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

      res.json({
        signal,
      });
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price: "0.15",
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

      res.json({
        signal,
      });
    }
  );

  return router;
}
