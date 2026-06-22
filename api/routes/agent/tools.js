/**
 * Agent tools: list x402 resources and call them with agent wallet (balance checked first).
 * Nansen calls api.nansen.ai; Zerion calls api.zerion.io (x402); Birdeye calls public-api.birdeye.so (x402); other tools call our API.
 * When connected wallet is a dev wallet (e.g. playground), pricing is cheaper (same as API playground).
 */
import express from 'express';
import { AGENT_TOOLS } from '../../config/agentTools.js';
import {
  getDisplayAgentToolPriceUsd,
  getPactPremiumUsd,
  isPactEligibleAgentTool,
} from '../../libs/pactPricing.js';
import { isPactEnabled } from '../../libs/pactConfig.js';
import { requireSession } from '../../utils/requireSession.js';
import { executeAgentToolCall } from '../../libs/agentToolExecutor.js';

const router = express.Router();

/**
 * GET /agent/tools
 * List available x402 tools (resources) with id, name, description, priceUsd.
 */
router.get('/', async (req, res) => {
  try {
    const tempoAgentPayoutEnabled = String(process.env.TEMPO_AGENT_PAYOUT_ENABLED || '').trim() === 'true';
    const tools = AGENT_TOOLS.filter((t) => t.id !== 'tempo-send-payout' || tempoAgentPayoutEnabled).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      priceUsd: getDisplayAgentToolPriceUsd(t),
      pactEligible: isPactEligibleAgentTool(t),
      pactPremiumUsd: isPactEligibleAgentTool(t) ? getPactPremiumUsd() : 0,
      path: t.path,
      method: t.method,
    }));
    return res.json({
      success: true,
      tools,
      pact: isPactEnabled()
        ? { enabled: true, premiumUsdDefault: getPactPremiumUsd() }
        : { enabled: false },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/tools/call
 * Call an x402 API using the agent wallet. Always check balance first.
 * If balance is 0 or lower than price, return insufficientBalance and a message; otherwise pay and call.
 *
 * SECURITY P0.2 — requires an authenticated session. Guests are admitted ONLY for read-only,
 * non-signing tools (the policy engine in walletBroker rejects signing tools for guests).
 */
router.post('/call', requireSession({ allowGuest: true }), async (req, res) => {
  const { anonymousId, toolId, params: rawParams = {} } = req.body || {};
  const result = await executeAgentToolCall({
    anonymousId,
    toolId,
    params: rawParams,
    ctx: {
      host: req.get('host'),
      user: req.user,
      ip: req.ip,
      userAgent: req.get('user-agent') || undefined,
    },
  });
  return res.status(result.status).json(result.body);
});

export async function createAgentToolsRouter() {
  return router;
}

export default router;
