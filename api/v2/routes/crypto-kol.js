import express from "express";
import { getX402Handler, requirePayment } from "../../utils/x402Payment.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { xLiveSearchService } from "../../libs/atxp/xLiveSearchService.js";
import { kolPrompt } from "../../prompts/kol.prompt.js";
import { getDexscreenerTokenInfo } from "../../scripts/getDexscreenerTokenInfo.js";
import { cryptoKolPrompt } from "../../prompts/crypto-kol.prompt.js";
import { saveToLeaderboard } from "../../scripts/saveToLeaderboard.js";

export async function createCryptoKOLRouter() {
  const router = express.Router();
  const PRICE_USD = 0.15;

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "Get latest insights from top crypto KOLs (@elonmusk, @VitalikButerin, @cz_binance, etc.) (V2 API)",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/crypto-kol",
      outputSchema: {
        query: {
          type: "string",
          description: "The analysis query used (V2 API)",
        },
        result: {
          type: "string",
          description: "Summarized insights from top crypto KOLs and influencers (V2 API)",
        },
        citations: {
          type: "array",
          description: "Source tweets and posts from KOLs (V2 API)",
        },
        toolCalls: {
          type: "array",
          description: "Research tool calls made (V2 API)",
        },
      },
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
          const paymentResult = await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements
          );

          // Save to leaderboard
          await saveToLeaderboard({
            wallet: paymentResult.payer,
            volume: PRICE_USD,
          });

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
      price: PRICE_USD,
      description: "Get latest insights from top crypto KOLs (@elonmusk, @VitalikButerin, @cz_binance, etc.) (V2 API)",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/crypto-kol",
      outputSchema: {
        query: {
          type: "string",
          description: "The analysis query used (V2 API)",
        },
        result: {
          type: "string",
          description: "Summarized insights from top crypto KOLs and influencers (V2 API)",
        },
        citations: {
          type: "array",
          description: "Source tweets and posts from KOLs (V2 API)",
        },
        toolCalls: {
          type: "array",
          description: "Research tool calls made (V2 API)",
        },
      },
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
          const paymentResult = await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements
          );

          // Save to leaderboard
          await saveToLeaderboard({
            wallet: paymentResult.payer,
            volume: PRICE_USD,
          });

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
