import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_CHECK_STATUS_USD } from "../config/x402Pricing.js";
import {
  requirePaymentSapEscrowOrExact,
  settleSapEscrowOrFacilitator,
} from "../utils/sapEscrowPayment.js";

const { requirePayment } = await getV2Payment();

const statusPayload = { status: "ok", message: "Check status server is running" };

export async function createCheckStatusRouter() {
  const router = express.Router();

  const paymentOptions = {
    price: X402_API_PRICE_CHECK_STATUS_USD,
    description: "Health check endpoint to verify API server status and connectivity",
    discoverable: true,
    resource: "/check-status",
    outputSchema: {
      status: { type: "string", description: "Server status (ok or error)" },
      message: { type: "string", description: "Status message" },
    },
  };

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", (_req, res) => res.status(200).json(statusPayload));
  }

  const payGet = requirePaymentSapEscrowOrExact(requirePayment, { ...paymentOptions, method: "GET" });
  const payPost = requirePaymentSapEscrowOrExact(requirePayment, { ...paymentOptions, method: "POST" });

  router.get("/", payGet, async (req, res) => {
    await settleSapEscrowOrFacilitator(
      res,
      req,
      JSON.stringify({ resource: "/check-status", method: "GET" })
    );
    res.status(200).json(statusPayload);
  });

  router.post("/", payPost, async (req, res) => {
    await settleSapEscrowOrFacilitator(
      res,
      req,
      JSON.stringify({ resource: "/check-status", method: "POST" })
    );
    res.status(200).json(statusPayload);
  });

  return router;
}
