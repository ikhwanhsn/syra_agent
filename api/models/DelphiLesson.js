import mongoose from "mongoose";
import { ttlExpireSeconds } from "../utils/mongoTtl.js";

/**
 * Autolearn journal: one short lesson per closed Delphi run.
 */
const delphiLessonSchema = new mongoose.Schema(
  {
    experimentId: { type: String, default: null, index: true },
    symbol: { type: String, default: null, index: true },
    side: { type: String, default: null },
    lesson: { type: String, required: true },
    closeReason: { type: String, default: null },
    pnlUsd: { type: Number, default: 0 },
    strategyId: { type: Number, default: null, min: 0, max: 99, index: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "delphi_lessons" },
);

delphiLessonSchema.index({ strategyId: 1, createdAt: -1 });
delphiLessonSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: ttlExpireSeconds("DELPHI_LESSON_TTL_DAYS", 90) },
);

const DelphiLesson =
  mongoose.models.DelphiLesson || mongoose.model("DelphiLesson", delphiLessonSchema);

export default DelphiLesson;
