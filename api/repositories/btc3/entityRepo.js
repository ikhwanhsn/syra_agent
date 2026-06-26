import Btc3Entity from "../../models/btc3/Entity.js";

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const entityRepo = {
  async upsertEntity({ name, type, articleId = null, macroEventId = null }) {
    const normalizedName = normalizeName(name);
    if (!normalizedName) return null;

    const update = {
      $setOnInsert: { name, normalizedName, type },
      $inc: { mentionCount: 1 },
    };
    if (articleId) update.$addToSet = { ...(update.$addToSet || {}), articleIds: articleId };
    if (macroEventId) {
      update.$addToSet = { ...(update.$addToSet || {}), macroEventIds: macroEventId };
    }

    return Btc3Entity.findOneAndUpdate({ normalizedName, type }, update, {
      upsert: true,
      new: true,
    });
  },

  async list({ limit = 50, offset = 0, type = null, search = "" } = {}) {
    const filter = {};
    if (type) filter.type = type;
    if (search) {
      filter.normalizedName = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    }
    const [items, total] = await Promise.all([
      Btc3Entity.find(filter).sort({ mentionCount: -1 }).skip(offset).limit(limit).lean(),
      Btc3Entity.countDocuments(filter),
    ]);
    return { items, total };
  },
};
