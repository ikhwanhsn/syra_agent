import express from "express";
import { getX402Handler, requirePayment, settlePaymentAndRecord } from "../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { xLiveSearchService } from "../libs/atxp/xLiveSearchService.js";
import { kolPrompt } from "../prompts/kol.prompt.js";
import { getDexscreenerTokenInfo } from "../scripts/getDexscreenerTokenInfo.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";
export async function createXKOLRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Analyze KOL/Influencer mentions and sentiment for a token on X/Twitter",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/x-kol",
      inputSchema: {
        queryParams: {
          address: {
            type: "string",
            required: true,
            description: "Solana token contract address to analyze KOL mentions for",
          },
        },
      },
      outputSchema: {
        query: {
          type: "string",
          description: "The analysis query used",
        },
        tokenInfo: {
          type: "object",
          description: "Token information from DEXScreener",
        },
        result: {
          type: "string",
          description: "KOL/Influencer analysis and sentiment summary",
        },
        citations: {
          type: "array",
          description: "Source tweets from KOLs",
        },
        toolCalls: {
          type: "array",
          description: "Research tool calls made",
        },
      },
    }),
    async (req, res) => {
      const { address } = req.query;
      const prompt = await kolPrompt(address);
      const tokenInfo = await getDexscreenerTokenInfo(address);

      // Read the ATXP account details from environment variables
      const atxpConnectionString = process.env.ATXP_CONNECTION;

      // Create a client using the `atxpClient` function
      const client = await atxpClient({
        mcpServer: xLiveSearchService.mcpServer,
        account: new ATXPAccount(atxpConnectionString),
      });

      const searchParams = {
        query: prompt,
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
          await settlePaymentAndRecord(req);

          // Buyback and burn SYRA token (80% of revenue)
          let burnResult = null;
          try {
            // Use the price directly from requirePayment config (0.15 USD)
            const priceUSD = X402_API_PRICE_USD;

            burnResult = await buybackAndBurnSYRA(priceUSD);
          } catch (burnError) {
            // Continue even if burn fails - payment was successful
          }

          res.json({ query, tokenInfo, result: message, citations, toolCalls });
        } else {
          res.status(500).json({
            error: "Search failed",
            message: errorMessage,
          });
        }
      } catch (error) {
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
      price: X402_API_PRICE_USD,
      description: "Analyze KOL/Influencer mentions and sentiment for a token on X/Twitter",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/x-kol",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          address: {
            type: "string",
            required: true,
            description: "Solana token contract address to analyze KOL mentions for",
          },
        },
      },
      outputSchema: {
        query: {
          type: "string",
          description: "The analysis query used",
        },
        tokenInfo: {
          type: "object",
          description: "Token information from DEXScreener",
        },
        result: {
          type: "string",
          description: "KOL/Influencer analysis and sentiment summary",
        },
        citations: {
          type: "array",
          description: "Source tweets from KOLs",
        },
        toolCalls: {
          type: "array",
          description: "Research tool calls made",
        },
      },
    }),
    async (req, res) => {
      const { address } = req.body;
      const prompt = await kolPrompt(address);
      const tokenInfo = await getDexscreenerTokenInfo(address);

      // Read the ATXP account details from environment variables
      const atxpConnectionString = process.env.ATXP_CONNECTION;

      // Create a client using the `atxpClient` function
      const client = await atxpClient({
        mcpServer: xLiveSearchService.mcpServer,
        account: new ATXPAccount(atxpConnectionString),
      });

      const searchParams = {
        query: prompt,
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
          await settlePaymentAndRecord(req);

          // Buyback and burn SYRA token (80% of revenue)
          let burnResult = null;
          try {
            // Use the price directly from requirePayment config (0.15 USD)
            const priceUSD = X402_API_PRICE_USD;

            burnResult = await buybackAndBurnSYRA(priceUSD);
          } catch (burnError) {
            // Continue even if burn fails - payment was successful
          }

          res.json({ query, tokenInfo, result: message, citations, toolCalls });
        } else {
        }
      } catch (error) {
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
