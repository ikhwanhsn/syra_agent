import express from "express";
import { getV2Payment } from "../utils/getV2Payment.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { X402_API_PRICE_RESEARCH_USD } from "../config/x402Pricing.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { researchService } from "../libs/atxp/researchService.js";

export async function createResearchRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      const { query, type } = req.query;
      if (!query) return res.status(400).json({ error: "query is required" });
      const client = await atxpClient({
        mcpServer: researchService.mcpServer,
        account: new ATXPAccount(process.env.ATXP_CONNECTION),
      });
      try {
        const toolName = type === "deep" ? researchService.deepResearchToolName : researchService.quickResearchToolName;
        const researchResult = await client.callTool({
          name: toolName,
          arguments: type === "deep" ? researchService.getDeepResearchArguments(query) : researchService.getQuickResearchArguments(query),
        });
        const { status, content, sources } = type === "deep" ? researchService.getDeepResearchResult(researchResult) : researchService.getQuickResearchResult(researchResult);
        if (status === "success") res.json({ status, content, sources });
        else res.status(500).json({ error: "Research failed" });
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    });
  }

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_RESEARCH_USD,
      description: "AI-powered deep research on any crypto topic with cited sources",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/research",
      inputSchema: {
        queryParams: {
          query: {
            type: "string",
            required: true,
            description: "Research query (e.g., token analysis, market trends, protocol deep-dive)",
          },
          type: {
            type: "string",
            required: false,
            description: "Research depth: 'quick' for fast results, 'deep' for comprehensive analysis",
          },
        },
      },
      outputSchema: {
        status: {
          type: "string",
          description: "Research status (success or error)",
        },
        content: {
          type: "string",
          description: "Comprehensive research findings and analysis",
        },
        sources: {
          type: "array",
          description: "Array of cited sources and references",
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
          await settlePaymentAndSetResponse(res, req);
          res.json({ status, content, sources });
        } else res.status(500).json({ error: "Research failed" });
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_RESEARCH_USD,
      description: "AI-powered deep research on any crypto topic with cited sources",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/research",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          query: {
            type: "string",
            required: true,
            description: "Research query (e.g., token analysis, market trends, protocol deep-dive)",
          },
          type: {
            type: "string",
            required: false,
            description: "Research depth: 'quick' for fast results, 'deep' for comprehensive analysis",
          },
        },
      },
      outputSchema: {
        status: {
          type: "string",
          description: "Research status (success or error)",
        },
        content: {
          type: "string",
          description: "Comprehensive research findings and analysis",
        },
        sources: {
          type: "array",
          description: "Array of cited sources and references",
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
          await settlePaymentAndSetResponse(res, req);

          res.json({ status, content, sources });
        }
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
        process.exit(1);
      }
    }
  );

  return router;
}
