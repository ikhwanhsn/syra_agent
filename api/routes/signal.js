import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { checkFromBrowserCookie } from "../scripts/checkFromBrowserCookie.js";
import { getTokenBalance } from "../scripts/getTokenBalance.js";

export async function createSignalRouter() {
  const router = express.Router();

  // Middleware to dynamically adjust price based on SYRA token balance
  router.use(async (req, res, next) => {
    try {
      let price = "0.15"; // Default price

      const walletAddress = await checkFromBrowserCookie(req);
      if (walletAddress) {
        const syraBalance = await getTokenBalance(
          walletAddress,
          "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump"
        );

        if (syraBalance > 0) {
          price = "0.05"; // Discount if user holds SYRA
        }
      }

      req.dynamicPrice = price;
      next();
    } catch (error) {
      console.error("Error setting dynamic price:", error);
      req.dynamicPrice = "0.15"; // fallback
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
