import express from "express";
import { requirePayment, settlePaymentAndRecord } from "../utils/x402Payment.js";
import { X402_API_PRICE_CHECK_STATUS_USD } from "../config/x402Pricing.js";

export async function createCheckStatusRouter() {
  const router = express.Router();

  const statusPayload = { status: "ok", message: "Check status server is running" };

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_CHECK_STATUS_USD,
      description: "Health check endpoint to verify API server status and connectivity",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/check-status",
      outputSchema: {
        status: {
          type: "string",
          description: "Server status (ok or error)",
        },
        message: {
          type: "string",
          description: "Status message",
        },
      },
    }),
    async (req, res) => {
      await settlePaymentAndRecord(req);
      res.status(200).json(statusPayload);
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_CHECK_STATUS_USD,
      description: "Health check endpoint to verify API server status and connectivity",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/check-status",
      outputSchema: {
        status: {
          type: "string",
          description: "Server status (ok or error)",
        },
        message: {
          type: "string",
          description: "Status message",
        },
      },
    }),
    async (req, res) => {
      await settlePaymentAndRecord(req);
      res.status(200).json(statusPayload);
    }
  );

  return router;
}
