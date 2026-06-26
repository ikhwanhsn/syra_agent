import Btc3NewsSource from "../../models/btc3/NewsSource.js";

export const newsSourceRepo = {
  async upsertProvider(doc) {
    return Btc3NewsSource.findOneAndUpdate(
      { providerId: doc.providerId },
      { $set: doc },
      { upsert: true, new: true },
    );
  },

  async listAll() {
    return Btc3NewsSource.find().sort({ name: 1 }).lean();
  },

  async updateFetchStatus(providerId, { lastError = null, articlesFetched = 0 } = {}) {
    return Btc3NewsSource.findOneAndUpdate(
      { providerId },
      {
        $set: {
          lastFetchAt: new Date(),
          lastError,
        },
        $inc: { articlesFetched },
      },
      { new: true },
    );
  },
};
