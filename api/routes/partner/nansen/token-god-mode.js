import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { X402_API_PRICE_NANSEN_USD } from "../../../config/x402Pricing.js";
import { getNansenPaymentFetch } from "../../../libs/sentinelPayer.js";
import { tokenGodModeRequests } from "../../../request/nansen/token-god-mode.js";

async function fetchAllTokenGodMode(tokenAddress) {
  const nansenFetch = await getNansenPaymentFetch();
  const responses = await Promise.all(
    tokenGodModeRequests.map(({ url, payload }) =>
      nansenFetch(url, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify({ token_address: tokenAddress, ...payload }),
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
    "flow-intelligence": allData[0],
    holders: allData[1],
    "flow-history": allData[2],
    "bought-and-sold-tokens": allData[3],
    "dex-trades": allData[4],
    transfers: allData[5],
    "jup-dcas": allData[6],
    "pnl-leaderboard": allData[7],
  };
}

export async function createTokenGodModeRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      const { tokenAddress } = req.query;
      if (!tokenAddress) return res.status(400).json({ error: "tokenAddress is required" });
      try {
        const data = await fetchAllTokenGodMode(tokenAddress);
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
      description:
        "Token God Mode - All Data (flow intelligence, holders, flow history, bought and sold tokens, dex trades, transfers, jup dcas, pnl leaderboard)",
      method: "GET",
      discoverable: true,
      resource: "/token-god-mode",
      inputSchema: {
        queryParams: {
          tokenAddress: {
            type: "string",
            required: true,
            description: "Token address for the research",
          },
        },
      },
    }),
    async (req, res) => {
      const { tokenAddress } = req.query;
      try {
        const data = await fetchAllTokenGodMode(tokenAddress);
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
      description:
        "Token God Mode - All Data (flow intelligence, holders, flow history, bought and sold tokens, dex trades, transfers, jup dcas, pnl leaderboard)",
      method: "POST",
      discoverable: true,
      resource: "/token-god-mode",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          tokenAddress: {
            type: "string",
            required: true,
            description: "Token address for the research",
          },
        },
      },
    }),
    async (req, res) => {
      const tokenAddress = req.body.tokenAddress;
      try {
        const data = await fetchAllTokenGodMode(tokenAddress);
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
