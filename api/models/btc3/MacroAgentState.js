import mongoose from "mongoose";

const macroAgentStateSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "singleton" },
    title: { type: String, default: "Macro Intelligence Agent" },
    activeExperimentId: { type: String, default: null, index: true },
    startedAt: { type: Date, default: null },
    simConfig: {
      startingBankUsd: { type: Number, default: 1000 },
      initialBtcPct: { type: Number, default: 40 },
      minRebalancePct: { type: Number, default: 2 },
      paperAutoExecute: { type: Boolean, default: true },
    },
    paperPortfolio: {
      usdcAmount: { type: Number, default: 0 },
      btcAmount: { type: Number, default: 0 },
      startingEquityUsd: { type: Number, default: 1000 },
      lastMarkPriceUsd: { type: Number, default: null },
      rebalanceCount: { type: Number, default: 0 },
    },
    lastScanAt: { type: Date, default: null },
    lastPipelineRunId: { type: String, default: null },
    lastPipelineStatus: { type: String, enum: ["idle", "running", "success", "partial", "failed"], default: "idle" },
    articlesProcessed: { type: Number, default: 0 },
    articlesTotal: { type: Number, default: 0 },
    predictionsGenerated: { type: Number, default: 0 },
    macroRegime: { type: String, default: "unknown" },
    marketRegime: { type: String, default: "unknown" },
    currentConfidence: { type: Number, default: 0 },
    currentRecommendation: {
      btcPct: { type: Number, default: 40 },
      usdcPct: { type: Number, default: 60 },
    },
    latestDecisionId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3AllocationDecision", default: null },
    latestReasoningId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3Reasoning", default: null },
    latestPredictionId: { type: mongoose.Schema.Types.ObjectId, ref: "Btc3Prediction", default: null },
    portfolio: {
      btcPct: { type: Number, default: 40 },
      usdcPct: { type: Number, default: 60 },
      totalUsd: { type: Number, default: 10_000 },
    },
    targetPortfolio: {
      btcPct: { type: Number, default: 40 },
      usdcPct: { type: Number, default: 60 },
    },
    runtimeConfig: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { collection: "btc3_macro_agent_state" },
);

const Btc3MacroAgentState =
  mongoose.models.Btc3MacroAgentState ||
  mongoose.model("Btc3MacroAgentState", macroAgentStateSchema);

export default Btc3MacroAgentState;
