/**
 * MPP (Machine Payments Protocol) test lane — Syra x402-compatible example.
 *
 * Same payment flow as /check-status (HTTP 402 + PAYMENT-SIGNATURE / x402 v2) so the
 * playground and wallets work today. Responses are tagged for MPP testing and discovery.
 *
 * @see https://docs.tempo.xyz/guide/payments/make-machine-payments
 * @see https://docs.stripe.com/payments/machine/x402 (machine payments ecosystem)
 */
import express from "express";
import { getV2Payment } from "../../utils/getV2Payment.js";
import { X402_API_PRICE_CHECK_STATUS_USD } from "../../config/x402Pricing.js";

const { requirePayment, settlePaymentWithFallback, encodePaymentResponseHeader, runBuybackForRequest } =
  await getV2Payment();

const statusPayload = {
  status: "ok",
  message: "MPP v1 test: Syra API is reachable (same settlement as x402 v2 check-status)",
  protocol: "mpp-test",
  paymentCompatibility: "x402-v2",
  reference: "Mirrors /check-status pricing and facilitator flow for playground testing.",
  x402Sibling: "/check-status",
};

export async function createMppV1Router() {
  const router = express.Router();

  const paymentOptions = {
    price: X402_API_PRICE_CHECK_STATUS_USD,
    description:
      "MPP v1 test — machine-payment style health check (x402 v2 compatible; use for Tempo/Stripe MPP client experiments)",
    discoverable: true,
    resource: "/mpp/v1/check-status",
    outputSchema: {
      status: { type: "string", description: "Server status" },
      message: { type: "string", description: "Human-readable message" },
      protocol: { type: "string", description: "mpp-test" },
      paymentCompatibility: { type: "string", description: "x402-v2" },
    },
  };

  if (process.env.NODE_ENV !== "production") {
    router.get("/check-status/dev", (_req, res) => {
      res.setHeader("X-Syra-Payment-Lane", "mpp-v1");
      res.status(200).json(statusPayload);
    });
  }

  router.get(
    "/check-status",
    requirePayment({ ...paymentOptions, method: "GET" }),
    async (req, res) => {
      const { payload, accepted } = req.x402Payment;
      const settle = await settlePaymentWithFallback(payload, accepted);
      res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
      res.setHeader("X-Syra-Payment-Lane", "mpp-v1");
      runBuybackForRequest(req);
      res.status(200).json(statusPayload);
    }
  );

  router.post(
    "/check-status",
    requirePayment({ ...paymentOptions, method: "POST" }),
    async (req, res) => {
      const { payload, accepted } = req.x402Payment;
      const settle = await settlePaymentWithFallback(payload, accepted);
      res.setHeader("Payment-Response", encodePaymentResponseHeader(settle?.success ? settle : { success: true }));
      res.setHeader("X-Syra-Payment-Lane", "mpp-v1");
      runBuybackForRequest(req);
      res.status(200).json(statusPayload);
    }
  );

  return router;
}
