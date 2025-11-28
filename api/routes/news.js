// routes/weather.js
import express from "express";
import { requirePayment } from "../utils/x402Payment.js";

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
    (req, res) => {
      res.json({
        generalNews,
        tickerNews,
      });
    }
  );

  router.post(
    "/",
    requirePayment({
      price: "0.1",
      description: "News information service - POST",
    }),
    (req, res) => {
      res.json({
        generalNews,
        tickerNews,
      });
    }
  );

  return router;
}
