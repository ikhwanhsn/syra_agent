/**
 * v2 x402 API: Get cross-chain transaction status from Squid Router.
 * GET returns status for a given transactionId, requestId, fromChainId, toChainId, quoteId.
 * See: https://docs.squidrouter.com/api-and-sdk-integration/api
 */
import express from "express";
import axios from "axios";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_SQUID_STATUS_USD } from "../../../config/x402Pricing.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const SQUID_STATUS_URL = "https://v2.api.squidrouter.com/v2/status";

/** @param {{ transactionId: string; requestId: string; fromChainId: string; toChainId: string; quoteId?: string }} params */
async function fetchSquidStatus(params) {
  const integratorId = process.env.SQUID_INTEGRATOR_ID;
  if (!integratorId) {
    throw new Error("SQUID_INTEGRATOR_ID must be set for Squid Router integration");
  }
  const response = await axios.get(SQUID_STATUS_URL, {
    params: {
      transactionId: params.transactionId,
      requestId: params.requestId,
      fromChainId: params.fromChainId,
      toChainId: params.toChainId,
      ...(params.quoteId && { quoteId: params.quoteId }),
    },
    headers: { "x-integrator-id": integratorId },
    timeout: 10000,
    validateStatus: () => true,
  });
  if (response.status !== 200) {
    const msg = response.data?.message || response.data?.error || response.statusText || String(response.status);
    throw new Error(`Squid status failed: ${msg}`);
  }
  return response.data;
}

export async function createSquidStatusRouter() {
  const router = express.Router();

  const paymentOptions = {
    description: "Squid Router cross-chain transaction status",
    method: "GET",
    discoverable: true,
    resource: "/squid/status",
    price: X402_API_PRICE_SQUID_STATUS_USD,
    inputSchema: {
      type: "object",
      properties: {
        transactionId: { type: "string", description: "Source chain transaction hash" },
        requestId: { type: "string", description: "x-request-id from route response" },
        fromChainId: { type: "string", description: "Source chain ID" },
        toChainId: { type: "string", description: "Destination chain ID" },
        quoteId: { type: "string", description: "quoteId from route (required for Coral V2)" },
      },
      required: ["transactionId", "requestId", "fromChainId", "toChainId"],
      additionalProperties: true,
    },
  };

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      const { transactionId, requestId, fromChainId, toChainId, quoteId } = req.query;
      if (!transactionId || !requestId || !fromChainId || !toChainId) {
        return res.status(400).json({
          error: "Missing required query: transactionId, requestId, fromChainId, toChainId",
        });
      }
      try {
        const data = await fetchSquidStatus({
          transactionId: String(transactionId),
          requestId: String(requestId),
          fromChainId: String(fromChainId),
          toChainId: String(toChainId),
          quoteId: quoteId ? String(quoteId) : undefined,
        });
        res.status(200).json(data);
      } catch (e) {
        res.status(500).json({
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    });
  }

  router.get(
    "/",
    requirePayment(paymentOptions),
    async (req, res) => {
      const { transactionId, requestId, fromChainId, toChainId, quoteId } = req.query;
      if (!transactionId || !requestId || !fromChainId || !toChainId) {
        return res.status(400).json({
          error: "Missing required query: transactionId, requestId, fromChainId, toChainId",
        });
      }
      try {
        const data = await fetchSquidStatus({
          transactionId: String(transactionId),
          requestId: String(requestId),
          fromChainId: String(fromChainId),
          toChainId: String(toChainId),
          quoteId: quoteId ? String(quoteId) : undefined,
        });
        await settlePaymentAndSetResponse(res, req);
        res.status(200).json(data);
      } catch (e) {
        res.status(500).json({
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }
  );

  return router;
}
