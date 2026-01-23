import express from "express";

export async function createRegularSignalRouter() {
  const router = express.Router();

  // GET Route Example
  router.get("/", async (req, res) => {
    try {
      // check api key
      const apiKey = req.headers["api-key"] || "";
      if (!apiKey || apiKey !== process.env.SYRA_API_KEY) {
        return res.status(403).json({ error: "Forbidden" });
      }
      const token = req.query.token || "solana";

      const signal = await fetch(
        `${process.env.N8N_WEBHOOK_URL_SIGNAL}?token=${token}`,
      ).then((res) => res.json());

      if (signal) {
        res.json({ token, signal });
      } else {
        res.status(500).json({ error: "Failed to fetch signal" });
      }
    } catch (error) {
      console.error("Error GET:", error);
      res.status(500).json({ error: "Server error" });
    }
  });

  return router;
}
