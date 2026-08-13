import express from 'express';
import { requireSession, optionalWalletSession } from '../utils/requireSession.js';
import { requireEarnExperimentCronSecret } from '../config/onchainEarnExperiments.js';
import {
  disableMeridianReal,
  enableMeridianReal,
  getMeridianRealState,
  listMeridianRealPositions,
  resolveMeridianRealPositions,
  runMeridianRealSignalCycle,
  runMeridianEngineTick,
} from '../libs/meridianRealService.js';
import { getEngineHealth } from '../libs/meridianEngineSupervisor.js';
import { syncMeridianEngineState } from '../libs/meridianEngineSync.js';

export function createMeridianRealRouter() {
  const router = express.Router();

  router.get('/state', optionalWalletSession(), async (req, res) => {
    try {
      const data = await getMeridianRealState({
        viewerAnonymousId: req.user?.anonymousId ?? null,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get('/positions', optionalWalletSession(), async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 50;
      const offset = req.query.offset != null ? Number(req.query.offset) : 0;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const agentAddress =
        typeof req.query.agentAddress === 'string' ? req.query.agentAddress.trim() : undefined;
      const data = await listMeridianRealPositions({ limit, offset, status, agentAddress });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.get('/engine/health', optionalWalletSession(), async (_req, res) => {
    try {
      res.json({ success: true, data: getEngineHealth() });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post('/enable', requireSession(), async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const maxPositionSol =
        body.maxPositionSol != null ? Number(body.maxPositionSol) : undefined;
      // Live ops: allow skipping graduation when admin explicitly opts out.
      const requireGraduation = body.requireGraduation === false ? false : true;
      const dryRun = body.dryRun === true;
      const data = await enableMeridianReal({
        anonymousId: req.user.anonymousId,
        enabledBy: req.user.walletAddress || req.user.anonymousId,
        maxPositionSol,
        requireGraduation,
        dryRun,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post('/disable', requireSession(), async (req, res) => {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const data = await disableMeridianReal({
        anonymousId: req.user.anonymousId,
        closeAll: body.closeAll !== false,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post('/cron/signal', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await runMeridianRealSignalCycle() });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post('/cron/resolve', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await resolveMeridianRealPositions() });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post('/cron/sync', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await runMeridianEngineTick() });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post('/engine/sync', requireSession(), async (req, res) => {
    try {
      const agentAddress =
        typeof req.body?.agentAddress === 'string' ? req.body.agentAddress.trim() : undefined;
      res.json({
        success: true,
        data: await syncMeridianEngineState({ agentAddress }),
      });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return router;
}
