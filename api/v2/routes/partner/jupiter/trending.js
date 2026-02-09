import express from "express";
import { getV2Payment } from "../../../utils/getV2Payment.js";

const { requirePayment, settlePaymentAndSetResponse } = await getV2Payment();
import { X402_API_PRICE_USD } from "../../../../config/x402Pricing.js";
import { payer } from "@faremeter/rides";
import { smartMoneyRequests } from "../../../../request/nansen/smart-money.request.js";

export async function createTrendingJupiterRouter() {
  const router = express.Router();

  if (process.env.NODE_ENV !== "production") {
    router.get("/dev", async (_req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) return res.status(500).json({ error: "PAYER_KEYPAIR must be set" });
      await payer.addLocalWallet(PAYER_KEYPAIR);
      try {
        const url = "https://jupiter.api.corbits.dev/tokens/v2/content/cooking";
        const response = await payer.fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(`HTTP ${response.status} ${response.statusText} ${text}`);
        }
        const data = await response.json();
        const contractAddresses = data?.data?.map((item) => item.mint);
        const content = data?.data?.map((item) => item.contents.map((i) => i.content));
        const tokenSummary = data?.data?.map((item) => item.tokenSummary);
        const newsSummary = data?.data?.map((item) => item.newsSummary);
        res.status(200).json({ contractAddresses, content, tokenSummary, newsSummary });
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
      description: "Trending tokens on Jupiter",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/trending-jupiter",
    }),
    async (req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);

      try {
        const url = "https://jupiter.api.corbits.dev/tokens/v2/content/cooking";

        const response = await payer.fetch(`${url}`, {
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

        // get all contract address
        const contractAddresses = data?.data?.map((item) => item.mint);
        const content = data?.data?.map((item) =>
          item.contents.map((i) => i.content)
        );
        const tokenSummary = data?.data?.map((item) => item.tokenSummary);
        const newsSummary = data?.data?.map((item) => item.newsSummary);

        // Settle payment ONLY on success
        await settlePaymentAndSetResponse(res, req);

        res
          .status(200)
          .json({ contractAddresses, content, tokenSummary, newsSummary });
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
      description: "Trending tokens on Jupiter",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/trending-jupiter",
    }),
    async (req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);

      try {
        const url = "https://jupiter.api.corbits.dev/tokens/v2/content/cooking";

        const response = await payer.fetch(`${url}`, {
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

        // get all contract address
        const contractAddresses = data?.data?.map((item) => item.mint);
        const content = data?.data?.map((item) =>
          item.contents.map((i) => i.content)
        );
        const tokenSummary = data?.data?.map((item) => item.tokenSummary);
        const newsSummary = data?.data?.map((item) => item.newsSummary);

        // Settle payment ONLY on success
        await settlePaymentAndSetResponse(res, req);

        res
          .status(200)
          .json({ contractAddresses, content, tokenSummary, newsSummary });
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
