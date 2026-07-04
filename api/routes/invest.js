import express from 'express';
import { optionalWalletSession, requireSession } from '../utils/requireSession.js';
import { resolveLpViewerAnonymousId } from '../libs/agentWalletPurpose.js';
import {
  deployInvestCapital,
  getInvestOpportunities,
  getInvestPositions,
} from '../libs/investService.js';

export function createInvestRouter() {
  const router = express.Router();

  router.get('/opportunities', optionalWalletSession(), async (req, res) => {
    try {
      const queryAid =
        typeof req.query.anonymousId === 'string' && req.query.anonymousId.trim()
          ? req.query.anonymousId.trim()
          : null;
      const viewerAnonymousId = resolveLpViewerAnonymousId(req.user ?? {}, queryAid);
      const data = await getInvestOpportunities({ viewerAnonymousId });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/positions', optionalWalletSession(), async (req, res) => {
    try {
      const limit = req.query.limit != null ? Number(req.query.limit) : 50;
      const offset = req.query.offset != null ? Number(req.query.offset) : 0;
      const queryAid =
        typeof req.query.anonymousId === 'string' && req.query.anonymousId.trim()
          ? req.query.anonymousId.trim()
          : null;
      const viewerAnonymousId = resolveLpViewerAnonymousId(req.user ?? {}, queryAid);
      const data = await getInvestPositions({ viewerAnonymousId, limit, offset });
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.post('/deploy', requireSession(), async (req, res) => {
    try {
      const anonymousId = req.user?.anonymousId;
      if (!anonymousId) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
      }
      const { adapter, action, toolId, params } = req.body ?? {};
      if (!adapter || typeof adapter !== 'string') {
        return res.status(400).json({ success: false, error: 'adapter is required (jupiter)' });
      }
      const result = await deployInvestCapital({
        anonymousId,
        adapter,
        action: typeof action === 'string' ? action : undefined,
        toolId: typeof toolId === 'string' ? toolId : undefined,
        params: params && typeof params === 'object' ? params : {},
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
