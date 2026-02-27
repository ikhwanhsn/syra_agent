import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { xLiveSearchService } from "../libs/atxp/xLiveSearchService.js";
import { gemsPrompt } from "../prompts/gems.prompt.js";

async function runGemsHandler(req, res, skipSettle = false) {
  const atxpConnectionString = process.env.ATXP_CONNECTION;
  const client = await atxpClient({
    mcpServer: xLiveSearchService.mcpServer,
    account: new ATXPAccount(atxpConnectionString),
  });
  const searchParams = { query: gemsPrompt };
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

export async function createGemsRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      try {
        await runGemsHandler(req, res, true);
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
      description: "Discover hidden gem crypto projects trending on X/Twitter",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/gems",
      outputSchema: {
        query: {
          type: "string",
          description: "The search query used",
        },
        result: {
          type: "string",
          description: "AI-analyzed hidden gem projects with potential and risks",
        },
        citations: {
          type: "array",
          description: "Source tweets and references",
        },
        toolCalls: {
          type: "array",
          description: "Research tool calls made",
        },
      },
    }),
    async (req, res) => {
      try {
        await runGemsHandler(req, res, false);
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
      description: "Discover hidden gem crypto projects trending on X/Twitter",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/gems",
      outputSchema: {
        query: {
          type: "string",
          description: "The search query used",
        },
        result: {
          type: "string",
          description: "AI-analyzed hidden gem projects with potential and risks",
        },
        citations: {
          type: "array",
          description: "Source tweets and references",
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
        query: gemsPrompt,
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
