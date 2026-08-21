import express from "express";
import { requireEarnExperimentCronSecret } from "../config/onchainEarnExperiments.js";
import {
  getDelphiLabState,
  getDelphiStats,
  listDelphiRuns,
  listDelphiStrategies,
  runDelphiSignalCycle,
  resolveOpenDelphiRuns,
  resetDelphiFromScratch,
  rankDelphiStrategiesByNetPnl,
  pickBestDelphiStrategy,
} from "../libs/delphiService.js";
import { runDelphiExperimentEvolution } from "../libs/delphiEvolution.js";

export function createDelphiExperimentRouter() {
  const router = express.Router();

  router.get("/strategies", async (_req, res) => {
    try {
      res.json({ success: true, data: { strategies: await listDelphiStrategies() } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/state", async (_req, res) => {
    try {
      res.json({ success: true, data: await getDelphiLabState() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/stats", async (_req, res) => {
    try {
      res.json({ success: true, data: await getDelphiStats() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/leader", async (_req, res) => {
    try {
      const [ranked, best] = await Promise.all([
        rankDelphiStrategiesByNetPnl(),
        pickBestDelphiStrategy(),
      ]);
      res.json({ success: true, data: { ranked, best } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get("/runs", async (req, res) => {
    try {
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const status = req.query.status ? String(req.query.status) : undefined;
      const strategyId = req.query.strategyId != null ? Number(req.query.strategyId) : undefined;
      res.json({
        success: true,
        data: await listDelphiRuns({ limit, offset, status, strategyId }),
      });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/cron/signal", requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await runDelphiSignalCycle() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/cron/resolve", requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await resolveOpenDelphiRuns() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/cron/evolution", requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await runDelphiExperimentEvolution() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post("/reset", requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await resetDelphiFromScratch() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  return router;
}
