import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { X402_API_PRICE_USD } from "../../../../config/x402Pricing.js";
import { payer } from "@faremeter/rides";

export async function createBubblemapsMapsRouter() {
  const router = express.Router();
  const chain = "solana";

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (req, res) => {
      const { address } = req.query;
      if (!address) return res.status(400).json({ error: "address is required" });
      try {
        const url = `https://api.bubblemaps.io/maps/${chain}/${address}?use_magic_nodes=true&return_clusters=true&return_decentralization_score=true`;
        const response = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json", "X-ApiKey": process.env.BUBBLEMAPS_API_KEY },
        });
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(`HTTP ${response.status} ${response.statusText} ${text}`);
        }
        const data = await response.json();
        res.status(200).json({ data });
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
      description: "Token holder distribution visualization and decentralization score from BubbleMaps",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/bubblemaps/maps",
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
        await settlePaymentAndSetResponse(res, req);
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
      description: "Token holder distribution visualization and decentralization score from BubbleMaps",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/v2/bubblemaps/maps",
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
        await settlePaymentAndSetResponse(res, req);
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
