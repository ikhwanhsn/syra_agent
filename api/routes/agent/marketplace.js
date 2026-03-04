import express from 'express';
import MarketplacePreferences from '../../models/agent/MarketplacePreferences.js';
import { callX402V2WithAgent } from '../../libs/agentX402Client.js';

const router = express.Router();
const MAX_RECENT = 10;

/** Base URL for self-calls to 8004 (x402 pay with agent wallet). */
const API_BASE = process.env.BASE_URL || process.env.API_BASE_URL || 'http://localhost:3000';

/**
 * POST /agent/marketplace/register-agent
 * Create an 8004 agent in the Syra collection. Payment is taken from the user's agent wallet (x402) on the backend.
 * Body: same as POST /8004/register-agent (name, description, image, services, skills, domains, anonymousId, etc.).
 * Requires anonymousId so the backend can pay with the agent's wallet — no browser payment popup.
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
    const registerUrl = `${API_BASE}/8004/register-agent`;
    const result = await callX402V2WithAgent({
      anonymousId,
      url: registerUrl,
      method: 'POST',
      body,
    });
    if (!result.success) {
      const status = result.budgetExceeded ? 402 : 400;
      const msg = result.error || 'Failed to create agent';
      if (msg.includes('Agent wallet not found')) {
        return res.status(401).json({ error: msg });
      }
      return res.status(status).json({ error: msg });
    }
    return res.status(201).json(result.data);
  } catch (error) {
    const msg = error?.message || String(error);
    return res.status(500).json({ error: msg });
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
