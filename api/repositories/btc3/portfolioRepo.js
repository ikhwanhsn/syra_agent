import Btc3PortfolioSnapshot from "../../models/btc3/PortfolioSnapshot.js";

export const portfolioRepo = {
  async createSnapshot(doc) {
    return Btc3PortfolioSnapshot.create(doc);
  },

  async findLatest(limit = 30) {
    return Btc3PortfolioSnapshot.find().sort({ createdAt: -1 }).limit(limit).lean();
  },

  async getLatest() {
    return Btc3PortfolioSnapshot.findOne().sort({ createdAt: -1 }).lean();
  },
};
