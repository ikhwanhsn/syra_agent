import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { browseService } from "../libs/atxp/browseService.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";

export async function createBrowseRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: "0.15",
      description: "Scrape information from websites",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      inputSchema: {
        queryParams: {
          query: {
            type: "string",
            required: false,
            description: "Query for the research",
          },
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
        console.log(`${browseService.description} runTask result successful!`);
        const taskId = browseService.getRunTaskResult(result);

        const pollInterval = 5000; // 5 seconds

        while (true) {
          const taskResult = await client.callTool({
            name: browseService.getTaskToolName,
            arguments: { taskId },
          });

          const taskData = browseService.getGetTaskResult(taskResult);
          console.log(
            `${browseService.description} runTask result successful!`
          );

          // Check if task is complete
          if (["finished", "stopped", "failed"].includes(taskData.status)) {
            console.log(`${browseService.description} result successful!`);
            console.log(
              `Task completed with data: ${JSON.stringify(taskData)}`
            );

            // Settle payment ONLY on success
            await getX402Handler().settlePayment(
              req.x402Payment.paymentHeader,
              req.x402Payment.paymentRequirements
            );

            // Buyback and burn SYRA token (80% of revenue)
            let burnResult = null;
            try {
              // Use the price directly from requirePayment config (0.15 USD)
              const priceUSD = 0.15;

              console.log(`Payment price: ${priceUSD} USD`);

              burnResult = await buybackAndBurnSYRA(priceUSD);
              console.log("Buyback and burn completed:", burnResult);
            } catch (burnError) {
              console.error("Buyback and burn failed:", burnError);
              // Continue even if burn fails - payment was successful
            }

            res.json({ query, result: taskData });
            break;
          }

          // Wait before next poll
          console.log(`${browseService.description} result pending.`);
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
      } catch (error) {
        console.error(`Error with ${browseService.description}:`, error);
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
      description: "Scrape information from websites",
      method: "POST",
      discoverable: true,
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          query: {
            type: "string",
            required: false,
            description: "Query for the research",
          },
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
        console.log(`${browseService.description} runTask result successful!`);
        const taskId = browseService.getRunTaskResult(result);

        const pollInterval = 5000; // 5 seconds

        while (true) {
          const taskResult = await client.callTool({
            name: browseService.getTaskToolName,
            arguments: { taskId },
          });

          const taskData = browseService.getGetTaskResult(taskResult);
          console.log(
            `${browseService.description} runTask result successful!`
          );

          // Check if task is complete
          if (["finished", "stopped", "failed"].includes(taskData.status)) {
            console.log(`${browseService.description} result successful!`);
            console.log(
              `Task completed with data: ${JSON.stringify(taskData)}`
            );

            // Settle payment ONLY on success
            await getX402Handler().settlePayment(
              req.x402Payment.paymentHeader,
              req.x402Payment.paymentRequirements
            );

            // Buyback and burn SYRA token (80% of revenue)
            let burnResult = null;
            try {
              // Use the price directly from requirePayment config (0.15 USD)
              const priceUSD = 0.15;

              console.log(`Payment price: ${priceUSD} USD`);

              burnResult = await buybackAndBurnSYRA(priceUSD);
              console.log("Buyback and burn completed:", burnResult);
            } catch (burnError) {
              console.error("Buyback and burn failed:", burnError);
              // Continue even if burn fails - payment was successful
            }

            res.json({ query, result: taskData });
            break;
          }

          // Wait before next poll
          console.log(`${browseService.description} result pending.`);
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
      } catch (error) {
        console.error(`Error with ${browseService.description}:`, error);
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
