import Btc3MacroEvent from "../../models/btc3/MacroEvent.js";

export const macroEventRepo = {
  async findByClusterKey(clusterKey) {
    return Btc3MacroEvent.findOne({ clusterKey }).lean();
  },

  async upsertEvent(doc) {
    return Btc3MacroEvent.findOneAndUpdate(
      { clusterKey: doc.clusterKey },
      { $set: doc },
      { upsert: true, new: true },
    );
  },

  async list({ limit = 20, offset = 0, status = null } = {}) {
    const filter = {};
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      Btc3MacroEvent.find(filter).sort({ publishedAt: -1 }).skip(offset).limit(limit).lean(),
      Btc3MacroEvent.countDocuments(filter),
    ]);
    return { items, total };
  },

  async findById(id) {
    return Btc3MacroEvent.findById(id).lean();
  },

  async updateById(id, patch) {
    return Btc3MacroEvent.findByIdAndUpdate(id, { $set: patch }, { new: true });
  },

  async findPendingProcessing(limit = 10) {
    return Btc3MacroEvent.find({ status: { $in: ["clustered", "classified", "embedded"] } })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .lean();
  },
};
