import express from "express";
import { getX402Handler, requirePayment } from "../../../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../../../config/x402Pricing.js";
import { buybackAndBurnSYRA } from "../../../utils/buybackAndBurnSYRA.js";
import { payer } from "@faremeter/rides";
export async function createBubblemapsMapsRouter() {
  const router = express.Router();
  const chain = "solana";

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Token holder distribution visualization and decentralization score from BubbleMaps",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/bubblemaps/maps",
      inputSchema: {
        queryParams: {
          address: {
            type: "string",
            required: true,
            description: "Solana token contract address",
          },
        },
      },
      outputSchema: {
        data: {
          type: "object",
          description: "BubbleMaps data with holder clusters, decentralization score, and distribution visualization",
        },
      },
    }),
    async (req, res) => {
      const { address } = req.query;

      try {
        const url = `https://api.bubblemaps.io/maps/${chain}/${address}?use_magic_nodes=true&return_clusters=true&return_decentralization_score=true`;

        const response = await fetch(`${url}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-ApiKey": process.env.BUBBLEMAPS_API_KEY,
          },
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(
            `HTTP ${response.status} ${response.statusText} ${text}`
          );
        }

        const data = await response.json();

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

          console.log(`Payment price: ${priceUSD} USD`);

          burnResult = await buybackAndBurnSYRA(priceUSD);
          console.log("Buyback and burn completed:", burnResult);
        } catch (burnError) {
          console.error("Buyback and burn failed:", burnError);
          // Continue even if burn fails - payment was successful
        }

        res.status(200).json({ data });
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
      price: X402_API_PRICE_USD,
      description: "Token holder distribution visualization and decentralization score from BubbleMaps",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/bubblemaps/maps",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          address: {
            type: "string",
            required: true,
            description: "Solana token contract address",
          },
        },
      },
      outputSchema: {
        data: {
          type: "object",
          description: "BubbleMaps data with holder clusters, decentralization score, and distribution visualization",
        },
      },
    }),
    async (req, res) => {
      const { address } = req.body;

      try {
        const url = `https://api.bubblemaps.io/maps/${chain}/${address}?use_magic_nodes=true&return_clusters=true&return_decentralization_score=true`;

        const response = await fetch(`${url}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(
            `HTTP ${response.status} ${response.statusText} ${text}`
          );
        }

        const data = await response.json();

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

          console.log(`Payment price: ${priceUSD} USD`);

          burnResult = await buybackAndBurnSYRA(priceUSD);
          console.log("Buyback and burn completed:", burnResult);
        } catch (burnError) {
          console.error("Buyback and burn failed:", burnError);
          // Continue even if burn fails - payment was successful
        }

        res.status(200).json({ data });
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
