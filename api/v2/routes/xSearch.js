import express from "express";
import { requirePayment, settlePaymentAndSetResponse } from "../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../../config/x402Pricing.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { xLiveSearchService } from "../../libs/atxp/xLiveSearchService.js";

export async function createXSearchRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      description: "Deep research on X/Twitter platform for crypto trends and discussions",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/x/search",
      inputSchema: {
        queryParams: {
          query: {
            type: "string",
            required: true,
            description: "Search query for X/Twitter research (e.g., token name, topic)",
          },
        },
      },
      outputSchema: {
        query: {
          type: "string",
          description: "The original search query",
        },
        result: {
          type: "string",
          description: "AI-summarized findings from X/Twitter discussions",
        },
        citations: {
          type: "array",
          description: "Array of source tweets and references",
        },
        toolCalls: {
          type: "array",
          description: "Array of tool calls made during research",
        },
      },
    }),
    async (req, res) => {
      const { query } = req.query;

      // Read the ATXP account details from environment variables
      const atxpConnectionString = process.env.ATXP_CONNECTION;

      // Create a client using the `atxpClient` function
      const client = await atxpClient({
        mcpServer: xLiveSearchService.mcpServer,
        account: new ATXPAccount(atxpConnectionString),
      });

      const searchParams = {
        query,
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
          await settlePaymentAndSetResponse(res, req);

          res.json({ query, result: message, citations, toolCalls });
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
      }
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      description: "Deep research on X/Twitter platform for crypto trends and discussions",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/x/search",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          query: {
            type: "string",
            required: true,
            description: "Search query for X/Twitter research (e.g., token name, topic)",
          },
        },
      },
      outputSchema: {
        query: {
          type: "string",
          description: "The original search query",
        },
        result: {
          type: "string",
          description: "AI-summarized findings from X/Twitter discussions",
        },
        citations: {
          type: "array",
          description: "Array of source tweets and references",
        },
        toolCalls: {
          type: "array",
          description: "Array of tool calls made during research",
        },
      },
    }),
    async (req, res) => {
      const { query } = req.body;

      // Read the ATXP account details from environment variables
      const atxpConnectionString = process.env.ATXP_CONNECTION;

      // Create a client using the `atxpClient` function
      const client = await atxpClient({
        mcpServer: xLiveSearchService.mcpServer,
        account: new ATXPAccount(atxpConnectionString),
      });

      const searchParams = {
        query,
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
      }
    }
  );

  return router;
}
