import express from 'express';
import { requireEarnExperimentCronSecret } from '../config/onchainEarnExperiments.js';
import {
  getAyeLabsLabState,
  getAyeLabsStats,
  listAyeLabsRuns,
  listAyeLabsStrategies,
  runAyeLabsSignalCycle,
  resolveOpenAyeLabsRuns,
  resetAyeLabsFromScratch,
} from '../libs/ayeLabsService.js';
import { runAyeLabsExperimentEvolution } from '../libs/ayeLabsEvolution.js';

export function createAyeLabsExperimentRouter() {
  const router = express.Router();

  router.get('/strategies', async (_req, res) => {
    try {
      res.json({ success: true, data: { strategies: await listAyeLabsStrategies() } });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/state', async (_req, res) => {
    try {
      res.json({ success: true, data: await getAyeLabsLabState() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/stats', async (_req, res) => {
    try {
      res.json({ success: true, data: await getAyeLabsStats() });
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
        data: await listAyeLabsRuns({ limit, offset, status, strategyId, symbol }),
      });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/cron/signal', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await runAyeLabsSignalCycle() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/cron/resolve', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await resolveOpenAyeLabsRuns() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/cron/evolution', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await runAyeLabsExperimentEvolution() });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/reset', requireEarnExperimentCronSecret, async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      res.json({ success: true, data: await resetAyeLabsFromScratch({ title: body.title }) });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  return router;
}
