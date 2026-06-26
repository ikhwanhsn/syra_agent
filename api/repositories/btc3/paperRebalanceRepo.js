import Btc3PaperRebalance from "../../models/btc3/PaperRebalance.js";

export const paperRebalanceRepo = {
  async create(doc) {
    return Btc3PaperRebalance.create(doc);
  },

  async list({ limit = 30, offset = 0, experimentId = null } = {}) {
    const filter = {};
    if (experimentId) filter.experimentId = experimentId;
    const [items, total] = await Promise.all([
      Btc3PaperRebalance.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      Btc3PaperRebalance.countDocuments(filter),
    ]);
    return { items, total };
  },

  async countByExperiment(experimentId) {
    return Btc3PaperRebalance.countDocuments({ experimentId, status: "executed" });
  },

  async getEquityHistory(experimentId, limit = 50) {
    return Btc3PaperRebalance.find({ experimentId, status: "executed" })
      .sort({ createdAt: 1 })
      .limit(limit)
      .select("equityUsd createdAt returnPct")
      .lean();
  },
};
