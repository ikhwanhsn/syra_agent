import express from 'express';
import { requireSession, optionalWalletSession } from '../utils/requireSession.js';
import { resolveLpViewerAnonymousId } from '../libs/agentWalletPurpose.js';
import AgentWallet from '../models/agent/AgentWallet.js';
import {
  applyGrowRecommendation,
  getGrowPortfolio,
  getGrowRecommendations,
} from '../libs/growService.js';

export function createGrowRouter() {
  const router = express.Router();

  router.get('/portfolio', requireSession(), async (req, res) => {
    try {
      const anonymousId = req.user?.anonymousId;
      const wallet = await AgentWallet.findOne({ anonymousId }).lean();
      const address =
        (typeof req.query.address === 'string' && req.query.address.trim()) ||
        wallet?.agentAddress;
      if (!address) {
        return res.status(400).json({ success: false, error: 'Wallet address required' });
      }
      const data = await getGrowPortfolio(address);
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/recommendations', optionalWalletSession(), async (req, res) => {
    try {
      const queryAid =
        typeof req.query.anonymousId === 'string' && req.query.anonymousId.trim()
          ? req.query.anonymousId.trim()
          : null;
      const viewerAnonymousId = resolveLpViewerAnonymousId(req.user ?? {}, queryAid);
      const address =
        typeof req.query.address === 'string' && req.query.address.trim()
          ? req.query.address.trim()
          : null;

      let walletAddress = address;
      if (!walletAddress && viewerAnonymousId) {
        const w = await AgentWallet.findOne({ anonymousId: viewerAnonymousId }).lean();
        walletAddress = w?.agentAddress ?? null;
      }
      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Connect wallet or pass address query param',
        });
      }

      const data = await getGrowRecommendations({ walletAddress, viewerAnonymousId });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/apply', requireSession(), async (req, res) => {
    try {
      const anonymousId = req.user?.anonymousId;
      if (!anonymousId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      const { recommendationId, adapter, action } = req.body ?? {};
      if (!recommendationId || typeof recommendationId !== 'string') {
        return res.status(400).json({ success: false, error: 'recommendationId is required' });
      }
      const result = await applyGrowRecommendation({
        anonymousId,
        recommendationId,
        adapter: typeof adapter === 'string' ? adapter : undefined,
        action: typeof action === 'string' ? action : undefined,
        requestContext: {
          anonymousId,
          sessionId: req.user?.sessionId,
          ip: req.ip,
          userAgent: req.get('user-agent') ?? undefined,
          guest: Boolean(req.user?.guest),
        },
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
