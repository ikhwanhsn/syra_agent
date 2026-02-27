/**
 * v2 x402 API: Get Jupiter Ultra swap order (buy/sell token on Solana via Corbits).
 * GET/POST return a swap order with a base64 transaction for the client to sign and submit.
 * See: https://docs.corbits.dev/api/partners/jupiter/examples
 *
 * NOTE: This route expects fully-resolved mint addresses and base unit amounts.
 * Symbol → mint resolution and amount normalization are handled in the agent
 * layer (agent/chat.js via jupiterTokens.js), not here.
 */
import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";
import { X402_API_PRICE_JUPITER_SWAP_USD } from "../../../config/x402Pricing.js";
import { payer, getSentinelPayerFetch } from "../../../libs/sentinelPayer.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();

const JUPITER_ULTRA_ORDER_URL = "https://jupiter.api.corbits.dev/ultra/v1/order";

/** Build query string from inputMint, outputMint, amount, taker (all required). */
function buildOrderParams(inputMint, outputMint, amount, taker) {
  const params = new URLSearchParams();
  if (inputMint) params.set("inputMint", String(inputMint));
  if (outputMint) params.set("outputMint", String(outputMint));
  if (amount != null && amount !== "") params.set("amount", String(amount));
  if (taker) params.set("taker", String(taker));
  return params;
}

/** Fetch order from Corbits Jupiter Ultra and return JSON. */
async function fetchJupiterOrder(inputMint, outputMint, amount, taker) {
  const { PAYER_KEYPAIR } = process.env;
  if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");
  await payer.addLocalWallet(PAYER_KEYPAIR);

  const params = buildOrderParams(inputMint, outputMint, amount, taker);
  const url = `${JUPITER_ULTRA_ORDER_URL}?${params}`;
  const response = await getSentinelPayerFetch()(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Jupiter order failed: HTTP ${response.status} ${response.statusText} ${text}`);
  }
  return response.json();
}

export async function createJupiterSwapOrderRouter() {
  const router = express.Router();

  const paymentOptions = {
    description: "Jupiter swap order (buy/sell token on Solana)",
    method: "GET",
    discoverable: true,
    resource: "/v2/jupiter/swap/order",
    price: X402_API_PRICE_JUPITER_SWAP_USD,
    inputSchema: {
      type: "object",
      properties: {
        inputMint: { type: "string", description: "Input token mint (e.g. SOL wrapped)" },
        outputMint: { type: "string", description: "Output token mint (e.g. USDC)" },
        amount: { type: "string", description: "Amount in smallest units (e.g. lamports for SOL)" },
        taker: { type: "string", description: "Wallet public key executing the swap" },
      },
      required: ["inputMint", "outputMint", "amount", "taker"],
      additionalProperties: false,
    },
  };

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      const { inputMint, outputMint, amount, taker } = req.query;
      if (!inputMint || !outputMint || amount == null || amount === "" || !taker) {
        return res.status(400).json({
          error: "Missing required query: inputMint, outputMint, amount, taker",
        });
      }
      try {
        const data = await fetchJupiterOrder(inputMint, outputMint, amount, taker);
        res.status(200).json(data);
      } catch (e) {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    });
    router.post("/dev", async (req, res) => {
      const { inputMint, outputMint, amount, taker } = req.body || {};
      if (!inputMint || !outputMint || amount == null || amount === "" || !taker) {
        return res.status(400).json({
          error: "Missing required body: inputMint, outputMint, amount, taker",
        });
      }
      try {
        const data = await fetchJupiterOrder(inputMint, outputMint, amount, taker);
        res.status(200).json(data);
      } catch (e) {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    });
  }

  router.get(
    "/",
    requirePayment(paymentOptions),
    async (req, res) => {
      const { inputMint, outputMint, amount, taker } = req.query;
      if (!inputMint || !outputMint || amount == null || amount === "" || !taker) {
        return res.status(400).json({
          error: "Missing required query: inputMint, outputMint, amount, taker",
        });
      }
      try {
        const data = await fetchJupiterOrder(inputMint, outputMint, amount, taker);
        await settlePaymentAndSetResponse(res, req);
        res.status(200).json(data);
      } catch (e) {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }
  );

  router.post(
    "/",
    requirePayment({
      ...paymentOptions,
      method: "POST",
    }),
    async (req, res) => {
      const { inputMint, outputMint, amount, taker } = req.body || {};
      if (!inputMint || !outputMint || amount == null || amount === "" || !taker) {
        return res.status(400).json({
          error: "Missing required body: inputMint, outputMint, amount, taker",
        });
      }
      try {
        const data = await fetchJupiterOrder(inputMint, outputMint, amount, taker);
        await settlePaymentAndSetResponse(res, req);
        res.status(200).json(data);
      } catch (e) {
        res.status(500).json({
          error: "Internal server error",
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }
  );

  return router;
}
