import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_CHECK_STATUS_USD } from "../../config/x402Pricing.js";

const { requirePayment, settlePaymentWithFallback, encodePaymentResponseHeader } = await getV2Payment();

const statusPayload = { status: "ok", message: "Check status server is running" };

export async function createCheckStatusRouter() {
  const router = express.Router();

  const paymentOptions = {
    price: X402_API_PRICE_CHECK_STATUS_USD,
    description: "Health check endpoint to verify API server status and connectivity",
    discoverable: true,
    resource: "/v2/check-status",
    outputSchema: {
      status: { type: "string", description: "Server status (ok or error)" },
      message: { type: "string", description: "Status message" },
    },
  };

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", (_req, res) => res.status(200).json(statusPayload));
  }

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({ ...paymentOptions, method: "GET" }),
    async (req, res) => {
      const { payload, accepted } = req.x402Payment;
      const settle = await settlePaymentWithFallback(payload, accepted);
      res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
      res.status(200).json(statusPayload);
    }
  );

  // POST endpoint
  router.post(
    "/",
    requirePayment({ ...paymentOptions, method: "POST" }),
    async (req, res) => {
      const { payload, accepted } = req.x402Payment;
      const settle = await settlePaymentWithFallback(payload, accepted);
      res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
      res.status(200).json(statusPayload);
    }
  );

  return router;
}
