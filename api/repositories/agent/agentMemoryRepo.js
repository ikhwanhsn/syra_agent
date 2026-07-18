import AgentMemory from '../../models/agent/AgentMemory.js';

export const agentMemoryRepo = {
  /**
   * @param {object} doc
   */
  async create(doc) {
    return AgentMemory.create(doc);
  },

  /**
   * @param {string} anonymousId
   * @param {{ limit?: number; chatId?: string }} [opts]
   */
  async findByAnonymousId(anonymousId, opts = {}) {
    const limit = Math.min(500, Math.max(1, opts.limit ?? 100));
    /** @type {Record<string, unknown>} */
    const filter = { anonymousId: String(anonymousId).trim() };
    if (opts.chatId) filter.chatId = String(opts.chatId).trim();
    return AgentMemory.find(filter).sort({ createdAt: -1 }).limit(limit).lean();
  },

  /**
   * Vectors for Mongo cosine fallback (scoped to one user).
   * @param {string} anonymousId
   * @param {{ limit?: number }} [opts]
   */
  async findAllWithVectors(anonymousId, opts = {}) {
    const limit = Math.min(2000, Math.max(1, opts.limit ?? 500));
    return AgentMemory.find({
      anonymousId: String(anonymousId).trim(),
      status: 'stored',
      embedding: { $exists: true, $ne: [] },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },

  /**
   * @param {string} id
   * @param {object} patch
   */
  async updateById(id, patch) {
    return AgentMemory.findByIdAndUpdate(id, { $set: patch }, { new: true });
  },

  /**
   * Soft prune: delete oldest memories beyond keepLimit for a user.
   * TTL index also expires by createdAt.
   * @param {string} anonymousId
   * @param {number} keepLimit
   */
  async pruneOldest(anonymousId, keepLimit = 500) {
    const aid = String(anonymousId).trim();
    const keep = Math.max(50, keepLimit);
    const excess = await AgentMemory.find({ anonymousId: aid })
      .sort({ createdAt: -1 })
      .skip(keep)
      .select('_id')
      .lean();
    if (!excess.length) return { deleted: 0 };
    const ids = excess.map((d) => d._id);
    const result = await AgentMemory.deleteMany({ _id: { $in: ids } });
    return { deleted: result.deletedCount || 0 };
  },
};
