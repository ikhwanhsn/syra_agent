/**
 * x402 paid route — Jupiter Swap V1 quote with Syra referral platform fee.
 */
import express from "express";
import { getV2Payment } from "../../utils/getV2Payment.js";
import { getResourceDescription } from "../../config/x402ResourceCatalog.js";
import { X402_API_PRICE_JUPITER_QUOTE_USD } from "../../config/x402Pricing.js";
import { fetchJupiterQuote, parseJupiterQuoteRequest } from "../../libs/jupiterQuoteService.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const MINT_PARAM = {
  type: "string",
  required: true,
  description: "Solana token mint (base58)",
};

const AMOUNT_PARAM = {
  type: "string",
  required: true,
  description: "Input amount in raw token units (integer string)",
};

const SLIPPAGE_PARAM = {
  type: "integer",
  required: false,
  description: "Slippage in basis points (default 50, max 5000)",
};

const paymentOptionsBase = {
  price: X402_API_PRICE_JUPITER_QUOTE_USD,
  description: getResourceDescription("jupiter/quote"),
  discoverable: true,
  resource: "/jupiter/quote",
  outputSchema: {
    quote: { type: "object", description: "Jupiter quoteResponse payload" },
    referral: { type: "object", description: "Syra referral fee metadata" },
    computedAt: { type: "string" },
  },
};

function attachParsedQuote(req, res, next) {
  try {
    req.jupiterQuoteParams = parseJupiterQuoteRequest({
      method: req.method,
      query: req.query,
      body: req.body,
    });
    next();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
}

async function handleQuote(req, res) {
  try {
    const data = await fetchJupiterQuote(req.jupiterQuoteParams);
    await settlePaymentAndSetResponse(res, req);
    res.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /required|must be|slippage/i.test(msg) ? 400 : 502;
    res.status(status).json({ success: false, error: msg });
  }
}

export async function createJupiterQuoteRouter() {
  const router = express.Router();

  router.get(
    "/",
    requirePayment({
      ...paymentOptionsBase,
      method: "GET",
      inputSchema: {
        queryParams: {
          inputMint: MINT_PARAM,
          outputMint: MINT_PARAM,
          amount: AMOUNT_PARAM,
          slippageBps: SLIPPAGE_PARAM,
          swapMode: {
            type: "string",
            required: false,
            description: "Jupiter swapMode e.g. ExactIn (default)",
          },
        },
      },
    }),
    attachParsedQuote,
    handleQuote,
  );

  router.post(
    "/",
    requirePayment({
      ...paymentOptionsBase,
      method: "POST",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          inputMint: MINT_PARAM,
          outputMint: MINT_PARAM,
          amount: AMOUNT_PARAM,
          slippageBps: SLIPPAGE_PARAM,
          swapMode: {
            type: "string",
            required: false,
            description: "Jupiter swapMode e.g. ExactIn",
          },
        },
      },
    }),
    attachParsedQuote,
    handleQuote,
  );

  return router;
}
