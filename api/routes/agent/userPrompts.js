import express from 'express';
import UserPrompt, { VALID_CATEGORIES } from '../../models/agent/UserPrompt.js';

const router = express.Router();

/**
 * GET /agent/marketplace/prompts
 * List all user-created prompts (for discovery). Query: category (optional), limit (default 50), skip (default 0).
 */
router.get('/', async (req, res) => {
  try {
    const { category, limit = 50, skip = 0 } = req.query;
    const filter = {};
    if (category && VALID_CATEGORIES.includes(category)) {
      filter.category = category;
    }
    const limitNum = Math.min(Math.max(Number(limit) || 50, 1), 100);
    const skipNum = Math.max(Number(skip) || 0, 0);

    const prompts = await UserPrompt.find(filter)
      .sort({ useCount: -1, updatedAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const items = prompts.map((p) => ({
      id: String(p._id),
      anonymousId: p.anonymousId,
      title: p.title,
      description: p.description ?? '',
      prompt: p.prompt,
      category: p.category,
      useCount: p.useCount ?? 0,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return res.json({ success: true, prompts: items });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/marketplace/prompts
 * Create a user prompt. Body: { anonymousId, title, description?, prompt, category? }
 */
router.post('/', async (req, res) => {
  try {
    const { anonymousId, title, description, prompt, category } = req.body || {};
    if (!anonymousId?.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    if (!title?.trim()) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }
    if (!prompt?.trim()) {
      return res.status(400).json({ success: false, error: 'prompt is required' });
    }

    const doc = new UserPrompt({
      anonymousId: anonymousId.trim(),
      title: String(title).trim(),
      description: description != null ? String(description).trim() : '',
      prompt: String(prompt).trim(),
      category: category && VALID_CATEGORIES.includes(category) ? category : 'general',
    });
    await doc.save();

    const item = {
      id: String(doc._id),
      anonymousId: doc.anonymousId,
      title: doc.title,
      description: doc.description ?? '',
      prompt: doc.prompt,
      category: doc.category,
      useCount: doc.useCount ?? 0,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
    return res.status(201).json({ success: true, prompt: item });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/marketplace/prompts/bulk-delete
 * Delete multiple prompts (only those owned by anonymousId). Body: { anonymousId, ids: string[] }
 */
router.post('/bulk-delete', async (req, res) => {
  try {
    const { anonymousId, ids } = req.body || {};
    if (!anonymousId?.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }
    const idList = Array.isArray(ids) ? ids.filter((id) => id && String(id).trim()) : [];
    if (idList.length === 0) {
      return res.json({ success: true, deleted: 0 });
    }
    const result = await UserPrompt.deleteMany({
      _id: { $in: idList },
      anonymousId: anonymousId.trim(),
    });
    return res.json({ success: true, deleted: result.deletedCount ?? 0 });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /agent/marketplace/prompts/:id
 * Get a single user prompt by id.
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await UserPrompt.findById(id).lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Prompt not found' });
    }
    return res.json({
      success: true,
      prompt: {
        id: String(doc._id),
        anonymousId: doc.anonymousId,
        title: doc.title,
        description: doc.description ?? '',
        prompt: doc.prompt,
        category: doc.category,
        useCount: doc.useCount ?? 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /agent/marketplace/prompts/:id
 * Update a user prompt (only if anonymousId matches creator). Body: { anonymousId, title?, description?, prompt?, category? }
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { anonymousId, title, description, prompt, category } = req.body || {};
    if (!anonymousId?.trim()) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }

    const doc = await UserPrompt.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Prompt not found' });
    }
    if (doc.anonymousId !== anonymousId.trim()) {
      return res.status(403).json({ success: false, error: 'You can only edit your own prompts' });
    }

    if (title !== undefined) doc.title = String(title).trim();
    if (description !== undefined) doc.description = String(description).trim();
    if (prompt !== undefined) doc.prompt = String(prompt).trim();
    if (category !== undefined && VALID_CATEGORIES.includes(category)) {
      doc.category = category;
    }
    await doc.save();

    return res.json({
      success: true,
      prompt: {
        id: String(doc._id),
        anonymousId: doc.anonymousId,
        title: doc.title,
        description: doc.description ?? '',
        prompt: doc.prompt,
        category: doc.category,
        useCount: doc.useCount ?? 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /agent/marketplace/prompts/:id
 * Delete a user prompt (only if anonymousId matches creator). Query: anonymousId
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const anonymousId = (req.query.anonymousId ?? req.body?.anonymousId)?.trim();
    if (!anonymousId) {
      return res.status(400).json({ success: false, error: 'anonymousId is required' });
    }

    const doc = await UserPrompt.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Prompt not found' });
    }
    if (doc.anonymousId !== anonymousId) {
      return res.status(403).json({ success: false, error: 'You can only delete your own prompts' });
    }

    await UserPrompt.findByIdAndDelete(id);
    return res.json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /agent/marketplace/prompts/:id/use
 * Record that this prompt was used (increments useCount). Body: { anonymousId? } (optional, for analytics later).
 */
router.post('/:id/use', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await UserPrompt.findByIdAndUpdate(
      id,
      { $inc: { useCount: 1 } },
      { new: true }
    ).lean();
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Prompt not found' });
    }
    return res.json({
      success: true,
      useCount: doc.useCount ?? 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export async function createUserPromptsRouter() {
  return router;
}

export default router;
