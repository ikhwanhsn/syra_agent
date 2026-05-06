import express from "express";
import { resolveLpExperimentStrategies } from "../libs/lpExperimentStrategyResolve.js";
import {
  getLpCandidatePools,
  getLpExperimentStats,
  listLpExperimentRuns,
  resolveOpenLpRuns,
  runLpExperimentSignalCycle,
} from "../libs/lpExperimentService.js";
import { runLpExperimentEvolution } from "../libs/lpExperimentEvolution.js";

function requireCronSecret(req, res, next) {
  const secret = (process.env.LP_AGENT_EXPERIMENT_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-lp-experiment-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-lp-experiment-secret",
    });
  }
  return next();
}

export function createLpAgentExperimentRouter() {
  const router = express.Router();

  router.get("/strategies", async (_req, res) => {
    try {
      const strategies = await resolveLpExperimentStrategies();
      res.json({ success: true, data: { strategies } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/candidates", async (_req, res) => {
    try {
      const candidates = await getLpCandidatePools();
      res.json({ success: true, data: { candidates } });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/stats", async (_req, res) => {
    try {
      const data = await getLpExperimentStats();
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
      const offset = req.query.offset != null ? Number(req.query.offset) : 0;
      const strategyId =
        req.query.strategyId != null && String(req.query.strategyId).trim() !== ""
          ? Number(req.query.strategyId)
          : undefined;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const symbol = typeof req.query.symbol === "string" ? req.query.symbol : undefined;
      const data = await listLpExperimentRuns({ limit, offset, strategyId, status, symbol });
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
      const data = await runLpExperimentSignalCycle();
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
      const data = await resolveOpenLpRuns();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  /**
   * Cull worst LP strategies by win rate (requires min settled runs), wipe their runs, spawn random replacements.
   * Body optional: { removeCount?, minDecided?, pinnedStrategyIds?: number[] }
   */
  router.post("/evolution-tick", requireCronSecret, async (req, res) => {
    try {
      const body = req.body && typeof req.body === "object" ? req.body : {};
      const removeCount =
        body.removeCount != null && Number.isFinite(Number(body.removeCount))
          ? Number(body.removeCount)
          : undefined;
      const minDecided =
        body.minDecided != null && Number.isFinite(Number(body.minDecided))
          ? Number(body.minDecided)
          : undefined;
      let pinned = undefined;
      if (Array.isArray(body.pinnedStrategyIds)) {
        pinned = new Set(
          body.pinnedStrategyIds
            .map((x) => Number(x))
            .filter((n) => Number.isInteger(n) && n >= 0 && n <= 99),
        );
      }
      const data = await runLpExperimentEvolution({ removeCount, minDecided, pinned });
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
