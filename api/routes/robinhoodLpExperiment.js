import express from "express";
import { resolveRobinhoodLpExperimentStrategies } from "../libs/robinhoodLpExperimentStrategyResolve.js";
import {
  getRobinhoodLpCandidatePools,
  getRobinhoodLpExperimentLabState,
  getRobinhoodLpExperimentStats,
  getRobinhoodLpGlobalOverview,
  listRobinhoodLpRuns,
  resetRobinhoodLpFromScratch,
  resolveOpenRobinhoodLpRuns,
  runRobinhoodLpSignalCycle,
} from "../libs/robinhoodLpExperimentService.js";
import { runRobinhoodLpEvolution } from "../libs/robinhoodLpEvolution.js";
import { fetchRobinhoodUniswapPoolPages } from "../libs/robinhoodUniswapClient.js";

function parsePositiveInt(value, fallback, { min = 1, max = 500 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function requireCronSecret(req, res, next) {
  const secret = (process.env.ROBINHOOD_LP_EXPERIMENT_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-lp-robinhood-experiment-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-lp-robinhood-experiment-secret",
    });
  }
  return next();
}

function requireResetAuth(req, res, next) {
  const ui = (process.env.ROBINHOOD_LP_EXPERIMENT_RESET_UI_TOKEN || "").trim();
  const cron = (process.env.ROBINHOOD_LP_EXPERIMENT_CRON_SECRET || "").trim();
  const uiHdr = (req.get("x-lp-robinhood-reset-ui") || "").trim();
  const cronHdr = (req.get("x-lp-robinhood-experiment-secret") || "").trim();
  if (ui && uiHdr === ui) return next();
  if (cron && cronHdr === cron) return next();
  if (!ui && !cron) return next();
  return res.status(403).json({
    success: false,
    error: "Missing or invalid reset credentials",
  });
}

export function createRobinhoodLpExperimentRouter() {
  const router = express.Router();

  router.get("/strategies", async (_req, res) => {
    try {
      const strategies = await resolveRobinhoodLpExperimentStrategies();
      res.json({ success: true, data: { strategies } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/candidates", async (_req, res) => {
    try {
      const candidates = await getRobinhoodLpCandidatePools();
      res.json({ success: true, data: { candidates } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/stats", async (_req, res) => {
    try {
      const data = await getRobinhoodLpExperimentStats();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/overview", async (_req, res) => {
    try {
      const data = await getRobinhoodLpGlobalOverview();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/pools", async (req, res) => {
    try {
      const limit = parsePositiveInt(req.query.limit, 100, { min: 1, max: 200 });
      const pages = parsePositiveInt(req.query.pages, 3, { min: 1, max: 10 });
      const sortKey =
        typeof req.query.sort_key === "string" && req.query.sort_key.trim()
          ? req.query.sort_key.trim()
          : "volume";
      const pools = await fetchRobinhoodUniswapPoolPages({ pages, limit, sortKey });
      res.json({ success: true, data: { pools, count: pools.length } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/state", async (_req, res) => {
    try {
      const data = await getRobinhoodLpExperimentLabState();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/runs", async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 50;
      const offset = req.query.offset != null ? Number(req.query.offset) : 0;
      const strategyId =
        req.query.strategyId != null && String(req.query.strategyId).trim() !== ""
          ? Number(req.query.strategyId)
          : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const symbol = typeof req.query.symbol === "string" ? req.query.symbol : undefined;
      const experimentId =
        typeof req.query.experimentId === "string" && req.query.experimentId.trim() !== ""
          ? req.query.experimentId.trim()
          : undefined;
      const data = await listRobinhoodLpRuns({ limit, offset, strategyId, status, symbol, experimentId });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/signal-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runRobinhoodLpSignalCycle();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/resolve-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await resolveOpenRobinhoodLpRuns();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/reset-lab", requireResetAuth, async (req, res) => {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const data = await resetRobinhoodLpFromScratch({
        title: typeof body.title === "string" ? body.title : undefined,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/evolution-tick", requireCronSecret, async (req, res) => {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const data = await runRobinhoodLpEvolution({
        removeCount:
          body.removeCount != null && Number.isFinite(Number(body.removeCount))
            ? Number(body.removeCount)
            : undefined,
        minDecided:
          body.minDecided != null && Number.isFinite(Number(body.minDecided))
            ? Number(body.minDecided)
            : undefined,
        dailySpawnCount:
          body.dailySpawnCount != null && Number.isFinite(Number(body.dailySpawnCount))
            ? Number(body.dailySpawnCount)
            : undefined,
        maxStrategies:
          body.maxStrategies != null && Number.isFinite(Number(body.maxStrategies))
            ? Number(body.maxStrategies)
            : undefined,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  return router;
}
