import express from 'express';
import MarketplacePreferences from '../../models/agent/MarketplacePreferences.js';
import { performRegisterAgent } from '../8004.js';

const router = express.Router();
const MAX_RECENT = 10;

/**
 * POST /agent/marketplace/register-agent
 * Create an 8004 agent in the Syra collection. Uses the user's Solana agent wallet to sign (no x402 payment popup).
 * Body: same as POST /8004/register-agent (name, description, image, services, skills, domains, anonymousId, etc.).
 * Requires anonymousId and a Solana agent wallet (create/connect in chat first).
 */
router.post('/register-agent', async (req, res) => {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const anonymousId = body.anonymousId && String(body.anonymousId).trim() ? body.anonymousId.trim() : null;
    if (!anonymousId) {
      return res.status(400).json({
        error: 'anonymousId is required to create an agent. Connect your agent wallet first.',
      });
    }
    const data = await performRegisterAgent(body);
    return res.status(201).json(data);
  } catch (error) {
    const status = error?.status ?? 500;
    let msg = error?.message || String(error);
    const isRpcBlocked =
      msg.includes('403') ||
      msg.includes('blockchain') ||
      msg.includes('not allowed to access') ||
      msg.includes('get info about account') ||
      /Root config not initialized|Registry not initialized|initialize the registry first/i.test(msg);
    if (isRpcBlocked) {
      msg =
        'Solana RPC cannot read the 8004 registry (getAccountInfo is blocked). In API .env set SOLANA_RPC_URL to an RPC that allows blockchain access (e.g. https://rpc.ankr.com/solana or Helius).';
    }
    return res.status(status).json({ error: msg, ...(error?.code && { code: error.code }) });
  }
});

/**
 * GET /agent/marketplace/:anonymousId
 * Returns marketplace preferences for the user (favorites, recent, callCounts).
 */
router.get('/:anonymousId', async (req, res) => {
  try {
    const { anonymousId } = req.params;
    if (!anonymousId?.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const doc = await MarketplacePreferences.findOne({ anonymousId: anonymousId.trim() }).lean();
    if (!doc) {
      return res.json({
        success: true,
        favorites: [],
        recent: [],
        callCounts: {},
      });
    }
    return res.json({
      success: true,
      favorites: Array.isArray(doc.favorites) ? doc.favorites : [],
      recent: Array.isArray(doc.recent) ? doc.recent.slice(0, MAX_RECENT) : [],
      callCounts: doc.callCounts && typeof doc.callCounts === 'object' ? doc.callCounts : {},
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /agent/marketplace/:anonymousId
 * Upsert preferences. Body: { favorites?: string[], recent?: { id, title, prompt }[], callCounts?: Record<string, number> }
 * Each field is optional; provided fields replace existing. Omitted fields are left unchanged.
 */
router.put('/:anonymousId', async (req, res) => {
  try {
    const { anonymousId } = req.params;
    if (!anonymousId?.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const id = anonymousId.trim();
    const { favorites, recent, callCounts } = req.body || {};

    let doc = await MarketplacePreferences.findOne({ anonymousId: id });
    if (!doc) {
      doc = new MarketplacePreferences({
        anonymousId: id,
        favorites: [],
        recent: [],
        callCounts: {},
      });
    }

    if (Array.isArray(favorites)) {
      doc.favorites = favorites;
    }
    if (Array.isArray(recent)) {
      doc.recent = recent.slice(0, MAX_RECENT).map((r) => ({
        id: String(r?.id ?? ''),
        title: String(r?.title ?? ''),
        prompt: String(r?.prompt ?? ''),
      }));
    }
    if (callCounts !== undefined && typeof callCounts === 'object' && callCounts !== null) {
      doc.callCounts = callCounts;
    }

    await doc.save();

    return res.json({
      success: true,
      favorites: doc.favorites,
      recent: doc.recent,
      callCounts: doc.callCounts,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export async function createAgentMarketplaceRouter() {
  return router;
}

export default router;
