/**
 * AgentScore buyer-side public routes (discover + check) and re-exports for MCP.
 */
import express from 'express';
import {
  runAgentscoreCheck,
  runAgentscoreDiscover,
} from '../../libs/agentscoreClient.js';

export function createAgentscoreRouter() {
  const router = express.Router();

  router.get('/discover', async (req, res) => {
    try {
      const params = Object.fromEntries(
        Object.entries(req.query || {}).map(([k, v]) => [k, v == null ? '' : String(v)])
      );
      const out = await runAgentscoreDiscover(params);
      if (!out.success) {
        return res.status(out.status ?? 502).json({ success: false, error: out.error });
      }
      return res.json({ success: true, .../** @type {{ data: unknown }} */ (out) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  router.get('/check', async (req, res) => {
    try {
      const params = Object.fromEntries(
        Object.entries(req.query || {}).map(([k, v]) => [k, v == null ? '' : String(v)])
      );
      const out = await runAgentscoreCheck(params);
      if (!out.success) {
        return res.status(out.status ?? 502).json({ success: false, error: out.error });
      }
      return res.json({ success: true, .../** @type {{ data: unknown }} */ (out) });
    } catch (e) {
      return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  return router;
}
