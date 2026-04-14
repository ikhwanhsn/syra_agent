/**
 * v2 x402 API: Get cross-chain route from Squid Router.
 * POST returns the optimal route and transactionRequest for the first leg (user signs on source chain).
 * See: https://docs.squidrouter.com/api-and-sdk-integration/api
 */
import express from "express";
import axios from "axios";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_SQUID_ROUTE_USD } from "../../../config/x402Pricing.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const SQUID_ROUTE_URL = "https://v2.api.squidrouter.com/v2/route";

/** @param {Record<string, unknown>} body - fromAddress, fromChain, fromToken, fromAmount, toChain, toToken, toAddress, slippage?, slippageConfig? */
function requireSquidRouteBody(req, res, next) {
  const body = req.body || {};
  const fromAddress = body.fromAddress;
  const fromChain = body.fromChain;
  const fromToken = body.fromToken;
  const fromAmount = body.fromAmount;
  const toChain = body.toChain;
  const toToken = body.toToken;
  const toAddress = body.toAddress;
  if (!fromAddress || !fromChain || !fromToken || fromAmount == null || fromAmount === "" || !toChain || !toToken || !toAddress) {
    return res.status(400).json({
      success: false,
      error: "Missing required body: fromAddress, fromChain, fromToken, fromAmount, toChain, toToken, toAddress",
    });
  }
  next();
}

async function fetchSquidRoute(body) {
  const integratorId = process.env.SQUID_INTEGRATOR_ID;
  if (!integratorId) {
    throw new Error("SQUID_INTEGRATOR_ID must be set for Squid Router integration");
  }
  const response = await axios.post(SQUID_ROUTE_URL, body, {
    headers: {
      "x-integrator-id": integratorId,
      "Content-Type": "application/json",
    },
    timeout: 20000,
    validateStatus: () => true,
  });
  if (response.status !== 200) {
    const msg = response.data?.message || response.data?.error || response.statusText || String(response.status);
    throw new Error(`Squid route failed: ${msg}`);
  }
  const requestId = response.headers["x-request-id"];
  return { data: response.data, requestId: requestId || null };
}

export async function createSquidRouteRouter() {
  const router = express.Router();

  const paymentOptions = {
    description: "Squid Router cross-chain route (quote + transactionRequest for first leg)",
    method: "POST",
    discoverable: true,
    resource: "/squid/route",
    price: X402_API_PRICE_SQUID_ROUTE_USD,
    inputSchema: {
      type: "object",
      properties: {
        fromAddress: { type: "string", description: "Source chain wallet address" },
        fromChain: { type: "string", description: "Source chain ID (e.g. 56 BNB, 42161 Arbitrum, 8453 Base)" },
        fromToken: { type: "string", description: "Source token contract address" },
        fromAmount: { type: "string", description: "Amount in smallest units" },
        toChain: { type: "string", description: "Destination chain ID" },
        toToken: { type: "string", description: "Destination token contract address" },
        toAddress: { type: "string", description: "Destination wallet address" },
        slippage: { type: "number", description: "Slippage tolerance percent (default 1)" },
        slippageConfig: { type: "object", description: "Optional slippage config (autoMode: 1)" },
      },
      required: ["fromAddress", "fromChain", "fromToken", "fromAmount", "toChain", "toToken", "toAddress"],
      additionalProperties: true,
    },
  };

  if (process.env.NODE_ENV !== "production") {
    router.post("/dev", async (req, res) => {
      const body = req.body || {};
      const fromAddress = body.fromAddress;
      const fromChain = body.fromChain;
      const fromToken = body.fromToken;
      const fromAmount = body.fromAmount;
      const toChain = body.toChain;
      const toToken = body.toToken;
      const toAddress = body.toAddress;
      if (!fromAddress || !fromChain || !fromToken || fromAmount == null || fromAmount === "" || !toChain || !toToken || !toAddress) {
        return res.status(400).json({
          error: "Missing required body: fromAddress, fromChain, fromToken, fromAmount, toChain, toToken, toAddress",
        });
      }
      const params = {
        fromAddress,
        fromChain: String(fromChain),
        fromToken,
        fromAmount: String(fromAmount),
        toChain: String(toChain),
        toToken,
        toAddress,
        slippage: body.slippage != null ? Number(body.slippage) : 1,
      };
      if (body.slippageConfig) params.slippageConfig = body.slippageConfig;
      try {
        const { data, requestId } = await fetchSquidRoute(params);
        res.status(200).json({ ...data, requestId });
      } catch (e) {
        res.status(500).json({
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    });
  }

  router.post(
    "/",
    requireSquidRouteBody,
    requirePayment({ ...paymentOptions }),
    async (req, res) => {
      const body = req.body || {};
      const fromAddress = body.fromAddress;
      const fromChain = body.fromChain;
      const fromToken = body.fromToken;
      const fromAmount = body.fromAmount;
      const toChain = body.toChain;
      const toToken = body.toToken;
      const toAddress = body.toAddress;
      const params = {
        fromAddress,
        fromChain: String(fromChain),
        fromToken,
        fromAmount: String(fromAmount),
        toChain: String(toChain),
        toToken,
        toAddress,
        slippage: body.slippage != null ? Number(body.slippage) : 1,
      };
      if (body.slippageConfig) params.slippageConfig = body.slippageConfig;
      try {
        const { data, requestId } = await fetchSquidRoute(params);
        await settlePaymentAndSetResponse(res, req);
        res.status(200).json({ ...data, requestId });
      } catch (e) {
        res.status(500).json({
          error: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }
  );

  return router;
}
