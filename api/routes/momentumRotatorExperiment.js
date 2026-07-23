import express from 'express';
import { requireEarnExperimentCronSecret } from '../config/onchainEarnExperiments.js';
import {
  getMomentumLabState,
  getMomentumStats,
  listMomentumRuns,
  listMomentumStrategies,
  runMomentumSignalCycle,
  resolveOpenMomentumRuns,
  resetMomentumFromScratch,
} from '../libs/momentumRotatorService.js';
import { runMomentumExperimentEvolution } from '../libs/momentumRotatorEvolution.js';

export function createMomentumRotatorExperimentRouter() {
  const router = express.Router();

  router.get('/strategies', async (_req, res) => {
    try {
      res.json({ success: true, data: { strategies: await listMomentumStrategies() } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/state', async (_req, res) => {
    try {
      res.json({ success: true, data: await getMomentumLabState() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/stats', async (_req, res) => {
    try {
      res.json({ success: true, data: await getMomentumStats() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/runs', async (req, res) => {
    try {
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const status = req.query.status ? String(req.query.status) : undefined;
      res.json({ success: true, data: await listMomentumRuns({ limit, offset, status }) });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/cron/signal', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await runMomentumSignalCycle() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/cron/resolve', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await resolveOpenMomentumRuns() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/cron/evolution', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await runMomentumExperimentEvolution() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/reset', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await resetMomentumFromScratch() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  return router;
}
