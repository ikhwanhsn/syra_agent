import express from "express";
import { getResourceDescription } from "../config/x402ResourceCatalog.js";
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
 * Settle then return health payload. Payload is sync/cheap; settle uses the
 * shared facilitator fail-fast timeouts from x402PaymentV2.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {'GET' | 'POST'} method
 */
async function handleHealthRoute(req, res, method) {
  try {
    const settle = await settleSapEscrowOrFacilitator(
      res,
      req,
      JSON.stringify({ resource: "/health", method })
    );
    if (settle?.success === false) {
      return res.status(502).json({
        success: false,
        error: settle.errorReason || settle.error || "Payment settlement failed",
      });
    }
    return res.status(200).json(buildHealthPayload());
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return res.status(502).json({ success: false, error: msg });
  }
}

/**
 * x402 v2: GET/POST /health — paid liveness probe (replaces legacy /check-status; redirect 308 to /health).
 */
export async function createHealthRouter() {
  const router = express.Router();

  const paymentOptions = {
    price: X402_API_PRICE_CHECK_STATUS_USD,
    description: getResourceDescription("health"),
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

  router.get("/", payGet, async (req, res) => handleHealthRoute(req, res, "GET"));
  router.post("/", payPost, async (req, res) => handleHealthRoute(req, res, "POST"));

  return router;
}
