import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { atxpClient, ATXPAccount } from "@atxp/client";
import { browseService } from "../libs/atxp/browseService.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";
import { payer } from "@faremeter/rides";

export async function createSmartMoneyRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: "0.15",
      description: "Smart money net flow analysis",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
    }),
    async (req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);

      try {
        const url = "https://nansen.api.corbits.dev/api/v1/smart-money/netflow";

        const payload = {
          chains: ["solana"],
          filters: {
            exclude_smart_money_labels: ["30D Smart Trader"],
            include_native_tokens: false,
            include_smart_money_labels: ["Fund", "Smart Trader"],
            include_stablecoins: false,
          },
          pagination: {
            page: 1,
            per_page: 10,
          },
          order_by: [
            {
              field: "net_flow_24h_usd",
              direction: "DESC",
            },
          ],
        };

        const response = await payer.fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(
            `HTTP ${response.status} ${response.statusText} ${text}`
          );
        }

        const data = await response.json();
        console.log("Smart Money Net Flow:", JSON.stringify(data, null, 2));

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

        res.status(200).json(data);
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
      price: "0.15",
      description: "Smart money net flow analysis",
      method: "POST",
      discoverable: true,
    }),
    async (req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);

      try {
        const url = "https://nansen.api.corbits.dev/api/v1/smart-money/netflow";

        const payload = {
          chains: ["solana"],
          filters: {
            exclude_smart_money_labels: ["30D Smart Trader"],
            include_native_tokens: false,
            include_smart_money_labels: ["Fund", "Smart Trader"],
            include_stablecoins: false,
          },
          pagination: {
            page: 1,
            per_page: 10,
          },
          order_by: [
            {
              field: "net_flow_24h_usd",
              direction: "DESC",
            },
          ],
        };

        const response = await payer.fetch(url, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          throw new Error(
            `HTTP ${response.status} ${response.statusText} ${text}`
          );
        }

        const data = await response.json();
        console.log("Smart Money Net Flow:", JSON.stringify(data, null, 2));

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

        res.status(200).json(data);
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
