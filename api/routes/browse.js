import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../config/x402Pricing.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { browseService } from "../libs/atxp/browseService.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";
export async function createBrowseRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "AI-powered web browsing and information extraction from websites",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/browse",
      inputSchema: {
        queryParams: {
          query: {
            type: "string",
            required: true,
            description: "Search query or URL to browse and extract information from",
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
          description: "Extracted and summarized information from the browsed content",
        },
      },
    }),
    async (req, res) => {
      const { query } = req.query;

      // Read the ATXP account details from environment variables
      const atxpConnectionString = process.env.ATXP_CONNECTION;

      // Create a client using the `atxpClient` function
      const client = await atxpClient({
        mcpServer: browseService.mcpServer,
        account: new ATXPAccount(atxpConnectionString),
      });

      try {
        const result = await client.callTool({
          name: browseService.runTaskToolName,
          arguments: browseService.getArguments(query),
        });
        const taskId = browseService.getRunTaskResult(result);

        const pollInterval = 5000; // 5 seconds

        while (true) {
          const taskResult = await client.callTool({
            name: browseService.getTaskToolName,
            arguments: { taskId },
          });

          const taskData = browseService.getGetTaskResult(taskResult);

          // Check if task is complete
          if (["finished", "stopped", "failed"].includes(taskData.status)) {
            // Settle payment ONLY on success
            const paymentResult = await getX402Handler().settlePayment(
              req.x402Payment.paymentHeader,
              req.x402Payment.paymentRequirements
            );

            // Buyback and burn SYRA token (80% of revenue)
            let burnResult = null;
            try {
              // Use the price directly from requirePayment config (0.15 USD)
              const priceUSD = X402_API_PRICE_USD;

              burnResult = await buybackAndBurnSYRA(priceUSD);
            } catch (burnError) {
              // Continue even if burn fails - payment was successful
            }

            const formatResult = JSON.stringify(taskData);

            res.json({ query, result: formatResult });
            break;
          }

          // Wait before next poll
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
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
      description: "AI-powered web browsing and information extraction from websites",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/browse",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          query: {
            type: "string",
            required: true,
            description: "Search query or URL to browse and extract information from",
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
          description: "Extracted and summarized information from the browsed content",
        },
      },
    }),
    async (req, res) => {
      const { query } = req.body;

      // Read the ATXP account details from environment variables
      const atxpConnectionString = process.env.ATXP_CONNECTION;

      // Create a client using the `atxpClient` function
      const client = await atxpClient({
        mcpServer: browseService.mcpServer,
        account: new ATXPAccount(atxpConnectionString),
      });

      try {
        const result = await client.callTool({
          name: browseService.runTaskToolName,
          arguments: browseService.getArguments(query),
        });
        const taskId = browseService.getRunTaskResult(result);

        const pollInterval = 5000; // 5 seconds

        while (true) {
          const taskResult = await client.callTool({
            name: browseService.getTaskToolName,
            arguments: { taskId },
          });

          const taskData = browseService.getGetTaskResult(taskResult);

          // Check if task is complete
          if (["finished", "stopped", "failed"].includes(taskData.status)) {
            // Settle payment ONLY on success
            const paymentResult = await getX402Handler().settlePayment(
              req.x402Payment.paymentHeader,
              req.x402Payment.paymentRequirements
            );

            // Buyback and burn SYRA token (80% of revenue)
            let burnResult = null;
            try {
              // Use the price directly from requirePayment config (0.15 USD)
              const priceUSD = X402_API_PRICE_USD;

              burnResult = await buybackAndBurnSYRA(priceUSD);
            } catch (burnError) {
              // Continue even if burn fails - payment was successful
            }

            const formatResult = JSON.stringify(taskData);

            res.json({ query, result: formatResult });
            break;
          }

          // Wait before next poll
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
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
