import express from 'express';
import Skill, { VALID_SKILL_CATEGORIES } from '../../models/agent/Skill.js';
import { requireSession, optionalWalletSession } from '../../utils/requireSession.js';
import { isMongooseConnected } from '../../config/mongoose.js';
import {
  slugifyTitle,
  resolveCreatorEarnPayTo,
  encryptUpstreamHeaders,
  serializeSkill,
} from '../../libs/skillService.js';
import { validateUpstreamUrl } from '../../libs/skillUpstreamGuard.js';
import { baseAnonymousIdFrom, ownsAgentWalletSibling } from '../../libs/agentWalletPurpose.js';

const router = express.Router();

function requireDb(_req, res, next) {
  if (!isMongooseConnected()) {
    return res.status(503).json({ success: false, error: 'Database not connected' });
  }
  return next();
}

function getBaseUrl() {
  return process.env.BASE_URL?.trim() || 'https://api.syraa.fun';
}

function assertCreator(req, res, creatorAnonymousId) {
  const sessionAid = req.user?.anonymousId;
  if (!sessionAid) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return false;
  }
  if (!ownsAgentWalletSibling(sessionAid, creatorAnonymousId)) {
    res.status(403).json({ success: false, error: 'You can only manage your own skills' });
    return false;
  }
  return true;
}

/**
 * GET /agent/marketplace/skills/mine
 * List skills owned by the authenticated creator.
 */
router.get('/mine', requireSession(), requireDb, async (req, res) => {
  try {
    const anonymousId = req.user?.anonymousId;
    if (!anonymousId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const base = baseAnonymousIdFrom(anonymousId);
    const skills = await Skill.find({ creatorAnonymousId: base }).sort({ updatedAt: -1 }).lean();
    return res.json({
      success: true,
      data: skills.map((s) => serializeSkill(s, getBaseUrl())),
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * GET /agent/marketplace/skills
 * Discovery list (published only).
 */
router.get('/', requireDb, async (req, res) => {
  try {
    const { category, limit = 50, skip = 0 } = req.query;
    const filter = { status: 'published' };
    if (category && VALID_SKILL_CATEGORIES.includes(String(category))) {
      filter.category = String(category);
    }
    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const skipNum = Math.max(Number(skip) || 0, 0);

    const skills = await Skill.find(filter)
      .sort({ useCount: -1, updatedAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    return res.json({
      success: true,
      data: skills.map((s) => serializeSkill(s, getBaseUrl())),
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * POST /agent/marketplace/skills
 * Create a draft skill.
 */
router.post('/', requireSession(), requireDb, async (req, res) => {
  try {
    const anonymousId = req.user?.anonymousId;
    if (!anonymousId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const {
      title,
      description,
      category,
      upstreamUrl,
      upstreamMethod,
      upstreamHeaders,
      inputSchema,
      outputSchema,
      priceUsd,
      slug: requestedSlug,
    } = req.body || {};

    if (!title?.trim()) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }
    if (!upstreamUrl?.trim()) {
      return res.status(400).json({ success: false, error: 'upstreamUrl is required' });
    }

    const urlCheck = await validateUpstreamUrl(upstreamUrl);
    if (!urlCheck.ok) {
      return res.status(400).json({ success: false, error: urlCheck.error });
    }

    const price = Number(priceUsd);
    if (!Number.isFinite(price) || price < 0.001) {
      return res.status(400).json({ success: false, error: 'priceUsd must be at least 0.001' });
    }

    const method = String(upstreamMethod || 'GET').toUpperCase();
    if (method !== 'GET' && method !== 'POST') {
      return res.status(400).json({ success: false, error: 'upstreamMethod must be GET or POST' });
    }

    const base = baseAnonymousIdFrom(anonymousId);
    const slug = requestedSlug?.trim()
      ? String(requestedSlug).trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
      : slugifyTitle(title);

    const existing = await Skill.findOne({ slug }).lean();
    if (existing) {
      return res.status(409).json({ success: false, error: 'slug already taken' });
    }

    const doc = await Skill.create({
      creatorAnonymousId: base,
      slug,
      title: String(title).trim(),
      description: description != null ? String(description).trim() : '',
      category: category && VALID_SKILL_CATEGORIES.includes(category) ? category : 'general',
      upstreamUrl: urlCheck.url.toString(),
      upstreamMethod: method,
      upstreamHeadersEnc: encryptUpstreamHeaders(upstreamHeaders),
      inputSchema: inputSchema && typeof inputSchema === 'object' ? inputSchema : {},
      outputSchema: outputSchema && typeof outputSchema === 'object' ? outputSchema : {},
      priceUsd: price,
      status: 'draft',
    });

    return res.status(201).json({
      success: true,
      data: serializeSkill(doc.toObject(), getBaseUrl()),
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * GET /agent/marketplace/skills/:id
 */
router.get('/:id', optionalWalletSession(), requireDb, async (req, res) => {
  try {
    const doc = await Skill.findById(req.params.id).lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Skill not found' });
    }
    if (doc.status !== 'published') {
      const sessionAid = req.user?.anonymousId;
      if (!sessionAid || !ownsAgentWalletSibling(sessionAid, doc.creatorAnonymousId)) {
        return res.status(404).json({ success: false, error: 'Skill not found' });
      }
    }
    return res.json({ success: true, data: serializeSkill(doc, getBaseUrl()) });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * PATCH /agent/marketplace/skills/:id
 */
router.patch('/:id', requireSession(), requireDb, async (req, res) => {
  try {
    const doc = await Skill.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Skill not found' });
    }
    if (!assertCreator(req, res, doc.creatorAnonymousId)) return;

    const {
      title,
      description,
      category,
      upstreamUrl,
      upstreamMethod,
      upstreamHeaders,
      inputSchema,
      outputSchema,
      priceUsd,
    } = req.body || {};

    if (title !== undefined) doc.title = String(title).trim();
    if (description !== undefined) doc.description = String(description).trim();
    if (category !== undefined && VALID_SKILL_CATEGORIES.includes(category)) doc.category = category;

    if (upstreamUrl !== undefined) {
      const urlCheck = await validateUpstreamUrl(upstreamUrl);
      if (!urlCheck.ok) {
        return res.status(400).json({ success: false, error: urlCheck.error });
      }
      doc.upstreamUrl = urlCheck.url.toString();
    }

    if (upstreamMethod !== undefined) {
      const method = String(upstreamMethod).toUpperCase();
      if (method !== 'GET' && method !== 'POST') {
        return res.status(400).json({ success: false, error: 'upstreamMethod must be GET or POST' });
      }
      doc.upstreamMethod = method;
    }

    if (upstreamHeaders !== undefined) {
      doc.upstreamHeadersEnc = encryptUpstreamHeaders(upstreamHeaders);
    }

    if (inputSchema !== undefined && typeof inputSchema === 'object') doc.inputSchema = inputSchema;
    if (outputSchema !== undefined && typeof outputSchema === 'object') doc.outputSchema = outputSchema;

    if (priceUsd !== undefined) {
      const price = Number(priceUsd);
      if (!Number.isFinite(price) || price < 0.001) {
        return res.status(400).json({ success: false, error: 'priceUsd must be at least 0.001' });
      }
      doc.priceUsd = price;
    }

    await doc.save();
    return res.json({ success: true, data: serializeSkill(doc.toObject(), getBaseUrl()) });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * POST /agent/marketplace/skills/:id/publish
 */
router.post('/:id/publish', requireSession(), requireDb, async (req, res) => {
  try {
    const doc = await Skill.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Skill not found' });
    }
    if (!assertCreator(req, res, doc.creatorAnonymousId)) return;

    const urlCheck = await validateUpstreamUrl(doc.upstreamUrl);
    if (!urlCheck.ok) {
      return res.status(400).json({ success: false, error: urlCheck.error });
    }

    const { payToAddress } = await resolveCreatorEarnPayTo(doc.creatorAnonymousId);
    doc.payToAddress = payToAddress;
    doc.payToChain = 'solana';
    doc.status = 'published';
    await doc.save();

    return res.json({ success: true, data: serializeSkill(doc.toObject(), getBaseUrl()) });
  } catch (e) {
    return res.status(400).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * POST /agent/marketplace/skills/:id/unpublish
 */
router.post('/:id/unpublish', requireSession(), requireDb, async (req, res) => {
  try {
    const doc = await Skill.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Skill not found' });
    }
    if (!assertCreator(req, res, doc.creatorAnonymousId)) return;

    doc.status = 'draft';
    await doc.save();
    return res.json({ success: true, data: serializeSkill(doc.toObject(), getBaseUrl()) });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

/**
 * DELETE /agent/marketplace/skills/:id
 */
router.delete('/:id', requireSession(), requireDb, async (req, res) => {
  try {
    const doc = await Skill.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Skill not found' });
    }
    if (!assertCreator(req, res, doc.creatorAnonymousId)) return;

    await Skill.findByIdAndDelete(doc._id);
    return res.json({ success: true });
  } catch (e) {
    return res.status(500).json({ success: false, error: e instanceof Error ? e.message : String(e) });
  }
});

export async function createAgentSkillsRouter() {
  return router;
}

export default router;
