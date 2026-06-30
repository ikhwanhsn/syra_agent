/**
 * BTC3 Macro Intelligence — read API service layer.
 */

import { isMongooseConnected } from "../../config/mongoose.js";
import {
  getBtc3PaperRebalances,
  getBtc3PaperStats,
  getBtc3PaperState,
  markPaperPortfolioToMarket,
} from "./btc3PaperTradingService.js";
import {
  getBtc3LearningSnapshot,
  runBtc3Learning,
} from "./btc3LearningService.js";
import {
  agentStateRepo,
  articleRepo,
  macroEventRepo,
  entityRepo,
  reasoningRepo,
  predictionRepo,
  portfolioRepo,
  decisionRepo,
  executionRepo,
  systemLogRepo,
  newsSourceRepo,
  historicalEventRepo,
} from "../../repositories/btc3/index.js";

export async function getBtc3Overview() {
  if (!isMongooseConnected()) {
    return { ready: false, reason: "database_unavailable" };
  }

  const state = await agentStateRepo.getState();
  const paperStats = await getBtc3PaperStats().catch(() => null);
  const latestDecision = state.latestDecisionId
    ? await decisionRepo.findById(state.latestDecisionId)
    : null;
  const articlesTotal = await articleRepo.countAll();

  return {
    ready: true,
    title: state.title,
    lastScanAt: state.lastScanAt,
    lastPipelineStatus: state.lastPipelineStatus,
    lastPipelineRunId: state.lastPipelineRunId,
    articlesProcessed: state.articlesProcessed,
    articlesTotal,
    predictionsGenerated: state.predictionsGenerated,
    macroRegime: state.macroRegime,
    marketRegime: state.marketRegime,
    currentConfidence: state.currentConfidence,
    currentRecommendation: state.currentRecommendation,
    portfolio: state.portfolio,
    targetPortfolio: state.targetPortfolio,
    latestDecision,
    paper: paperStats,
  };
}

export async function getBtc3State() {
  if (!isMongooseConnected()) {
    return { ready: false, reason: "database_unavailable" };
  }

  const [overview, news, events, entities, reasoning, predictions, portfolio, executions, logs, settings, paperRebalances] =
    await Promise.all([
      getBtc3Overview(),
      getBtc3News({ limit: 20 }),
      getBtc3Events({ limit: 10 }),
      getBtc3Entities({ limit: 30 }),
      getBtc3Reasoning({ limit: 5 }),
      getBtc3Predictions({ limit: 5 }),
      getBtc3Portfolio(),
      getBtc3Executions({ limit: 10 }),
      getBtc3Logs({ limit: 30 }),
      getBtc3Settings(),
      getBtc3PaperRebalances({ limit: 20 }),
    ]);

  const similarity = await getBtc3Similarity();

  return {
    ready: true,
    overview,
    news,
    events,
    entities,
    similarity,
    reasoning,
    predictions,
    portfolio,
    executions,
    logs,
    settings,
    paperRebalances,
    fetchedAt: new Date().toISOString(),
  };
}

export async function getBtc3News({ limit = 20, offset = 0, search = "", providerId = null } = {}) {
  if (!isMongooseConnected()) return { items: [], total: 0, ready: false };
  const result = await articleRepo.list({ limit, offset, search, providerId });
  return { ...result, ready: true };
}

export async function getBtc3Events({ limit = 20, offset = 0 } = {}) {
  if (!isMongooseConnected()) return { items: [], total: 0, ready: false };
  const result = await macroEventRepo.list({ limit, offset });
  return { ...result, ready: true };
}

export async function getBtc3Entities({ limit = 50, offset = 0, type = null, search = "" } = {}) {
  if (!isMongooseConnected()) return { items: [], total: 0, ready: false };
  const result = await entityRepo.list({ limit, offset, type, search });
  return { ...result, ready: true };
}

export async function getBtc3Reasoning({ limit = 10 } = {}) {
  if (!isMongooseConnected()) return { items: [], ready: false };
  const items = await reasoningRepo.findLatest(limit);
  return { items, ready: true };
}

export async function getBtc3Predictions({ limit = 10 } = {}) {
  if (!isMongooseConnected()) return { items: [], ready: false };
  const items = await predictionRepo.findLatest(limit);
  return { items, ready: true };
}

export async function getBtc3Portfolio() {
  if (!isMongooseConnected()) return { ready: false };
  await markPaperPortfolioToMarket().catch(() => null);
  const state = await agentStateRepo.getState();
  const paper = await getBtc3PaperState().catch(() => null);
  const snapshots = await portfolioRepo.findLatest(30);
  const latestDecision = state.latestDecisionId
    ? await decisionRepo.findById(state.latestDecisionId)
    : null;
  return {
    ready: true,
    current: state.portfolio,
    target: state.targetPortfolio,
    snapshots,
    latestDecision,
    paper,
  };
}

export async function getBtc3Executions({ limit = 20 } = {}) {
  if (!isMongooseConnected()) return { items: [], ready: false };
  const items = await executionRepo.findLatest(limit);
  return { items, ready: true };
}

export async function getBtc3Logs({ limit = 50, offset = 0 } = {}) {
  if (!isMongooseConnected()) return { items: [], total: 0, ready: false };
  const result = await systemLogRepo.list({ limit, offset });
  return { ...result, ready: true };
}

export async function getBtc3Settings() {
  return { ready: true, ...getBtc3RuntimeSettings() };
}

export async function getBtc3Similarity() {
  if (!isMongooseConnected()) return { items: [], ready: false };

  const state = await agentStateRepo.getState();
  let currentEvent = null;
  let reasoning = null;

  if (state.latestReasoningId) {
    reasoning = await reasoningRepo.findById(state.latestReasoningId);
    if (reasoning?.macroEventId) {
      currentEvent = await macroEventRepo.findById(reasoning.macroEventId);
    }
  }

  const historical = await historicalEventRepo.list({ limit: 20 });

  const items = (reasoning?.historicalEvidence || []).map((ev) => ({
    currentEventTitle: currentEvent?.headline ?? null,
    similarEventTitle: ev.eventTitle,
    similarityScore: ev.similarityScore,
    btcReturn: ev.btcReturn,
    durationDays: ev.durationDays,
  }));

  if (items.length === 0 && historical.items.length > 0) {
    for (const h of historical.items.slice(0, 5)) {
      items.push({
        currentEventTitle: currentEvent?.headline ?? "Awaiting pipeline run",
        similarEventTitle: h.title,
        similarityScore: null,
        btcReturn: h.btcReturn7d ?? h.btcReturn24h,
        durationDays: h.durationDays,
      });
    }
  }

  return {
    ready: true,
    currentEvent,
    items,
    historicalEvents: historical.items,
  };
}

export async function approveBtc3Decision(decisionId, approvedBy = "admin") {
  if (!isMongooseConnected()) {
    return { success: false, error: "database_unavailable" };
  }
  const decision = await decisionRepo.approve(decisionId, approvedBy);
  if (!decision) {
    return { success: false, error: "Decision not found" };
  }
  return { success: true, decision };
}

export async function getBtc3NewsSources() {
  if (!isMongooseConnected()) return { items: [], ready: false };
  const items = await newsSourceRepo.listAll();
  return { items, ready: true };
}

export async function getBtc3PaperTrading({ limit = 25, offset = 0 } = {}) {
  if (!isMongooseConnected()) return { ready: false };
  const [paper, rebalances] = await Promise.all([
    getBtc3PaperStats(),
    getBtc3PaperRebalances({ limit, offset }),
  ]);
  return { ready: true, paper, rebalances };
}

export async function getBtc3Learning() {
  if (!isMongooseConnected()) return { ready: false, lessons: [], thresholdOverrides: {} };
  const learning = await getBtc3LearningSnapshot();
  return { ready: true, ...learning };
}

export { runBtc3Learning };
