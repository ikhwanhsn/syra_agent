import express from "express";
import { getV2Payment } from "../../utils/getV2Payment.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { X402_API_PRICE_USD } from "../../config/x402Pricing.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { xLiveSearchService } from "../../libs/atxp/xLiveSearchService.js";
import { memecoinsUnusualWhaleBehavior } from "../../prompts/memecoin.js";

export async function createMemecoinsUnusualWhaleBehaviorRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (_req, res) => {
      const client = await atxpClient({
        mcpServer: xLiveSearchService.mcpServer,
        account: new ATXPAccount(process.env.ATXP_CONNECTION),
      });
      try {
        const result = await client.callTool({
          name: xLiveSearchService.toolName,
          arguments: xLiveSearchService.getArguments({ query: memecoinsUnusualWhaleBehavior }),
        });
        const { status, query, message, citations, toolCalls, errorMessage } = xLiveSearchService.getResult(result);
        if (status === "success") res.json({ query, result: message, citations, toolCalls });
        else res.status(500).json({ error: "Search failed", message: errorMessage });
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
      description: "Get the memecoins with unusual whale behavior.",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/memecoin/unusual-whale-behavior",
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
        query: memecoinsUnusualWhaleBehavior,
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
        process.exit(1);
      }
    },
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      description: "Get the memecoins with unusual whale behavior.",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/memecoin/unusual-whale-behavior",
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
        query: memecoinsUnusualWhaleBehavior,
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
    },
  );

  return router;
}
