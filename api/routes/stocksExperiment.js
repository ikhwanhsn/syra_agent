import express from "express";
import {
  getStocksLabState,
  getStocksStats,
  getStocksOverview,
  listStocksRuns,
  listStocksStrategies,
  getStocksUniverse,
  getStocksNewsFeed,
  runStocksSignalCycle,
  resolveOpenStocksRuns,
  resetStocksFromScratch,
  pickBestStocksAgent,
} from "../libs/stocksExperimentService.js";
import { runStocksExperimentEvolution } from "../libs/stocksExperimentEvolution.js";

function parsePositiveInt(value, fallback, { min = 1, max = 500 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function requireCronSecret(req, res, next) {
  const secret = (process.env.STOCKS_EXPERIMENT_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-stocks-experiment-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-stocks-experiment-secret",
    });
  }
  return next();
}

function requireResetAuth(req, res, next) {
  const cron = (process.env.STOCKS_EXPERIMENT_CRON_SECRET || "").trim();
  const cronHdr = (req.get("x-stocks-experiment-secret") || "").trim();
  if (cron && cronHdr === cron) return next();
  if (!cron) return next();
  return res.status(403).json({
    success: false,
    error: "Missing or invalid reset credentials (x-stocks-experiment-secret)",
  });
}

export function createStocksExperimentRouter() {
  const router = express.Router();

  router.get("/strategies", async (_req, res) => {
    try {
      const strategies = await listStocksStrategies();
      res.json({ success: true, data: { strategies } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/state", async (_req, res) => {
    try {
      const data = await getStocksLabState();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/stats", async (_req, res) => {
    try {
      const data = await getStocksStats();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/overview", async (_req, res) => {
    try {
      const data = await getStocksOverview();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/universe", async (_req, res) => {
    try {
      const universe = await getStocksUniverse();
      res.json({ success: true, data: { universe } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/news", async (req, res) => {
    try {
      const limit = parsePositiveInt(req.query.limit, 12, { min: 1, max: 50 });
      const news = await getStocksNewsFeed({ limit });
      res.json({ success: true, data: { news } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/leader", async (_req, res) => {
    try {
      const leader = await pickBestStocksAgent();
      res.json({ success: true, data: { leader } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/runs", async (req, res) => {
    try {
      const limit = parsePositiveInt(req.query.limit, 50, { min: 1, max: 200 });
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const strategyId =
        req.query.strategyId != null ? Number(req.query.strategyId) : undefined;
      const experimentId =
        typeof req.query.experimentId === "string" ? req.query.experimentId.trim() : undefined;
      const status = typeof req.query.status === "string" ? req.query.status.trim() : undefined;

      const data = await listStocksRuns({ limit, offset, strategyId, experimentId, status });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/signal-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runStocksSignalCycle();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/resolve-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await resolveOpenStocksRuns();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/evolution-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runStocksExperimentEvolution();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/reset-lab", requireResetAuth, async (_req, res) => {
    try {
      const data = await resetStocksFromScratch();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return router;
}
