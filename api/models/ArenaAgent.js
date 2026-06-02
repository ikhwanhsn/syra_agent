/**
 * Syra Alpha Arena agent — NL strategy, Playbook backtest, paper loop, 8004 identity.
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
    regime: {
      type: String,
      enum: ["adaptive", "trend", "mean_reversion", "flat"],
      default: "adaptive",
    },
    marketType: { type: String, enum: ["contract", "spot"], default: "contract" },
    allowShort: { type: Boolean, default: true },
    overlayMinBias: { type: Number, default: -0.35 },
  },
  { _id: false },
);

const playbookSchema = new mongoose.Schema(
  {
    strategyId: { type: String, default: null },
    draftId: { type: String, default: null },
    versionId: { type: String, default: null },
    version: { type: String, default: null },
    slug: { type: String, default: null },
    uploadStatus: { type: String, default: null },
    backtestRunId: { type: String, default: null },
    backtestStatus: { type: String, default: null },
    metrics: { type: mongoose.Schema.Types.Mixed, default: null },
    instanceId: { type: String, default: null },
    error: { type: String, default: null },
  },
  { _id: false },
);

const overlaySchema = new mongoose.Schema(
  {
    bias: { type: Number, default: 0 },
    biasLabel: { type: String, default: "neutral" },
    gatePass: { type: Boolean, default: true },
    components: { type: mongoose.Schema.Types.Mixed, default: null },
    computedAt: { type: Date, default: null },
  },
  { _id: false },
);

const asset8004Schema = new mongoose.Schema(
  {
    asset: { type: String, default: null },
    tokenUri: { type: String, default: null },
    registerSignature: { type: String, default: null },
    registeredAt: { type: Date, default: null },
  },
  { _id: false },
);

const subscriberSchema = new mongoose.Schema(
  {
    subscriberId: { type: String, required: true },
    instanceId: { type: String, default: null },
    subscribedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const arenaAgentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    prompt: { type: String, required: true },
    strategySpec: { type: strategySpecSchema, required: true },
    bitgetVibeSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BitgetVibeSession",
      default: null,
      index: true,
    },
    playbook: { type: playbookSchema, default: () => ({}) },
    alphaOverlay: { type: overlaySchema, default: () => ({}) },
    publishStatus: {
      type: String,
      enum: ["draft", "backtested", "published", "failed"],
      default: "draft",
      index: true,
    },
    asset8004: { type: asset8004Schema, default: () => ({}) },
    subscribers: { type: [subscriberSchema], default: [] },
    subscriberCount: { type: Number, default: 0 },
    ownerWalletAddress: { type: String, default: null, sparse: true },
    shareSlug: { type: String, default: null, unique: true, sparse: true },
    /** Composite rank: backtest return + paper return + subscribers */
    rankScore: { type: Number, default: 0, index: true },
    paperReturnPct: { type: Number, default: null },
    paperWinRatePct: { type: Number, default: null },
    isSeed: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "paused"], default: "active" },
  },
  { timestamps: true },
);

arenaAgentSchema.index({ rankScore: -1, updatedAt: -1 });
arenaAgentSchema.index({ publishStatus: 1, rankScore: -1 });

const ArenaAgent =
  mongoose.models.ArenaAgent || mongoose.model("ArenaAgent", arenaAgentSchema);

export default ArenaAgent;
