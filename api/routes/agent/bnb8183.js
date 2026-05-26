/**
 * Internal ERC-8183 job execution for the BNB Chain Python sidecar.
 * POST /agent/bnb8183/execute
 */
import express from 'express';
import { executeBnb8183Job } from '../../libs/bnbAgentJobRunner.js';

const router = express.Router();

function requireErc8183InternalSecret(req, res, next) {
  const expected = (process.env.ERC8183_INTERNAL_SECRET || '').trim();
  if (!expected) {
    return res.status(503).json({
      success: false,
      error: 'erc8183_not_configured',
      message: 'Set ERC8183_INTERNAL_SECRET on the API server.',
    });
  }
  const got = (req.get('x-erc8183-internal-secret') || '').trim();
  if (got !== expected) {
    return res.status(401).json({ success: false, error: 'unauthorized' });
  }
  next();
}

router.post('/execute', requireErc8183InternalSecret, async (req, res) => {
  try {
    const jobId = String(req.body?.jobId || '').trim();
    const description = String(req.body?.description || '').trim();
    if (!jobId || !description) {
      return res.status(400).json({
        success: false,
        error: 'jobId and description are required',
      });
    }
    const { deliverable, model } = await executeBnb8183Job({
      jobId,
      description,
      budget: req.body?.budget != null ? String(req.body.budget) : undefined,
      client: typeof req.body?.client === 'string' ? req.body.client : undefined,
      metadata:
        req.body?.metadata && typeof req.body.metadata === 'object' && !Array.isArray(req.body.metadata)
          ? req.body.metadata
          : undefined,
    });
    return res.json({ success: true, data: { deliverable, model } });
  } catch (err) {
    console.error('[bnb8183/execute]', err?.message || err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'execute_failed',
    });
  }
});

export function createBnb8183Router() {
  return router;
}
