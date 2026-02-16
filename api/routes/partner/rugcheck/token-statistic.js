import express from "express";
import { getX402Handler, requirePayment, settlePaymentAndRecord } from "../../../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../../../config/x402Pricing.js";
import { rugcheckRequests } from "../../../request/rugcheck.request.js";
export async function createTokenStatisticRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description:
        "Token statistic on Rugcheck (new token, recent, trending, verified)",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/token-statistic",
    }),
    async (req, res) => {
      const responses = await Promise.all(
        rugcheckRequests.map(({ url }) => fetch(url))
      );

      for (const response of responses) {
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(
            `HTTP ${response.status} ${response.statusText} ${text}`
          );
        }
      }

      const allData = await Promise.all(
        responses.map((response) => response.json())
      );

      const data = {
        "rugcheck/new_tokens": allData[0],
        "rugcheck/recent": allData[1],
        "rugcheck/trending": allData[2],
        "rugcheck/verified": allData[3],
      };

      await settlePaymentAndRecord(req);
      res.status(200).json(data);
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description:
        "Token statistic on Rugcheck (new token, recent, trending, verified)",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/token-statistic",
    }),
    async (req, res) => {
      const responses = await Promise.all(
        rugcheckRequests.map(({ url }) => fetch(url))
      );

      for (const response of responses) {
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(
            `HTTP ${response.status} ${response.statusText} ${text}`
          );
        }
      }

      const allData = await Promise.all(
        responses.map((response) => response.json())
      );

      const data = {
        "rugcheck/new_tokens": allData[0],
        "rugcheck/recent": allData[1],
        "rugcheck/trending": allData[2],
        "rugcheck/verified": allData[3],
      };

      await settlePaymentAndRecord(req);
      res.status(200).json(data);
    }
  );

  return router;
}
