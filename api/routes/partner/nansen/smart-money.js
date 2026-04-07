import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { X402_API_PRICE_NANSEN_USD } from "../../../config/x402Pricing.js";
import { getNansenPaymentFetch } from "../../../libs/sentinelPayer.js";
import { smartMoneyRequests } from "../../../request/nansen/smart-money.request.js";

async function fetchAllSmartMoney() {
  const nansenFetch = await getNansenPaymentFetch();
  const responses = await Promise.all(
    smartMoneyRequests.map(({ url, payload }) =>
      nansenFetch(url, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    )
  );
  for (const response of responses) {
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(`HTTP ${response.status} ${response.statusText} ${text}`);
    }
  }
  const allData = await Promise.all(responses.map((r) => r.json()));
  return {
    "smart-money/netflow": allData[0],
    "smart-money/holdings": allData[1],
    "smart-money/historical-holdings": allData[2],
    "smart-money/dex-trades": allData[3],
    "smart-money/dcas": allData[4],
  };
}

export async function createSmartMoneyRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (_req, res) => {
      try {
        const data = await fetchAllSmartMoney();
        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }

  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_NANSEN_USD,
      description: "Smart money tracking: net flow, holdings, historical holdings, DEX trades, and DCA patterns",
      method: "GET",
      discoverable: true,
      resource: "/smart-money",
      outputSchema: {
        "smart-money/netflow": { type: "object", description: "Smart money net flow data" },
        "smart-money/holdings": { type: "object", description: "Current smart money holdings" },
        "smart-money/historical-holdings": { type: "object", description: "Historical holdings data" },
        "smart-money/dex-trades": { type: "object", description: "Recent DEX trades by smart money" },
        "smart-money/dcas": { type: "object", description: "Dollar cost averaging patterns" },
      },
    }),
    async (req, res) => {
      try {
        const data = await fetchAllSmartMoney();
        await settlePaymentAndSetResponse(res, req);
        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_NANSEN_USD,
      description: "Smart money tracking: net flow, holdings, historical holdings, DEX trades, and DCA patterns",
      method: "POST",
      discoverable: true,
      resource: "/smart-money",
      outputSchema: {
        "smart-money/netflow": { type: "object", description: "Smart money net flow data" },
        "smart-money/holdings": { type: "object", description: "Current smart money holdings" },
        "smart-money/historical-holdings": { type: "object", description: "Historical holdings data" },
        "smart-money/dex-trades": { type: "object", description: "Recent DEX trades by smart money" },
        "smart-money/dcas": { type: "object", description: "Dollar cost averaging patterns" },
      },
    }),
    async (req, res) => {
      try {
        const data = await fetchAllSmartMoney();
        await settlePaymentAndSetResponse(res, req);
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
