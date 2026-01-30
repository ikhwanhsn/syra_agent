import express from "express";
import { getX402Handler, requirePayment } from "../../../utils/x402Payment.js";
import { X402_API_PRICE_NANSEN_USD } from "../../../../config/x402Pricing.js";
import { payer } from "@faremeter/rides";
import { tokenGodModeRequests } from "../../../../request/nansen/token-god-mode.js";
import { saveToLeaderboard } from "../../../../scripts/saveToLeaderboard.js";

export async function createTokenGodModeRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_NANSEN_USD,
      description:
        "Token God Mode - All Data (flow intelligence, holders, flow history, bought and sold tokens, dex trades, transfers, jup dcas, pnl leaderboard)",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
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
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);

      try {
        const responses = await Promise.all(
          tokenGodModeRequests.map(({ url, payload }) =>
            payer.fetch(url, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token_address: tokenAddress, ...payload }),
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
          "flow-intelligence": allData[0],
          holders: allData[1],
          "flow-history": allData[2],
          "bought-and-sold-tokens": allData[3],
          "dex-trades": allData[4],
          transfers: allData[5],
          "jup-dcas": allData[6],
          "pnl-leaderboard": allData[7],
        };

        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: X402_API_PRICE_NANSEN_USD,
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
      price: X402_API_PRICE_NANSEN_USD,
      description:
        "Token God Mode - All Data (flow intelligence, holders, flow history, bought and sold tokens, dex trades, transfers, jup dcas, pnl leaderboard)",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
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
      const tokenAddress = req.body.address;
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);

      try {
        const responses = await Promise.all(
          tokenGodModeRequests.map(({ url, payload }) =>
            payer.fetch(url, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ token_address: tokenAddress, ...payload }),
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
          "flow-intelligence": allData[0],
          holders: allData[1],
          "flow-history": allData[2],
          "bought-and-sold-tokens": allData[3],
          "dex-trades": allData[4],
          transfers: allData[5],
          "jup-dcas": allData[6],
          "pnl-leaderboard": allData[7],
        };

        // Settle payment ONLY on success
        const paymentResult = await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        await saveToLeaderboard({
          wallet: paymentResult.payer,
          volume: X402_API_PRICE_NANSEN_USD,
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
