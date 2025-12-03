import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { xLiveSearchService } from "../libs/atxp/xLiveSearchService.js";
import { kolPrompt } from "../prompts/kol.prompt.js";
import { getDexscreenerTokenInfo } from "../scripts/getDexscreenerTokenInfo.js";
import { cryptoKolPrompt } from "../prompts/crypto-kol.prompt.js";

export async function createCryptoKOLRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: "0.15",
      description:
        "Get insight from a KOL/Influencer on Crypto, Target Accounts @elonmusk, @VitalikButerin, @cz_binance, @saylor, @justinsuntron, @APompliano, @balajis, @TheCryptoLark, @100trillionUSD, @themooncarl",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
    }),
    async (req, res) => {
      // Read the ATXP account details from environment variables
      const atxpConnectionString = process.env.ATXP_CONNECTION;

      // Create a client using the `atxpClient` function
      const client = await atxpClient({
        mcpServer: xLiveSearchService.mcpServer,
        account: new ATXPAccount(atxpConnectionString),
      });

      const searchParams = {
        query: cryptoKolPrompt,
      };

      try {
        const result = await client.callTool({
          name: xLiveSearchService.toolName,
          arguments: xLiveSearchService.getArguments(searchParams),
        });
        const { status, query, message, citations, toolCalls, errorMessage } =
          xLiveSearchService.getResult(result);

        if (status === "success") {
          // Settle payment ONLY on success
          await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements
          );

          res.json({ query, result: message, citations, toolCalls });
        } else {
          console.error("Search failed:", errorMessage);
          res.status(500).json({
            error: "Search failed",
            message: errorMessage,
          });
        }
      } catch (error) {
        console.error(`Error with ${xLiveSearchService.description}:`, error);
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        process.exit(1);
      }
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price: "0.15",
      description:
        "Get insight from a KOL/Influencer on Crypto, Target Accounts @elonmusk, @VitalikButerin, @cz_binance, @saylor, @justinsuntron, @APompliano, @balajis, @TheCryptoLark, @100trillionUSD, @themooncarl",
      method: "POST",
      discoverable: true,
    }),
    async (req, res) => {
      // Read the ATXP account details from environment variables
      const atxpConnectionString = process.env.ATXP_CONNECTION;

      // Create a client using the `atxpClient` function
      const client = await atxpClient({
        mcpServer: xLiveSearchService.mcpServer,
        account: new ATXPAccount(atxpConnectionString),
      });

      const searchParams = {
        query: cryptoKolPrompt,
      };

      try {
        const result = await client.callTool({
          name: xLiveSearchService.toolName,
          arguments: xLiveSearchService.getArguments(searchParams),
        });
        const { status, query, message, citations, toolCalls, errorMessage } =
          xLiveSearchService.getResult(result); // Parse the result

        if (status === "success") {
          // Settle payment ONLY on success
          await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements
          );

          res.json({ query, result: message, citations, toolCalls });
        } else {
          console.error("Search failed:", errorMessage);
        }
      } catch (error) {
        console.error(`Error with ${xLiveSearchService.description}:`, error);
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
        process.exit(1);
      }
    }
  );

  return router;
}
