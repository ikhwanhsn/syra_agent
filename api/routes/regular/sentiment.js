// routes/weather.js
import express from "express";

export async function createRegularSentimentRouter() {
  const router = express.Router();

  const fetchSentiment = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/stat?&section=alltickers&date=last30days&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`,
    );
    const data = await response.json();
    return data || [];
  };

  // Apply middleware to routes
  router.get("/", async (req, res) => {
    // check api key
    const apiKey = req.query.apiKey || "";
    if (!apiKey || apiKey !== process.env.SYRA_API_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const sentiment = await fetchSentiment();

    if (!sentiment) {
      return res.status(404).json({ error: "Sentiment not found" });
    }
    if (sentiment) {
      res.json({
        sentiment,
      });
    } else {
      res.status(500).json({
        error: "Failed to fetch sentiment",
      });
    }
  });

  return router;
}
