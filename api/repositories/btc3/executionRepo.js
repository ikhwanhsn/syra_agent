import Btc3Execution from "../../models/btc3/Execution.js";

export const executionRepo = {
  async create(doc) {
    return Btc3Execution.create(doc);
  },

  async findLatest(limit = 20) {
    return Btc3Execution.find().sort({ createdAt: -1 }).limit(limit).lean();
  },

  async findByDecisionId(decisionId) {
    return Btc3Execution.findOne({ decisionId }).sort({ createdAt: -1 }).lean();
  },
};
