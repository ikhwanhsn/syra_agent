/**
 * GET /agent/pact/refunds — read-only ledger of Pact Network refunds for an agent wallet.
 */
import express from 'express';
import PactRefund from '../../models/PactRefund.js';
import { isPactEnabled, getPactResolvedConfig } from '../../libs/pactConfig.js';
import { requireSession } from '../../utils/requireSession.js';

const router = express.Router();

/**
 * GET /agent/pact/refunds?anonymousId=...&limit=50
 */
router.get('/refunds', requireSession({ allowGuest: false }), async (req, res) => {
  try {
    const anonymousId =
      typeof req.query.anonymousId === 'string'
        ? req.query.anonymousId.trim()
        : req.user?.anonymousId?.trim?.() || '';

    if (!anonymousId) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }

    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50;

    const refunds = await PactRefund.find({ anonymousId })
      .sort({ settledAt: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return res.json({
      success: true,
      data: {
        enabled: isPactEnabled(),
        config: isPactEnabled()
          ? {
              network: getPactResolvedConfig().network,
              mode: getPactResolvedConfig().mode,
              premiumUsdDefault: getPactResolvedConfig().premiumUsdDefault,
              providerAllowlist: getPactResolvedConfig().providerAllowlist,
            }
          : null,
        refunds,
        count: refunds.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /agent/pact/status
 */
router.get('/status', async (_req, res) => {
  const cfg = getPactResolvedConfig();
  return res.json({
    success: true,
    data: {
      enabled: isPactEnabled(),
      network: cfg.network,
      mode: cfg.mode,
      premiumUsdDefault: cfg.premiumUsdDefault,
      providerAllowlist: cfg.providerAllowlist,
      autoSetup: cfg.autoSetup,
    },
  });
});

export function createAgentPactRouter() {
  return router;
}

export default router;
