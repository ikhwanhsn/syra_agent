import Btc3Prediction from "../../models/btc3/Prediction.js";

export const predictionRepo = {
  async create(doc) {
    return Btc3Prediction.create(doc);
  },

  async findLatest(limit = 10) {
    return Btc3Prediction.find().sort({ createdAt: -1 }).limit(limit).lean();
  },

  async findByMacroEventId(macroEventId) {
    return Btc3Prediction.findOne({ macroEventId }).sort({ createdAt: -1 }).lean();
  },
};
