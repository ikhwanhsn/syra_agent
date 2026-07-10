import express from "express";
import {
  getMmOverview,
  listMmRuns,
  getMmEquityHistory,
  getMmVolumeHistory,
  getMmLearning,
  runMmLearning,
  runMmQuoteCycle,
  resolveOpenMmOrders,
  resetMmFromScratch,
} from "../libs/mm/mmService.js";

function parsePositiveInt(value, fallback, { min = 1, max = 500 } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(n)));
}

function requireCronSecret(req, res, next) {
  const secret = (process.env.MM_CRON_SECRET || "").trim();
  if (!secret) return next();
  const got = (req.get("x-mm-cron-secret") || "").trim();
  if (got !== secret) {
    return res.status(403).json({
      success: false,
      error: "Invalid or missing x-mm-cron-secret",
    });
  }
  return next();
}

function requireResetAuth(req, res, next) {
  const secret = (process.env.MM_CRON_SECRET || "").trim();
  const got = (req.get("x-mm-cron-secret") || "").trim();
  if (secret && got === secret) return next();
  if (!secret) return next();
  return res.status(403).json({
    success: false,
    error: "Missing or invalid reset credentials (x-mm-cron-secret)",
  });
}

export function createMmExperimentRouter() {
  const router = express.Router();

  router.get("/overview", async (_req, res) => {
    try {
      const data = await getMmOverview();
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
      const data = await listMmRuns({ limit, offset, status });
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
      const data = await getMmEquityHistory();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/volume-history", async (_req, res) => {
    try {
      const data = await getMmVolumeHistory();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get("/learning", async (_req, res) => {
    try {
      const data = await getMmLearning();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/quote-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runMmQuoteCycle();
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
      const data = await resolveOpenMmOrders();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/learning-tick", requireCronSecret, async (_req, res) => {
    try {
      const data = await runMmLearning();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post("/reset-lab", requireResetAuth, async (req, res) => {
    try {
      const title = typeof req.body?.title === "string" ? req.body.title.trim() : undefined;
      const data = await resetMmFromScratch({ title });
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
