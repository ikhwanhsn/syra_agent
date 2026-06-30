import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

const lpRealDecisionLogSchema = new mongoose.Schema(
  {
    experimentId: { type: String, required: true, index: true },
    agentAddress: { type: String, default: null, index: true },
    action: {
      type: String,
      required: true,
      enum: ["deploy", "close", "skip", "no_deploy", "evolve"],
      index: true,
    },
    poolAddress: { type: String, default: null, index: true },
    poolName: { type: String, default: null },
    positionId: { type: String, default: null },
    strategyId: { type: Number, default: null },
    summary: { type: String, required: true },
    reason: { type: String, default: null },
    keyRisks: { type: [String], default: [] },
    signals: { type: mongoose.Schema.Types.Mixed, default: null },
    metrics: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { collection: "lp_real_decision_logs", timestamps: true },
);

lpRealDecisionLogSchema.index({ createdAt: -1 });
lpRealDecisionLogSchema.index({ experimentId: 1, createdAt: -1 });
lpRealDecisionLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ttlExpireSeconds("LP_REAL_DECISION_LOG_TTL_DAYS", 60) },
);

if (mongoose.models.LpRealDecisionLog) {
  delete mongoose.models.LpRealDecisionLog;
}

const LpRealDecisionLog = mongoose.model("LpRealDecisionLog", lpRealDecisionLogSchema);
export default LpRealDecisionLog;
