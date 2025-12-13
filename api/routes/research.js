import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { researchService } from "../libs/atxp/researchService.js";

export async function createResearchRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: "0.75",
      description: "Research information from websites",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/research",
      inputSchema: {
        queryParams: {
          query: {
            type: "string",
            required: false,
            description: "Query for the research",
          },
          type: {
            type: "enum",
            required: false,
            description: "Type of research",
            enum: ["quick", "deep"],
          },
        },
      },
    }),
    async (req, res) => {
      const { query, type } = req.query;

      // Read the ATXP account details from environment variables
      const atxpConnectionString = process.env.ATXP_CONNECTION;

      // Create a client using the `atxpClient` function
      const client = await atxpClient({
        mcpServer: researchService.mcpServer,
        account: new ATXPAccount(atxpConnectionString),
      });

      try {
        const toolName =
          type === "deep"
            ? researchService.deepResearchToolName
            : researchService.quickResearchToolName;
        const researchResult = await client.callTool({
          name: toolName,
          arguments:
            type === "deep"
              ? researchService.getDeepResearchArguments(query)
              : researchService.getQuickResearchArguments(query),
        });
        const { status, content, sources } =
          type === "deep"
            ? researchService.getDeepResearchResult(researchResult)
            : researchService.getQuickResearchResult(researchResult);

        if (status === "success") {
          // Settle payment ONLY on success
          await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements
          );

          res.json({ status, content, sources });
        }
      } catch (error) {
        console.error(`Error with ${researchService.description}:`, error);
        res.status(500).json({ error: "Internal server error" });
        process.exit(1);
      }
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price: "0.75",
      description: "Research information from websites",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/research",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          query: {
            type: "string",
            required: false,
            description: "Query for the research",
          },
          type: {
            type: "enum",
            required: false,
            description: "Type of research",
            enum: ["quick", "deep"],
          },
        },
      },
    }),
    async (req, res) => {
      const { query, type } = req.body;

      // Read the ATXP account details from environment variables
      const atxpConnectionString = process.env.ATXP_CONNECTION;

      // Create a client using the `atxpClient` function
      const client = await atxpClient({
        mcpServer: researchService.mcpServer,
        account: new ATXPAccount(atxpConnectionString),
      });

      try {
        const toolName =
          type === "deep"
            ? researchService.deepResearchToolName
            : researchService.quickResearchToolName;
        const researchResult = await client.callTool({
          name: toolName,
          arguments:
            type === "deep"
              ? researchService.getDeepResearchArguments(query)
              : researchService.getQuickResearchArguments(query),
        });
        const { status, content, sources } =
          type === "deep"
            ? researchService.getDeepResearchResult(researchResult)
            : researchService.getQuickResearchResult(researchResult);

        if (status === "success") {
          // Settle payment ONLY on success
          await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements
          );

          res.json({ status, content, sources });
        }
      } catch (error) {
        console.error(`Error with ${researchService.description}:`, error);
        res.status(500).json({ error: "Internal server error" });
        process.exit(1);
      }
    }
  );

  return router;
}
