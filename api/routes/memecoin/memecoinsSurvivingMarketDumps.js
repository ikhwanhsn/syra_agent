import express from "express";
import { getX402Handler, requirePayment } from "../../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../../config/x402Pricing.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { xLiveSearchService } from "../../libs/atxp/xLiveSearchService.js";
import { buybackAndBurnSYRA } from "../../utils/buybackAndBurnSYRA.js";
import { saveToLeaderboard } from "../../scripts/saveToLeaderboard.js";
import { memecoinsSurvivingMarketDumps } from "../../prompts/memecoin.js";

export async function createMemecoinsSurvivingMarketDumpsRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Get the memecoins surviving market dumps.",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/memecoin/surviving-market-dumps",
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
        query: memecoinsSurvivingMarketDumps,
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
          const paymentResult = await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements,
          );

          // Buyback and burn SYRA token (80% of revenue)
          let burnResult = null;
          try {
            // Use the price directly from requirePayment config (0.15 USD)
            const priceUSD = X402_API_PRICE_USD;

            console.log(`Payment price: ${priceUSD} USD`);

            burnResult = await buybackAndBurnSYRA(priceUSD);
            console.log("Buyback and burn completed:", burnResult);
          } catch (burnError) {
            console.error("Buyback and burn failed:", burnError);
            // Continue even if burn fails - payment was successful
          }

          // Save to leaderboard
          await saveToLeaderboard({
            wallet: paymentResult.payer,
            volume: X402_API_PRICE_USD,
          });

          res.json({ query, result: message, citations, toolCalls });
        } else {
          console.error("Search failed:", errorMessage);
          res.status(500).json({
            error: "Search failed",
            message: errorMessage,
          });
        }
      } catch (error) {
        console.error(`Error with ${xLiveSearchService.description}:`, error);
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
      price: X402_API_PRICE_USD,
      description: "Get the memecoins surviving market dumps.",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/memecoin/surviving-market-dumps",
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
        query: memecoinsSurvivingMarketDumps,
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
          const paymentResult = await getX402Handler().settlePayment(
            req.x402Payment.paymentHeader,
            req.x402Payment.paymentRequirements,
          );

          // Buyback and burn SYRA token (80% of revenue)
          let burnResult = null;
          try {
            // Use the price directly from requirePayment config (0.15 USD)
            const priceUSD = X402_API_PRICE_USD;

            console.log(`Payment price: ${priceUSD} USD`);

            burnResult = await buybackAndBurnSYRA(priceUSD);
            console.log("Buyback and burn completed:", burnResult);
          } catch (burnError) {
            console.error("Buyback and burn failed:", burnError);
            // Continue even if burn fails - payment was successful
          }

          // Save to leaderboard
          await saveToLeaderboard({
            wallet: paymentResult.payer,
            volume: X402_API_PRICE_USD,
          });

          res.json({ query, result: message, citations, toolCalls });
        } else {
          console.error("Search failed:", errorMessage);
        }
      } catch (error) {
        console.error(`Error with ${xLiveSearchService.description}:`, error);
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
