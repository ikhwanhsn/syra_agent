import express from "express";
import { getX402Handler, requirePayment, settlePaymentAndRecord } from "../utils/x402Payment.js";
import { X402_API_PRICE_NANSEN_USD } from "../config/x402Pricing.js";
import { tokenGodModePerpRequests } from "../request/nansen/token-god-mode-perp.js";
import { payer, getSentinelPayerFetch } from "../libs/sentinelPayer.js";
import { fetchCryptoNewsApi } from "../libs/cryptonewsApi.js";

export async function createSolanaAgentRouter() {
  const router = express.Router();

  // GET endpoint with x402scan compatible schema
  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_NANSEN_USD,
      description:
        "Solana super intelligent agent (macro analysis + onchain analysis)",
      method: "GET",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/solana-agent",
    }),
    async (req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);

      const [solanaTickerNews, solanaTickerNewsAdvance, solanaSentimentAnalysis, solanaEvent, solanaTrendingHeadlines] =
        await Promise.all([
          fetchCryptoNewsApi("", { tickers: "SOL", items: 25 }),
          fetchCryptoNewsApi("", { "tickers-only": "SOL", items: 25 }),
          fetchCryptoNewsApi("/stat", { tickers: "SOL", date: "last7days" }),
          fetchCryptoNewsApi("/events", { tickers: "SOL" }),
          fetchCryptoNewsApi("/trending-headlines", { ticker: "SOL" }),
        ]);

      try {
        const responses = await Promise.all(
          tokenGodModePerpRequests.map(({ url, payload }) =>
            getSentinelPayerFetch()(url, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            })
          )
        );

        for (const response of responses) {
          if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(
              `HTTP ${response.status} ${response.statusText} ${text}`
            );
          }
        }

        const allData = await Promise.all(
          responses.map((response) => response.json())
        );

        const data = {
          tickerNews: solanaTickerNews,
          tickerNewsAdvance: solanaTickerNewsAdvance,
          sentimentAnalysis: solanaSentimentAnalysis,
          event: solanaEvent,
          trendingHeadlines: solanaTrendingHeadlines,
          tokenGodModePerp: allData,
        };

        await settlePaymentAndRecord(req);
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
      price: X402_API_PRICE_NANSEN_USD,
      description:
        "Solana super intelligent agent (macro analysis + onchain analysis)",
      method: "POST",
      discoverable: true, // Make it discoverable on x402scan
      resource: "/solana-agent",
    }),
    async (req, res) => {
      const { PAYER_KEYPAIR } = process.env;
      if (!PAYER_KEYPAIR) throw new Error("PAYER_KEYPAIR must be set");

      await payer.addLocalWallet(PAYER_KEYPAIR);

      const [solanaTickerNews, solanaTickerNewsAdvance, solanaSentimentAnalysis, solanaEvent, solanaTrendingHeadlines] =
        await Promise.all([
          fetchCryptoNewsApi("", { tickers: "SOL", items: 25 }),
          fetchCryptoNewsApi("", { "tickers-only": "SOL", items: 25 }),
          fetchCryptoNewsApi("/stat", { tickers: "SOL", date: "last7days" }),
          fetchCryptoNewsApi("/events", { tickers: "SOL" }),
          fetchCryptoNewsApi("/trending-headlines", { ticker: "SOL" }),
        ]);

      try {
        const responses = await Promise.all(
          tokenGodModePerpRequests.map(({ url, payload }) =>
            getSentinelPayerFetch()(url, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            })
          )
        );

        for (const response of responses) {
          if (!response.ok) {
            const text = await response.text().catch(() => "");
            throw new Error(
              `HTTP ${response.status} ${response.statusText} ${text}`
            );
          }
        }

        const allData = await Promise.all(
          responses.map((response) => response.json())
        );

        const data = {
          tickerNews: solanaTickerNews,
          tickerNewsAdvance: solanaTickerNewsAdvance,
          sentimentAnalysis: solanaSentimentAnalysis,
          event: solanaEvent,
          trendingHeadlines: solanaTrendingHeadlines,
          tokenGodModePerp: allData,
        };

        await settlePaymentAndRecord(req);
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
