import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";
import { X402_API_PRICE_CHECK_STATUS_USD } from "../config/x402Pricing.js";
import {
  requirePaymentSapEscrowOrExact,
  settleSapEscrowOrFacilitator,
} from "../utils/sapEscrowPayment.js";

const { requirePayment } = await getV2Payment();

function buildHealthPayload() {
  return {
    ok: true,
    status: "healthy",
    service: "syra-api",
    message: "API is operational and accepting requests.",
    timestamp: new Date().toISOString(),
  };
}

/**
 * x402 v2: GET/POST /health — paid liveness probe (replaces legacy /check-status; redirect 308 to /health).
 */
export async function createHealthRouter() {
  const router = express.Router();

  const paymentOptions = {
    price: X402_API_PRICE_CHECK_STATUS_USD,
    description: "API health: verify server status and connectivity (x402)",
    discoverable: true,
    resource: "/health",
    outputSchema: {
      ok: { type: "boolean", description: "Request succeeded" },
      status: { type: "string", description: "health: healthy or degraded" },
      service: { type: "string", description: "Service id" },
      message: { type: "string", description: "Human-readable summary" },
      timestamp: { type: "string", description: "ISO-8601 response time" },
    },
  };

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", (_req, res) => res.status(200).json(buildHealthPayload()));
  }

  const payGet = requirePaymentSapEscrowOrExact(requirePayment, { ...paymentOptions, method: "GET" });
  const payPost = requirePaymentSapEscrowOrExact(requirePayment, { ...paymentOptions, method: "POST" });

  router.get("/", payGet, async (req, res) => {
    await settleSapEscrowOrFacilitator(
      res,
      req,
      JSON.stringify({ resource: "/health", method: "GET" })
    );
    res.status(200).json(buildHealthPayload());
  });

  router.post("/", payPost, async (req, res) => {
    await settleSapEscrowOrFacilitator(
      res,
      req,
      JSON.stringify({ resource: "/health", method: "POST" })
    );
    res.status(200).json(buildHealthPayload());
  });

  return router;
}
