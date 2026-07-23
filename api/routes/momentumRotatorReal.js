import express from 'express';
import { requireSession, optionalWalletSession } from '../utils/requireSession.js';
import { requireEarnExperimentCronSecret } from '../config/onchainEarnExperiments.js';
import {
  disableMomentumReal,
  enableMomentumReal,
  getMomentumRealState,
  listMomentumRealPositions,
  resolveMomentumRealPositions,
  runMomentumRealSignalCycle,
} from '../libs/momentumRotatorRealService.js';

export function createMomentumRotatorRealRouter() {
  const router = express.Router();

  router.get('/state', optionalWalletSession(), async (req, res) => {
    try {
      const data = await getMomentumRealState({
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
      const data = await listMomentumRealPositions({ limit, offset, status, agentAddress });
      res.json({ success: true, data });
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
      const maxPositionUsd =
        body.maxPositionUsd != null ? Number(body.maxPositionUsd) : undefined;
      const requireGraduation = Boolean(body.requireGraduation);
      const data = await enableMomentumReal({
        anonymousId: req.user.anonymousId,
        enabledBy: req.user.walletAddress || req.user.anonymousId,
        maxPositionUsd,
        requireGraduation,
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
      const data = await disableMomentumReal({
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
      res.json({ success: true, data: await runMomentumRealSignalCycle() });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  router.post('/cron/resolve', requireEarnExperimentCronSecret, async (_req, res) => {
    try {
      res.json({ success: true, data: await resolveMomentumRealPositions() });
    } catch (e) {
      res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return router;
}
