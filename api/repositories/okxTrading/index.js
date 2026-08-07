/**
 * Data-access layer for the OKX.AI Trading Hackathon agent.
 * Thin wrappers over the Mongoose models so services stay persistence-agnostic.
 */
import OkxTradingConfig from "../../models/okxTrading/OkxTradingConfig.js";
import OkxTradingPosition from "../../models/okxTrading/OkxTradingPosition.js";
import OkxTradingTrade from "../../models/okxTrading/OkxTradingTrade.js";
import OkxTradingSnapshot from "../../models/okxTrading/OkxTradingSnapshot.js";

export const okxTradingConfigRepo = {
  async get() {
    const existing = await OkxTradingConfig.findById("singleton");
    if (existing) return existing;
    return OkxTradingConfig.create({ _id: "singleton" });
  },
  async patch(update) {
    return OkxTradingConfig.findByIdAndUpdate(
      "singleton",
      { $set: update },
      { new: true, upsert: true },
    );
  },
};

export const okxTradingPositionRepo = {
  async listOpen() {
    return OkxTradingPosition.find({ status: "open" }).lean();
  },
  async findOpenByToken(token) {
    return OkxTradingPosition.findOne({ token, status: "open" });
  },
  async create(doc) {
    return OkxTradingPosition.create(doc);
  },
  async save(pos) {
    return pos.save();
  },
  async listRecent(limit = 50) {
    return OkxTradingPosition.find().sort({ createdAt: -1 }).limit(limit).lean();
  },
};

export const okxTradingTradeRepo = {
  async create(doc) {
    return OkxTradingTrade.create(doc);
  },
  async list({ limit = 50, offset = 0, status } = {}) {
    const q = status ? { status } : {};
    return OkxTradingTrade.find(q)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean();
  },
  async count() {
    return OkxTradingTrade.countDocuments({ status: "filled" });
  },
};

export const okxTradingSnapshotRepo = {
  async create(doc) {
    return OkxTradingSnapshot.create(doc);
  },
  async getLatest() {
    return OkxTradingSnapshot.findOne().sort({ createdAt: -1 }).lean();
  },
  async listRecent(limit = 100) {
    return OkxTradingSnapshot.find().sort({ createdAt: -1 }).limit(limit).lean();
  },
};
