import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { checkFromBrowserCookie } from "../scripts/checkFromBrowserCookie.js";
import { getTokenBalance } from "../scripts/getTokenBalance.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";

export async function createSignalRouter() {
  const router = express.Router();

  // Middleware to adjust price based on SYRA token holdings (> 1M tokens)
  router.use(async (req, res, next) => {
    try {
      let price = "0.15"; // Default price

      const walletAddress = await checkFromBrowserCookie(req);

      if (walletAddress) {
        // 1. Get Token Balance
        const syraBalance = await getTokenBalance(
          walletAddress,
          "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump"
        );

        console.log("SYRA Balance:", syraBalance);

        // 2. Check if user holds more than 1 Million tokens
        if (syraBalance > 1000000) {
          price = "0.05"; // Discounted price
        }
      }

      req.dynamicPrice = price;
      next();
    } catch (error) {
      console.error("Error setting dynamic price:", error);
      req.dynamicPrice = "0.15"; // Fallback to default
      next();
    }
  });

  // GET Route Example
  router.get(
    "/",
    (req, res, next) =>
      requirePayment({
        price: req.dynamicPrice,
        description: "Get signal information for a specific token",
        method: "GET",
        discoverable: true,
        inputSchema: {
          queryParams: {
            token: {
              type: "string",
              required: false,
              description: "Token name for the signal",
            },
          },
        },
      })(req, res, next),
    async (req, res) => {
      try {
        const token = req.query.token || "solana";

        const signal = await fetch(
          `${process.env.N8N_WEBHOOK_URL_SIGNAL}?token=${token}`
        ).then((res) => res.json());

        if (signal) {
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

          res.json({ signal, pricePaid: req.dynamicPrice });
        } else {
          res.status(500).json({ error: "Failed to fetch signal" });
        }
      } catch (error) {
        console.error("Error GET:", error);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  // POST Route Example
  router.post(
    "/",
    (req, res, next) =>
      requirePayment({
        price: req.dynamicPrice,
        description: "Get signal information for a specific token",
        method: "POST",
        discoverable: true,
        inputSchema: {
          bodyType: "json",
          bodyFields: {
            token: {
              type: "string",
              required: false,
              description: "Token name for the signal",
            },
          },
        },
      })(req, res, next),
    async (req, res) => {
      try {
        const { token } = req.body;

        const signal = await fetch(
          `${process.env.N8N_WEBHOOK_URL_SIGNAL}?token=${token || "bitcoin"}`
        ).then((res) => res.json());

        if (signal) {
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

          res.json({ signal, pricePaid: req.dynamicPrice });
        } else {
          res.status(500).json({ error: "Failed to fetch signal" });
        }
      } catch (error) {
        console.error("Error POST:", error);
        res.status(500).json({ error: "Server error" });
      }
    }
  );

  return router;
}
