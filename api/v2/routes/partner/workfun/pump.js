import express from "express";
import { requirePayment, settlePaymentAndSetResponse } from "../../../utils/x402Payment.js";
import { X402_API_PRICE_PUMP_USD } from "../../../../config/x402Pricing.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { researchService } from "../../../../libs/atxp/researchService.js";
import { payer } from "@faremeter/rides";
import { xLiveSearchService } from "../../../../libs/atxp/xLiveSearchService.js";

export async function createPumpRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    // requirePayment({
    //   price: X402_API_PRICE_PUMP_USD,
    //   description: "Pump your token in just seconds",
    //   method: "GET",
    //   discoverable: true, // Make it discoverable on x402scan
    //   resource: "/pump",
    //   inputSchema: {
    //     queryParams: {
    //       tokenAddress: {
    //         type: "string",
    //         required: false,
    //         description: "Token address to pump",
    //       },
    //     },
    //   },
    // }),
    async (req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);
      try {
        const { tokenAddress } = req.query;

        const options = {
          method: "GET",
          headers: { "X-API-Key": process.env.TWITTER_API_KEY },
        };
        const responses = await fetch(
          `https://api.twitterapi.io/twitter/tweet/advanced_search?queryType=Latest&query=${tokenAddress}`,
          options
        );
        const data = await responses.json();

        if (data.tweets.length === 0) {
          return res.status(404).json({ error: "Token address not found" });
        }

        const response = await fetch(
          `https://wurkapi.fun/api/x402/quick/solana/xlikes-10?url=${data.tweets[1].link}`
        );
        const likeData = await response.json();
        res.json({ tokenAddress, likeData });

        // like 5 post
        // for (let i = 0; i < 5; i++) {
        //   const likePost = await payer.fetch(
        //     `https://wurkapi.fun/api/x402/quick/solana/xlikes-10?url=${data.tweets[i].link}`
        //   );
        //   const likeData = await likePost.json();
        //   res.json({ tokenAddress, likeData });
        // }
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  );

  // POST endpoint for advanced search
  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_PUMP_USD,
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
