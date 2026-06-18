/**
 * SpaceX IPO Agent — public experiment feed (no x402).
 * GET /experiment/spcx/feed, /latest, /config, POST /tick
 */
import express from "express";
import {
  tickSpcxAgent,
  getLatestSpcxReport,
  getSpcxFeed,
  formatSpcxTelegramMessage,
} from "../../libs/spcxAgentService.js";
import { getEquityCatalogMeta } from "../../libs/equityIntelligence.js";
import { SPCX_IPO_REFERENCE_PRICE_USD, SPCX_NASDAQ_TICKER } from "../../config/equityTokens.js";

export function createSpcxExperimentRouter() {
  const router = express.Router();

  router.get("/config", (_req, res) => {
    res.json({
      success: true,
      data: {
        title: "SpaceX IPO Agent",
        description:
          "Live Nasdaq vs on-chain SPCX premium/discount tracker powered by Syra machine money APIs",
        nasdaqTicker: SPCX_NASDAQ_TICKER,
        ipoReferencePriceUsd: SPCX_IPO_REFERENCE_PRICE_USD,
        demoUrl: "https://agent.syraa.fun/spcx",
        catalog: getEquityCatalogMeta(),
      },
    });
  });

  router.get("/latest", async (req, res) => {
    try {
      const report = await tickSpcxAgent({ force: false });
      res.json({
        success: true,
        data: report,
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/feed", async (req, res) => {
    try {
      const limit = Math.min(
        Math.max(Number(req.query.limit) || 20, 1),
        100,
      );
      let entries = getSpcxFeed({ limit });
      if (!entries.length) {
        await tickSpcxAgent({ force: true });
        entries = getSpcxFeed({ limit });
      }
      res.json({ success: true, data: { entries: Array.isArray(entries) ? entries : [] } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/tick", async (req, res) => {
    try {
      const report = await tickSpcxAgent({ force: true });
      res.json({ success: true, data: report });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/telegram-preview", async (_req, res) => {
    try {
      let report = getLatestSpcxReport();
      if (!report) report = await tickSpcxAgent({ force: true });
      res.json({
        success: true,
        data: { message: formatSpcxTelegramMessage(report), report },
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return router;
}
