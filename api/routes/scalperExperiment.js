import express from "express";
import {
  getScalperOverview,
  listScalperRuns,
  getScalperEquityHistory,
  runScalperSignalCycle,
  resolveOpenScalperRuns,
} from "../libs/scalper/scalperService.js";

function parsePositiveInt(value, fallback, { min = 1, max = 500 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function requireCronSecret(req, res, next) {
  const secret = (process.env.SCALPER_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-scalper-cron-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-scalper-cron-secret",
    });
  }
  return next();
}

export function createScalperExperimentRouter() {
  const router = express.Router();

  router.get("/overview", async (_req, res) => {
    try {
      const data = await getScalperOverview();
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
      const limit = parsePositiveInt(req.query.limit, 50, { min: 1, max: 200 });
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const status = typeof req.query.status === "string" ? req.query.status.trim() : undefined;
      const data = await listScalperRuns({ limit, offset, status });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/equity-history", async (_req, res) => {
    try {
      const data = await getScalperEquityHistory();
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
      const data = await runScalperSignalCycle();
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
      const data = await resolveOpenScalperRuns();
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
