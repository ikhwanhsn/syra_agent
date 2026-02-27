import express from "express";
import { payer, getSentinelPayerFetch } from "../libs/sentinelPayer.js";

export async function createCheckStatusAgentRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get("/", async (req, res) => {
    const { PAYER_KEYPAIR } = process.env;
    if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

    await payer.addLocalWallet(PAYER_KEYPAIR);

    try {
      const { BASE_URL } = process.env;
      const url = `${BASE_URL}/check-status`;

      const response = await getSentinelPayerFetch()(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        res.status(500).json({
          error: "Failed to fetch check status agent",
        });
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // POST endpoint for advanced search
  router.post("/", async (req, res) => {
    const { PAYER_KEYPAIR } = process.env;
    if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

    await payer.addLocalWallet(PAYER_KEYPAIR);

    try {
      const { BASE_URL } = process.env;
      const url = `${BASE_URL}/check-status`;

      const response = await getSentinelPayerFetch()(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        res.status(500).json({
          error: "Failed to fetch check status agent",
        });
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}
