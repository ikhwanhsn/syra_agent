// routes/weather.js
import express from "express";

export async function createRegularNewsRouter() {
  const router = express.Router();

  const fetchGeneralNews = async () => {
    const response = await fetch(
      `https://cryptonews-api.com/api/v1/category?section=general&items=25&page=1&token=${process.env.CRYPTO_NEWS_API_TOKEN}`,
    );
    const data = await response.json();
    return data.data || [];
  };

  // Apply middleware to routes
  router.get("/", async (req, res) => {
    // check api key
    const apiKey = req.headers["api-key"];
    if (!apiKey || apiKey !== process.env.SYRA_API_KEY) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const news = await fetchGeneralNews();

    if (!news) {
      return res.status(404).json({ error: "News not found" });
    }
    if (news?.length > 0) {
      res.json({
        news,
      });
    } else {
      res.status(500).json({
        error: "Failed to fetch news",
      });
    }
  });

  return router;
}
