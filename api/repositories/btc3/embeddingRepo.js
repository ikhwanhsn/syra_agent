import Btc3EmbeddingReference from "../../models/btc3/EmbeddingReference.js";

export const embeddingRepo = {
  async create(doc) {
    return Btc3EmbeddingReference.create(doc);
  },

  async findByMacroEventId(macroEventId) {
    return Btc3EmbeddingReference.findOne({ macroEventId }).sort({ createdAt: -1 }).lean();
  },

  async findAllWithVectors() {
    return Btc3EmbeddingReference.find({ embedding: { $exists: true, $ne: [] } }).lean();
  },

  async updateById(id, patch) {
    return Btc3EmbeddingReference.findByIdAndUpdate(id, { $set: patch }, { new: true });
  },
};
