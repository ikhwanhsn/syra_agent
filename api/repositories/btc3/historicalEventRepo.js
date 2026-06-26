import Btc3HistoricalEvent from "../../models/btc3/HistoricalEvent.js";

export const historicalEventRepo = {
  async create(doc) {
    return Btc3HistoricalEvent.create(doc);
  },

  async list({ limit = 50, offset = 0 } = {}) {
    const [items, total] = await Promise.all([
      Btc3HistoricalEvent.find().sort({ eventDate: -1 }).skip(offset).limit(limit).lean(),
      Btc3HistoricalEvent.countDocuments(),
    ]);
    return { items, total };
  },

  async findWithEmbeddings() {
    return Btc3HistoricalEvent.find().populate("embeddingRefId").lean();
  },

  async seedDefaults(events) {
    for (const ev of events) {
      const exists = await Btc3HistoricalEvent.findOne({ title: ev.title }).lean();
      if (!exists) {
        await Btc3HistoricalEvent.create(ev);
      }
    }
  },
};
