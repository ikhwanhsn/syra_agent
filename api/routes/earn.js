import express from 'express';
import { requireSession } from '../utils/requireSession.js';
import { getEarnSummary, processEarnPayout } from '../libs/earnService.js';

export function createEarnRouter() {
  const router = express.Router();

  router.get('/summary', async (req, res) => {
    try {
      const wallet =
        (typeof req.query.wallet === 'string' && req.query.wallet.trim()) ||
        (typeof req.query.anonymousId === 'string' && req.query.anonymousId.trim()) ||
        null;
      if (!wallet) {
        return res.status(400).json({ success: false, error: 'wallet or anonymousId query param required' });
      }
      const data = await getEarnSummary(wallet);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/summary/:wallet', async (req, res) => {
    try {
      const data = await getEarnSummary(req.params.wallet);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/payout', requireSession(), async (req, res) => {
    try {
      const anonymousId = req.user?.anonymousId;
      if (!anonymousId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      const targetAnonymousId =
        (typeof req.body?.creatorAnonymousId === 'string' && req.body.creatorAnonymousId.trim()) ||
        anonymousId;
      const maxPayoutMicroUsdc =
        req.body?.maxPayoutMicroUsdc != null ? Number(req.body.maxPayoutMicroUsdc) : undefined;
      const result = await processEarnPayout({
        creatorAnonymousId: targetAnonymousId,
        maxPayoutMicroUsdc,
      });
      if (!result.success) {
        return res.status(400).json(result);
      }
      return res.json(result);
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  return router;
}
