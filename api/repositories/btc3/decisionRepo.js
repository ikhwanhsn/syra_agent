import Btc3AllocationDecision from "../../models/btc3/AllocationDecision.js";

export const decisionRepo = {
  async create(doc) {
    return Btc3AllocationDecision.create(doc);
  },

  async findLatest(limit = 10) {
    return Btc3AllocationDecision.find().sort({ createdAt: -1 }).limit(limit).lean();
  },

  async findById(id) {
    return Btc3AllocationDecision.findById(id).lean();
  },

  async approve(id, approvedBy = "admin") {
    return Btc3AllocationDecision.findByIdAndUpdate(
      id,
      { $set: { status: "approved", approvedAt: new Date(), approvedBy } },
      { new: true },
    );
  },

  async getLatestPending() {
    return Btc3AllocationDecision.findOne({ status: "pending" }).sort({ createdAt: -1 }).lean();
  },
};
