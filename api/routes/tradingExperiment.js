/**
 * Trading agent experiment API — no x402. Uses MongoDB + Binance public data.
 *
 * Env (optional):
 * - TRADING_EXPERIMENT_CRON_SECRET: if set, POST /run-cycle requires header x-trading-experiment-secret
 */
import express from "express";
import {
  getExperimentStats,
  listRecentRuns,
  runFullExperimentCycle,
} from "../libs/tradingExperimentService.js";
import { TRADING_EXPERIMENT_STRATEGIES } from "../config/tradingExperimentStrategies.js";

function requireCronSecret(req, res, next) {
  const secret = (process.env.TRADING_EXPERIMENT_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-trading-experiment-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-trading-experiment-secret",
    });
  }
  return next();
}

export function createTradingExperimentRouter() {
  const router = express.Router();

  router.get("/strategies", (_req, res) => {
    res.json({
      success: true,
      data: { strategies: TRADING_EXPERIMENT_STRATEGIES, source: "binance" },
    });
  });

  router.get("/stats", async (_req, res) => {
    try {
      const data = await getExperimentStats();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/runs", async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 50;
      const runs = await listRecentRuns({ limit });
      res.json({ success: true, data: { runs } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/run-cycle", requireCronSecret, async (_req, res) => {
    try {
      const result = await runFullExperimentCycle();
      res.json({ success: true, data: result });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return router;
}
