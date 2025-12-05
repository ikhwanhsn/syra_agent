// routes/weather.js
import express from "express";
import { getX402Handler, requirePayment } from "../utils/x402Payment.js";
import { buybackAndBurnSYRA } from "../utils/buybackAndBurnSYRA.js";

export async function createNewsRouter() {
  const router = express.Router();

  const MAX_PAGE = 5;

  const fetchPages = async (section) => {
    const requests = [];

    for (let i = 1; i <= MAX_PAGE; i++) {
      requests.push(
        fetch(
          `https://cryptonews-api.com/api/v1/category?section=${section}&items=100&page=${i}&token=${process.env.CRYPTO_NEWS_API_TOKEN}`
        ).then((res) => res.json())
      );
    }

    const results = await Promise.all(requests);

    // merge all pages into a single array (optional)
    return results.flatMap((data) => data.data || []);
  };

  const generalNews = await fetchPages("general");
  const tickerNews = await fetchPages("alltickers");

  // Apply middleware to routes
  router.get(
    "/",
    requirePayment({
      price: "0.1",
      description: "News information service - GET",
    }),
    async (req, res) => {
      if (generalNews?.length > 0 || tickerNews?.length > 0) {
        // Settle payment ONLY on success
        await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          burnResult = await buybackAndBurnSYRA(
            req.x402Payment.paymentRequirements.price
          );
          console.log("Buyback and burn completed:", burnResult);
        } catch (burnError) {
          console.error("Buyback and burn failed:", burnError);
          // Continue even if burn fails - payment was successful
        }

        res.json({
          generalNews,
          tickerNews,
          tokenBuyback: burnResult
            ? {
                swapTransaction: burnResult.swapSignature,
                burnTransaction: burnResult.burnSignature,
                amountBurned: burnResult.amountBurned,
              }
            : null,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch news",
        });
      }
    }
  );

  router.post(
    "/",
    requirePayment({
      price: "0.1",
      description: "News information service - POST",
    }),
    async (req, res) => {
      if (generalNews?.length > 0 || tickerNews?.length > 0) {
        // Settle payment ONLY on success
        await getX402Handler().settlePayment(
          req.x402Payment.paymentHeader,
          req.x402Payment.paymentRequirements
        );

        // Buyback and burn SYRA token (80% of revenue)
        let burnResult = null;
        try {
          burnResult = await buybackAndBurnSYRA(
            req.x402Payment.paymentRequirements.price
          );
          console.log("Buyback and burn completed:", burnResult);
        } catch (burnError) {
          console.error("Buyback and burn failed:", burnError);
          // Continue even if burn fails - payment was successful
        }

        res.json({
          generalNews,
          tickerNews,
          tokenBuyback: burnResult
            ? {
                swapTransaction: burnResult.swapSignature,
                burnTransaction: burnResult.burnSignature,
                amountBurned: burnResult.amountBurned,
              }
            : null,
        });
      } else {
        res.status(500).json({
          error: "Failed to fetch news",
        });
      }
    }
  );

  return router;
}
