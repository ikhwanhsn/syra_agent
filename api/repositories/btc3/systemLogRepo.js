import Btc3SystemLog from "../../models/btc3/SystemLog.js";

export const systemLogRepo = {
  async append({ step, level = "info", message, meta = null, pipelineRunId = null, durationMs = null }) {
    return Btc3SystemLog.create({ step, level, message, meta, pipelineRunId, durationMs });
  },

  async list({ limit = 50, offset = 0, pipelineRunId = null } = {}) {
    const filter = {};
    if (pipelineRunId) filter.pipelineRunId = pipelineRunId;
    const [items, total] = await Promise.all([
      Btc3SystemLog.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
      Btc3SystemLog.countDocuments(filter),
    ]);
    return { items, total };
  },
};
