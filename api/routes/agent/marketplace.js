import express from 'express';
import MarketplacePreferences from '../../models/agent/MarketplacePreferences.js';

const router = express.Router();
const MAX_RECENT = 10;

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
