/**
 * Bitget Vibe Trader session — NL strategy + paper/live loop state.
 */
import mongoose from "mongoose";

const strategySpecSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    token: { type: String, required: true },
    bar: { type: String, required: true },
    limit: { type: Number, required: true },
    lookAheadBars: { type: Number, required: true },
    entryCondition: { type: String, default: "" },
    minRsi: { type: Number, default: null },
    maxRsi: { type: Number, default: null },
    takeProfitPct: { type: Number, default: null },
    stopLossPct: { type: Number, default: null },
    maxNotionalUsd: { type: Number, default: null },
  },
  { _id: false },
);

const loopStepSchema = new mongoose.Schema(
  {
    phase: {
      type: String,
      enum: ["perceive", "decide", "risk", "execute", "manage", "exit", "skip"],
      required: true,
    },
    message: { type: String, default: "" },
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const bitgetVibeSessionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    prompt: { type: String, required: true },
    strategySpec: { type: strategySpecSchema, required: true },
    mode: { type: String, enum: ["paper", "live"], default: "paper" },
    status: {
      type: String,
      enum: ["active", "paused", "stopped"],
      default: "active",
      index: true,
    },
    walletAddress: { type: String, default: null, index: true, sparse: true },
    startingUsd: { type: Number, default: 1000 },
    cashUsd: { type: Number, default: 1000 },
    realizedPnlUsd: { type: Number, default: 0 },
    tickCount: { type: Number, default: 0 },
    lastTickAt: { type: Date, default: null },
    lastPerception: { type: mongoose.Schema.Types.Mixed, default: null },
    lastLoopSteps: { type: [loopStepSchema], default: [] },
    shareSlug: { type: String, default: null, unique: true, sparse: true },
  },
  { timestamps: true },
);

bitgetVibeSessionSchema.index({ createdAt: -1 });
bitgetVibeSessionSchema.index({ status: 1, updatedAt: -1 });

const BitgetVibeSession =
  mongoose.models.BitgetVibeSession ||
  mongoose.model("BitgetVibeSession", bitgetVibeSessionSchema);

export default BitgetVibeSession;
