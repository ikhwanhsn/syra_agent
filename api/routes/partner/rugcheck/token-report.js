import express from "express";
import { getX402Handler, requirePayment, settlePaymentAndRecord } from "../../../utils/x402Payment.js";
import { X402_API_PRICE_USD } from "../../../config/x402Pricing.js";
import { payer } from "@faremeter/rides";
export async function createTokenReportRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_USD,
      description: "Token report on Rugcheck",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/token-report",
      inputSchema: {
        queryParams: {
          address: {
            type: "string",
            required: true,
            description: "Token address",
          },
        },
      },
    }),
    async (req, res) => {
      const { address } = req.query;

      try {
        const url = `https://api.rugcheck.xyz/v1/tokens/${address}/report`;

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

        await settlePaymentAndRecord(req);
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
      description: "Token report on Rugcheck",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/token-report",
      inputSchema: {
        bodyType: "json",
        bodyFields: {
          address: {
            type: "string",
            required: true,
            description: "Token address",
          },
        },
      },
    }),
    async (req, res) => {
      const { address } = req.body;

      try {
        const url = `https://api.rugcheck.xyz/v1/tokens/${address}/report`;

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

        await settlePaymentAndRecord(req);
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
