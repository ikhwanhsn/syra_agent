import mongoose from "mongoose";
import { ttlExpireSeconds } from "../../utils/mongoTtl.js";

const systemLogSchema = new mongoose.Schema(
  {
    step: { type: String, required: true, index: true },
    level: { type: String, enum: ["info", "warn", "error", "debug"], default: "info" },
    message: { type: String, required: true },
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
    pipelineRunId: { type: String, default: null, index: true },
    durationMs: { type: Number, default: null },
  },
  { timestamps: true, collection: "btc3_system_logs" },
);

systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ttlExpireSeconds("BTC3_SYSTEM_LOG_TTL_DAYS", 14) },
);

const Btc3SystemLog =
  mongoose.models.Btc3SystemLog || mongoose.model("Btc3SystemLog", systemLogSchema);

export default Btc3SystemLog;
