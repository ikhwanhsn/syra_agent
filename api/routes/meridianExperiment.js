import express from 'express';
import { requireEarnExperimentCronSecret } from '../config/onchainEarnExperiments.js';
import {
  getMeridianLabState,
  getMeridianStats,
  listMeridianRuns,
  listMeridianStrategies,
  runMeridianSignalCycle,
  resolveOpenMeridianRuns,
  resetMeridianFromScratch,
} from '../libs/meridianService.js';
import { runMeridianExperimentEvolution } from '../libs/meridianEvolution.js';

export function createMeridianExperimentRouter() {
  const router = express.Router();

  router.get('/strategies', async (_req, res) => {
    try {
      res.json({ success: true, data: { strategies: await listMeridianStrategies() } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/state', async (_req, res) => {
    try {
      res.json({ success: true, data: await getMeridianLabState() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/stats', async (_req, res) => {
    try {
      res.json({ success: true, data: await getMeridianStats() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/runs', async (req, res) => {
    try {
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const status = req.query.status ? String(req.query.status) : undefined;
      const strategyId =
        req.query.strategyId != null && String(req.query.strategyId).trim()
          ? Number(req.query.strategyId)
          : undefined;
      const symbol = req.query.symbol ? String(req.query.symbol) : undefined;
      res.json({
        success: true,
        data: await listMeridianRuns({ limit, offset, status, strategyId, symbol }),
      });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/cron/signal', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await runMeridianSignalCycle() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/cron/resolve', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await resolveOpenMeridianRuns() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/cron/evolution', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await runMeridianExperimentEvolution() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/reset', requireEarnExperimentCronSecret, async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      res.json({ success: true, data: await resetMeridianFromScratch({ title: body.title }) });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  return router;
}
