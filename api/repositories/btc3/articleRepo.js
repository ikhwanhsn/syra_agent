import Btc3Article from "../../models/btc3/Article.js";

export const articleRepo = {
  async findByExternalId(providerId, externalId) {
    return Btc3Article.findOne({ providerId, externalId }).lean();
  },

  async upsertArticle(doc) {
    return Btc3Article.findOneAndUpdate(
      { providerId: doc.providerId, externalId: doc.externalId },
      { $set: doc },
      { upsert: true, new: true },
    );
  },

  async list({ limit = 20, offset = 0, search = "", providerId = null, status = null } = {}) {
    const filter = {};
    if (providerId) filter.providerId = providerId;
    if (status) filter.status = status;
    if (search) {
      filter.$text = { $search: search };
    }
    const [items, total] = await Promise.all([
      Btc3Article.find(filter).sort({ publishedAt: -1 }).skip(offset).limit(limit).lean(),
      Btc3Article.countDocuments(filter),
    ]);
    return { items, total };
  },

  async findUnprocessed(limit = 20) {
    return Btc3Article.find({ status: { $in: ["raw", "translated", "deduplicated"] } })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
  },

  async updateById(id, patch) {
    return Btc3Article.findByIdAndUpdate(id, { $set: patch }, { new: true });
  },

  async countAll() {
    return Btc3Article.countDocuments();
  },
};
