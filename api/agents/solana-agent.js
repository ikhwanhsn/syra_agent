import express from "express";
import { getX402Handler, requirePayment, settlePaymentAndRecord } from "../utils/x402Payment.js";
import { X402_API_PRICE_NANSEN_USD } from "../config/x402Pricing.js";
import { tokenGodModePerpRequests } from "../request/nansen/token-god-mode-perp.js";
import { getNansenPaymentFetch } from "../libs/sentinelPayer.js";
import {
  fetchNewsTickers,
  fetchNewsTickersOnly,
  fetchSentimentTicker,
  fetchEventsTicker,
  fetchTrendingHeadlinesTicker,
} from "../libs/internalNewsAgent.js";

async function fetchPerpData() {
  const nansenFetch = await getNansenPaymentFetch();
  const responses = await Promise.all(
    tokenGodModePerpRequests.map(({ url, payload }) =>
      nansenFetch(url, {
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
      throw new Error(`HTTP ${response.status} ${response.statusText} ${text}`);
    }
  }
  return Promise.all(responses.map((r) => r.json()));
}

export async function createSolanaAgentRouter() {
  const router = express.Router();

  router.get(
    "/",
    requirePayment({
      price: X402_API_PRICE_NANSEN_USD,
      description:
        "Solana super intelligent agent (macro analysis + onchain analysis)",
      method: "GET",
      discoverable: true,
      resource: "/solana-agent",
    }),
    async (req, res) => {
      try {
        const [
          solTickerNews,
          solTickerNewsOnly,
          solSentiment,
          solEvents,
          solTrending,
          perpData,
        ] = await Promise.all([
          fetchNewsTickers("SOL", 25),
          fetchNewsTickersOnly("SOL", 25),
          fetchSentimentTicker("SOL", "last7days"),
          fetchEventsTicker("SOL"),
          fetchTrendingHeadlinesTicker("SOL"),
          fetchPerpData(),
        ]);

        const data = {
          tickerNews: { data: solTickerNews },
          tickerNewsAdvance: { data: solTickerNewsOnly },
          sentimentAnalysis: { data: solSentiment },
          event: { data: solEvents },
          trendingHeadlines: { data: solTrending },
          tokenGodModePerp: perpData,
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

  router.post(
    "/",
    requirePayment({
      price: X402_API_PRICE_NANSEN_USD,
      description:
        "Solana super intelligent agent (macro analysis + onchain analysis)",
      method: "POST",
      discoverable: true,
      resource: "/solana-agent",
    }),
    async (req, res) => {
      try {
        const [
          solTickerNews,
          solTickerNewsOnly,
          solSentiment,
          solEvents,
          solTrending,
          perpData,
        ] = await Promise.all([
          fetchNewsTickers("SOL", 25),
          fetchNewsTickersOnly("SOL", 25),
          fetchSentimentTicker("SOL", "last7days"),
          fetchEventsTicker("SOL"),
          fetchTrendingHeadlinesTicker("SOL"),
          fetchPerpData(),
        ]);

        const data = {
          tickerNews: { data: solTickerNews },
          tickerNewsAdvance: { data: solTickerNewsOnly },
          sentimentAnalysis: { data: solSentiment },
          event: { data: solEvents },
          trendingHeadlines: { data: solTrending },
          tokenGodModePerp: perpData,
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
