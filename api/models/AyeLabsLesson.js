import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

/**
 * Autolearn journal: one short lesson per closed AyeLabs run.
 * Feeds pool-memory penalties and future strategy tuning so the desk remembers what lost.
 */
const ayelabsLessonSchema = new mongoose.Schema(
  {
    experimentId: { type: String, default: null, index: true },
    poolAddress: { type: String, default: null, index: true },
    poolName: { type: String, default: null },
    /** Human-readable takeaway (e.g. "Deep OOR loss on thin pool; widen bins"). */
    lesson: { type: String, required: true },
    closeReason: { type: String, default: null },
    pnlSol: { type: Number, default: 0 },
    strategyId: { type: Number, default: null, min: 0, max: 99, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "ayelabs_lessons" },
);

ayelabsLessonSchema.index({ strategyId: 1, createdAt: -1 });
// TTL: prune old lessons (default 90 days)
ayelabsLessonSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ttlExpireSeconds("MERIDIAN_LESSON_TTL_DAYS", 90) },
);

const AyeLabsLesson =
  mongoose.models.AyeLabsLesson || mongoose.model("AyeLabsLesson", ayelabsLessonSchema);

export default AyeLabsLesson;
