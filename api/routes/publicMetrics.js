/**
 * Public traction metrics — BlockRun-style verifiable stats for leaderboards.
 * GET /api/metrics — JSON snapshot (free, no auth)
 * GET /api/live/calls — SSE feed of recent paid calls (free)
 */
import express from 'express';
import {
  buildPublicMetricsSnapshot,
  fetchRecentLiveCalls,
} from '../libs/publicMetricsService.js';

const router = express.Router();
const SSE_INTERVAL_MS = 5_000;

router.get('/metrics', async (_req, res) => {
  try {
    const data = await buildPublicMetricsSnapshot();
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=120');
    res.json(data);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'metrics_unavailable',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/live/calls', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  let lastPoll = new Date();
  let closed = false;

  const send = (event, payload) => {
    if (closed) return;
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const tick = async () => {
    if (closed) return;
    try {
      const calls = await fetchRecentLiveCalls(lastPoll);
      if (calls.length > 0) {
        lastPoll = new Date();
        send('calls', { calls, at: lastPoll.toISOString() });
      } else {
        send('heartbeat', { at: new Date().toISOString() });
      }
    } catch {
      send('error', { message: 'poll_failed' });
    }
  };

  await tick();
  const interval = setInterval(tick, SSE_INTERVAL_MS);

  req.on('close', () => {
    closed = true;
    clearInterval(interval);
  });
});

export function createPublicMetricsRouter() {
  return router;
}

export default router;
