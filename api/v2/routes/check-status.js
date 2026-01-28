import express from "express";
import { requirePayment } from "../../utils/x402Payment.js";

export async function createCheckStatusRouter() {
  const router = express.Router();
  const PRICE_USD = 0.0001;

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "Health check endpoint to verify API server status and connectivity (V2 API)",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/check-status",
      outputSchema: {
        status: {
          type: "string",
          description: "Server status (ok or error) (V2 API)",
        },
        message: {
          type: "string",
          description: "Status message (V2 API)",
        },
      },
    }),
    async (req, res) => {
      res.status(200).json({
        status: "ok",
        message: "Check status server is running",
      });
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "Health check endpoint to verify API server status and connectivity (V2 API)",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/check-status",
      outputSchema: {
        status: {
          type: "string",
          description: "Server status (ok or error) (V2 API)",
        },
        message: {
          type: "string",
          description: "Status message (V2 API)",
        },
      },
    }),
    async (req, res) => {
      res.status(200).json({
        status: "ok",
        message: "Check status server is running",
      });
    }
  );

  return router;
}
