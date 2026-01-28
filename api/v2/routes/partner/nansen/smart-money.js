import express from "express";
import { getX402Handler, requirePayment } from "../../../utils/x402Payment.js";
import { payer } from "@faremeter/rides";
import { smartMoneyRequests } from "../../../../request/nansen/smart-money.request.js";
import { saveToLeaderboard } from "../../../../scripts/saveToLeaderboard.js";

export async function createSmartMoneyRouter() {
  const router = express.Router();
  const PRICE_USD = 0.5;

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "Smart money tracking: net flow, holdings, historical holdings, DEX trades, and DCA patterns (V2 API)",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/smart-money",
      outputSchema: {
        "smart-money/netflow": {
          type: "object",
          description: "Smart money net flow data (V2 API)",
        },
        "smart-money/holdings": {
          type: "object",
          description: "Current smart money holdings (V2 API)",
        },
        "smart-money/historical-holdings": {
          type: "object",
          description: "Historical holdings data (V2 API)",
        },
        "smart-money/dex-trades": {
          type: "object",
          description: "Recent DEX trades by smart money (V2 API)",
        },
        "smart-money/dcas": {
          type: "object",
          description: "Dollar cost averaging patterns (V2 API)",
        },
      },
    }),
    async (req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);

      try {
        const responses = await Promise.all(
          smartMoneyRequests.map(({ url, payload }) =>
            payer.fetch(url, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            })
          )
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
          "smart-money/netflow": allData[0],
          "smart-money/holdings": allData[1],
          "smart-money/historical-holdings": allData[2],
          "smart-money/dex-trades": allData[3],
          "smart-money/dcas": allData[4],
        };

        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: PRICE_USD,
        });

        res.status(200).json(data);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "Smart money tracking: net flow, holdings, historical holdings, DEX trades, and DCA patterns (V2 API)",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/smart-money",
      outputSchema: {
        "smart-money/netflow": {
          type: "object",
          description: "Smart money net flow data (V2 API)",
        },
        "smart-money/holdings": {
          type: "object",
          description: "Current smart money holdings (V2 API)",
        },
        "smart-money/historical-holdings": {
          type: "object",
          description: "Historical holdings data (V2 API)",
        },
        "smart-money/dex-trades": {
          type: "object",
          description: "Recent DEX trades by smart money (V2 API)",
        },
        "smart-money/dcas": {
          type: "object",
          description: "Dollar cost averaging patterns (V2 API)",
        },
      },
    }),
    async (req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);

      try {
        const responses = await Promise.all(
          smartMoneyRequests.map(({ url, payload }) =>
            payer.fetch(url, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            })
          )
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
          "smart-money/netflow": allData[0],
          "smart-money/holdings": allData[1],
          "smart-money/historical-holdings": allData[2],
          "smart-money/dex-trades": allData[3],
          "smart-money/dcas": allData[4],
        };

        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: PRICE_USD,
        });

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
