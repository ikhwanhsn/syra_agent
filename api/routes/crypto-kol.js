import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { xLiveSearchService } from "../libs/atxp/xLiveSearchService.js";
import { kolPrompt } from "../prompts/kol.prompt.js";
import { getDexscreenerTokenInfo } from "../scripts/getDexscreenerTokenInfo.js";
import { cryptoKolPrompt } from "../prompts/crypto-kol.prompt.js";

async function runCryptoKolHandler(req, res, skipSettle = false) {
  const atxpConnectionString = process.env.ATXP_CONNECTION;
  const client = await atxpClient({
    mcpServer: xLiveSearchService.mcpServer,
    account: new ATXPAccount(atxpConnectionString),
  });
  const searchParams = { query: cryptoKolPrompt };
  const result = await client.callTool({
    name: xLiveSearchService.toolName,
    arguments: xLiveSearchService.getArguments(searchParams),
  });
  const { status, query, message, citations, toolCalls, errorMessage } = xLiveSearchService.getResult(result);
  if (status === "success") {
    if (!skipSettle) await settlePaymentAndSetResponse(res, req);
    res.json({ query, result: message, citations, toolCalls });
  } else {
    res.status(500).json({ error: "Search failed", message: errorMessage });
  }
}

export async function createCryptoKOLRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      try {
        await runCryptoKolHandler(req, res, true);
      } catch (error) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });
  }

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      description: "Get latest insights from top crypto KOLs (@elonmusk, @VitalikButerin, @cz_binance, etc.)",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/x/crypto-kol",
      outputSchema: {
        query: {
          type: "string",
          description: "The analysis query used",
        },
        result: {
          type: "string",
          description: "Summarized insights from top crypto KOLs and influencers",
        },
        citations: {
          type: "array",
          description: "Source tweets and posts from KOLs",
        },
        toolCalls: {
          type: "array",
          description: "Research tool calls made",
        },
      },
    }),
    async (req, res) => {
      try {
        await runCryptoKolHandler(req, res, false);
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
      description: "Get latest insights from top crypto KOLs (@elonmusk, @VitalikButerin, @cz_binance, etc.)",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/x/crypto-kol",
      outputSchema: {
        query: {
          type: "string",
          description: "The analysis query used",
        },
        result: {
          type: "string",
          description: "Summarized insights from top crypto KOLs and influencers",
        },
        citations: {
          type: "array",
          description: "Source tweets and posts from KOLs",
        },
        toolCalls: {
          type: "array",
          description: "Research tool calls made",
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
          await settlePaymentAndSetResponse(res, req);

          res.json({ query, result: message, citations, toolCalls });
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
