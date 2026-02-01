import express from "express";
import {
  requirePayment,
  getX402ResourceServer,
  encodePaymentResponseHeader,
} from "../../utils/x402Payment.js";
import { X402_API_PRICE_DEXSCREENER_USD } from "../../../config/x402Pricing.js";
import { dexscreenerRequests } from "../../../request/dexscreener.request.js";

export async function createDexscreenerRouter() {
  const router = express.Router();

  async function fetchDexscreenerData() {
    const responses = await Promise.all(
      dexscreenerRequests.map(({ url }) => fetch(url))
    );
    for (const response of responses) {
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status} ${response.statusText} ${text}`);
      }
    }
    const allData = await Promise.all(responses.map((r) => r.json()));
    return {
      "dexscreener/token-profiles": allData[0],
      "dexscreener/community-takeovers": allData[1],
      "dexscreener/ads": allData[2],
      "dexscreener/token-boosts": allData[3],
      "dexscreener/token-boosts-top": allData[4],
    };
  }

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_DEXSCREENER_USD,
      description: "DEXScreener aggregated data: token profiles, community takeovers, ads, and boosted tokens",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/dexscreener",
      outputSchema: {
        "dexscreener/token-profiles": {
          type: "array",
          description: "Latest token profiles on DEXScreener",
        },
        "dexscreener/community-takeovers": {
          type: "array",
          description: "Community takeover listings",
        },
        "dexscreener/ads": {
          type: "array",
          description: "Current advertisement listings",
        },
        "dexscreener/token-boosts": {
          type: "array",
          description: "Boosted token listings",
        },
        "dexscreener/token-boosts-top": {
          type: "array",
          description: "Top boosted tokens",
        },
      },
    }),
    async (req, res) => {
      try {
        const { resourceServer } = getX402ResourceServer();
        const { payload, accepted } = req.x402Payment;
        const [data, settle] = await Promise.all([
          fetchDexscreenerData(),
          resourceServer.settlePayment(payload, accepted),
        ]);
        if (!settle?.success) throw new Error(settle?.errorReason || "Settlement failed");
        res.setHeader("Payment-Response", encodePaymentResponseHeader(settle));
        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // POST endpoint
  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_DEXSCREENER_USD,
      description: "DEXScreener aggregated data: token profiles, community takeovers, ads, and boosted tokens",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/dexscreener",
      outputSchema: {
        "dexscreener/token-profiles": {
          type: "array",
          description: "Latest token profiles on DEXScreener",
        },
        "dexscreener/community-takeovers": {
          type: "array",
          description: "Community takeover listings",
        },
        "dexscreener/ads": {
          type: "array",
          description: "Current advertisement listings",
        },
        "dexscreener/token-boosts": {
          type: "array",
          description: "Boosted token listings",
        },
        "dexscreener/token-boosts-top": {
          type: "array",
          description: "Top boosted tokens",
        },
      },
    }),
    async (req, res) => {
      try {
        const { resourceServer } = getX402ResourceServer();
        const { payload, accepted } = req.x402Payment;
        const [data, settle] = await Promise.all([
          fetchDexscreenerData(),
          resourceServer.settlePayment(payload, accepted),
        ]);
        if (!settle?.success) throw new Error(settle?.errorReason || "Settlement failed");
        res.setHeader("Payment-Response", encodePaymentResponseHeader(settle));
        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  return router;
}
