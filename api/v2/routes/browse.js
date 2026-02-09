import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { X402_API_PRICE_USD } from "../../config/x402Pricing.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { browseService } from "../../libs/atxp/browseService.js";

export async function createBrowseRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      const { query } = req.query;
      if (!query) return res.status(400).json({ error: "query is required" });
      const client = await atxpClient({
        mcpServer: browseService.mcpServer,
        account: new ATXPAccount(process.env.ATXP_CONNECTION),
      });
      try {
        const result = await client.callTool({
          name: browseService.runTaskToolName,
          arguments: browseService.getArguments(query),
        });
        const taskId = browseService.getRunTaskResult(result);
        const pollInterval = 5000;
        while (true) {
          const taskResult = await client.callTool({
            name: browseService.getTaskToolName,
            arguments: { taskId },
          });
          const taskData = browseService.getGetTaskResult(taskResult);
          if (["finished", "stopped", "failed"].includes(taskData.status)) {
            res.json({ query, result: JSON.stringify(taskData) });
            break;
          }
          await new Promise((r) => setTimeout(r, pollInterval));
        }
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
      description: "AI-powered web browsing and information extraction from websites",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/browse",
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
            await settlePaymentAndSetResponse(res, req);

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
      description: "AI-powered web browsing and information extraction from websites",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/browse",
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
            await settlePaymentAndSetResponse(res, req);

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
