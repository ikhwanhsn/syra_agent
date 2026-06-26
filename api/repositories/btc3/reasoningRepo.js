import Btc3Reasoning from "../../models/btc3/Reasoning.js";

export const reasoningRepo = {
  async create(doc) {
    return Btc3Reasoning.create(doc);
  },

  async findLatest(limit = 10) {
    return Btc3Reasoning.find().sort({ createdAt: -1 }).limit(limit).lean();
  },

  async findByMacroEventId(macroEventId) {
    return Btc3Reasoning.findOne({ macroEventId }).sort({ createdAt: -1 }).lean();
  },

  async findById(id) {
    return Btc3Reasoning.findById(id).lean();
  },
};
