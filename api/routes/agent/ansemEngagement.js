import express from 'express';
import { isMongooseConnected } from '../../config/mongoose.js';
import {
  getAnsemEngagementStatus,
  runAnsemEngagementCheck,
} from '../../libs/ansemEngagementService.js';
import { requireSession } from '../../utils/requireSession.js';

function requireDb(_req, res, next) {
  if (!isMongooseConnected()) {
    return res.status(503).json({ success: false, error: 'database_unavailable' });
  }
  return next();
}

export function createAnsemEngagementRouter() {
  const router = express.Router();

  /** GET /agent/ansem/engagement/status — quota + last check for connected wallet */
  router.get('/status', requireSession(), requireDb, async (req, res) => {
    try {
      const anonymousId = req.user?.anonymousId;
      if (!anonymousId || req.user?.guest) {
        return res.status(401).json({ success: false, error: 'wallet_sign_in_required' });
      }
      const data = await getAnsemEngagementStatus(anonymousId);
      return res.json({ success: true, data });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  /** POST /agent/ansem/engagement/check — score X profile for $ANSEM engagement (1×/day) */
  router.post('/check', requireSession(), requireDb, async (req, res) => {
    try {
      const anonymousId = req.user?.anonymousId;
      const walletAddress = req.user?.walletAddress;
      if (!anonymousId || !walletAddress || req.user?.guest) {
        return res.status(401).json({ success: false, error: 'wallet_sign_in_required' });
      }

      const xHandle =
        typeof req.body?.xHandle === 'string'
          ? req.body.xHandle
          : typeof req.body?.username === 'string'
            ? req.body.username
            : '';
      if (!xHandle.trim()) {
        return res.status(400).json({ success: false, error: 'x_handle_required' });
      }

      const result = await runAnsemEngagementCheck({
        anonymousId,
        walletAddress,
        xHandle,
      });

      if (!result.ok) {
        const status =
          result.error === 'daily_limit_reached'
            ? 429
            : result.error === 'invalid_x_handle'
              ? 400
              : result.error === 'x_user_not_found'
                ? 404
                : 502;
        return res.status(status).json({
          success: false,
          error: result.error,
          message: result.message,
          detail: result.detail,
          quota: result.quota,
        });
      }

      return res.json({
        success: true,
        data: result.data,
        quota: result.quota,
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  });

  return router;
}
