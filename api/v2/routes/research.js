import express from "express";
import { getX402Handler, requirePayment } from "../../utils/x402Payment.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { researchService } from "../../libs/atxp/researchService.js";
import { saveToLeaderboard } from "../../scripts/saveToLeaderboard.js";

export async function createResearchRouter() {
  const router = express.Router();
  const PRICE_USD = 0.75;

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: PRICE_USD,
      description: "AI-powered deep research on any crypto topic with cited sources (V2 API)",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/research",
      inputSchema: {
        queryParams: {
          query: {
            type: "string",
            required: true,
            description: "Research query (e.g., token analysis, market trends, protocol deep-dive) (V2 API)",
          },
          type: {
            type: "string",
            required: false,
            description: "Research depth: 'quick' for fast results, 'deep' for comprehensive analysis (V2 API)",
          },
        },
      },
      outputSchema: {
        status: {
          type: "string",
          description: "Research status (success or error) (V2 API)",
        },
        content: {
          type: "string",
          description: "Comprehensive research findings and analysis (V2 API)",
        },
        sources: {
          type: "array",
          description: "Array of cited sources and references (V2 API)",
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
          const paymentResult = await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements
          );

          // Save to leaderboard
          await saveToLeaderboard({
            wallet: paymentResult.payer,
            volume: PRICE_USD,
          });

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
      price: PRICE_USD,
      description: "AI-powered deep research on any crypto topic with cited sources (V2 API)",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/research",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          query: {
            type: "string",
            required: true,
            description: "Research query (e.g., token analysis, market trends, protocol deep-dive) (V2 API)",
          },
          type: {
            type: "string",
            required: false,
            description: "Research depth: 'quick' for fast results, 'deep' for comprehensive analysis (V2 API)",
          },
        },
      },
      outputSchema: {
        status: {
          type: "string",
          description: "Research status (success or error) (V2 API)",
        },
        content: {
          type: "string",
          description: "Comprehensive research findings and analysis (V2 API)",
        },
        sources: {
          type: "array",
          description: "Array of cited sources and references (V2 API)",
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
          const paymentResult = await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements
          );

          // Save to leaderboard
          await saveToLeaderboard({
            wallet: paymentResult.payer,
            volume: PRICE_USD,
          });

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
