import { getApiBaseUrl } from "@/lib/chatApi";
import type {
  AllocationPct,
  Btc3AgentState,
  Btc3Article,
  Btc3Entity,
  Btc3Execution,
  Btc3MacroEvent,
  Btc3Prediction,
  Btc3Reasoning,
  Btc3Settings,
  Btc3SimilarityItem,
  Btc3SystemLog,
  Btc3PaperTrading,
  Btc3PaperRebalance,
  MacroRegime,
  MarketRegime,
  PipelineStatus,
} from "./types";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/btc3-macro`;

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (body.data === undefined) {
    throw new Error("Empty API response");
  }
  return body.data;
}

async function fetchApi<T>(path: string): Promise<T> {
  const res = await fetch(`${base()}${path}`, { credentials: "include" });
  return parseJson<T>(res);
}

export interface Btc3StateBundle {
  ready: boolean;
  overview: Record<string, unknown>;
  news: { items: Record<string, unknown>[]; total: number; ready: boolean };
  events: { items: Record<string, unknown>[]; total: number; ready: boolean };
  entities: { items: Record<string, unknown>[]; total: number; ready: boolean };
  similarity: {
    items: Record<string, unknown>[];
    currentEvent?: Record<string, unknown> | null;
    ready: boolean;
  };
  reasoning: { items: Record<string, unknown>[]; ready: boolean };
  predictions: { items: Record<string, unknown>[]; ready: boolean };
  portfolio: Record<string, unknown>;
  executions: { items: Record<string, unknown>[]; ready: boolean };
  logs: { items: Record<string, unknown>[]; total: number; ready: boolean };
  settings: Btc3Settings;
  paperRebalances: { items: Record<string, unknown>[]; total: number };
  fetchedAt: string;
}

export async function fetchBtc3StateBundle(): Promise<Btc3StateBundle> {
  return fetchApi<Btc3StateBundle>("/state");
}

function mapArticle(raw: Record<string, unknown>): Btc3Article {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    title: String(raw.title ?? ""),
    summary: String(raw.summary ?? ""),
    url: String(raw.url ?? ""),
    providerId: String(raw.providerId ?? ""),
    publishedAt: String(raw.publishedAt ?? ""),
    language: String(raw.language ?? "en"),
    status: String(raw.status ?? "raw"),
    categories: Array.isArray(raw.categories) ? raw.categories.map(String) : [],
  };
}

function mapEvent(raw: Record<string, unknown>): Btc3MacroEvent {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    headline: String(raw.headline ?? ""),
    summary: String(raw.summary ?? ""),
    categories: Array.isArray(raw.categories) ? raw.categories.map(String) : [],
    articleCount: Number(raw.articleCount ?? 0),
    publishedAt: String(raw.publishedAt ?? ""),
    status: String(raw.status ?? ""),
  };
}

function mapEntity(raw: Record<string, unknown>): Btc3Entity {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    name: String(raw.name ?? ""),
    type: raw.type as Btc3Entity["type"],
    mentionCount: Number(raw.mentionCount ?? 0),
  };
}

function mapReasoning(raw: Record<string, unknown>): Btc3Reasoning {
  const alloc = raw.recommendedAllocation as AllocationPct | undefined;
  return {
    id: String(raw._id ?? raw.id ?? ""),
    summary: String(raw.summary ?? ""),
    bullishFactors: Array.isArray(raw.bullishFactors) ? raw.bullishFactors.map(String) : [],
    bearishFactors: Array.isArray(raw.bearishFactors) ? raw.bearishFactors.map(String) : [],
    historicalEvidence: Array.isArray(raw.historicalEvidence)
      ? raw.historicalEvidence.map((e) => ({
          eventTitle: String((e as Record<string, unknown>).eventTitle ?? ""),
          similarityScore: Number((e as Record<string, unknown>).similarityScore ?? 0),
          btcReturn: Number((e as Record<string, unknown>).btcReturn ?? 0),
          durationDays: Number((e as Record<string, unknown>).durationDays ?? 0),
        }))
      : [],
    confidence: Number(raw.confidence ?? 0),
    recommendedAllocation: {
      btcPct: Number(alloc?.btcPct ?? 40),
      usdcPct: Number(alloc?.usdcPct ?? 60),
    },
    timeHorizon: String(raw.timeHorizon ?? "7d"),
    status: String(raw.status ?? ""),
  };
}

function mapPrediction(raw: Record<string, unknown>): Btc3Prediction {
  const horizons = (raw.horizons ?? {}) as Btc3Prediction["horizons"];
  return {
    id: String(raw._id ?? raw.id ?? ""),
    horizons: {
      h24: horizons.h24 ?? {},
      d7: horizons.d7 ?? {},
      d30: horizons.d30 ?? {},
    },
    status: String(raw.status ?? ""),
  };
}

function mapExecution(raw: Record<string, unknown>): Btc3Execution {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    route: raw.route != null ? String(raw.route) : null,
    inputAmount: raw.inputAmount != null ? String(raw.inputAmount) : null,
    outputAmount: raw.outputAmount != null ? String(raw.outputAmount) : null,
    estimatedFeeUsd: raw.estimatedFeeUsd != null ? Number(raw.estimatedFeeUsd) : null,
    status: String(raw.status ?? ""),
    error: raw.error != null ? String(raw.error) : null,
  };
}

function mapLog(raw: Record<string, unknown>): Btc3SystemLog {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    step: String(raw.step ?? ""),
    level: (raw.level as Btc3SystemLog["level"]) ?? "info",
    message: String(raw.message ?? ""),
    durationMs: raw.durationMs != null ? Number(raw.durationMs) : null,
    createdAt: String(raw.createdAt ?? ""),
  };
}

function mapPaperRebalance(raw: Record<string, unknown>): Btc3PaperRebalance {
  return {
    id: String(raw._id ?? raw.id ?? ""),
    direction: (raw.direction as Btc3PaperRebalance["direction"]) ?? "hold",
    headline: String(raw.headline ?? ""),
    btcPriceUsd: Number(raw.btcPriceUsd ?? 0),
    notionalUsd: Number(raw.notionalUsd ?? 0),
    beforeAllocation: (raw.beforeAllocation ?? {}) as AllocationPct & { totalUsd?: number },
    afterAllocation: (raw.afterAllocation ?? {}) as AllocationPct & { totalUsd?: number },
    equityUsd: Number(raw.equityUsd ?? 0),
    returnPct: raw.returnPct != null ? Number(raw.returnPct) : null,
    status: String(raw.status ?? ""),
    createdAt: String(raw.createdAt ?? ""),
  };
}

function mapPaperTrading(raw: Record<string, unknown> | null | undefined): Btc3PaperTrading | null {
  if (!raw) return null;
  return {
    experimentId: raw.experimentId != null ? String(raw.experimentId) : null,
    startedAt: raw.startedAt != null ? String(raw.startedAt) : null,
    equityUsd: Number(raw.equityUsd ?? 0),
    startingBankUsd: Number(raw.startingBankUsd ?? 1000),
    returnPct: raw.returnPct != null ? Number(raw.returnPct) : null,
    btcSpotPriceUsd: raw.btcSpotPriceUsd != null ? Number(raw.btcSpotPriceUsd) : null,
    rebalanceCount: Number(raw.rebalanceCount ?? 0),
    executedRebalances: Number(raw.executedRebalances ?? raw.rebalanceCount ?? 0),
    mode: "paper",
    allocation: (raw.allocation ?? { btcPct: 40, usdcPct: 60 }) as AllocationPct,
    holdings: {
      usdcAmount: Number((raw.holdings as Record<string, unknown>)?.usdcAmount ?? 0),
      btcAmount: Number((raw.holdings as Record<string, unknown>)?.btcAmount ?? 0),
      btcUsd: Number((raw.holdings as Record<string, unknown>)?.btcUsd ?? 0),
    },
  };
}

export function mapApiToBtc3State(bundle: Btc3StateBundle): Btc3AgentState {
  const overview = bundle.overview;
  const portfolioRaw = bundle.portfolio as Record<string, unknown>;
  const paperFromOverview = mapPaperTrading(overview.paper as Record<string, unknown> | undefined);
  const paperFromPortfolio = mapPaperTrading(portfolioRaw.paper as Record<string, unknown> | undefined);
  const paper = paperFromPortfolio ?? paperFromOverview;
  const current = (portfolioRaw.current ?? {}) as AllocationPct & { totalUsd?: number };
  const target = (portfolioRaw.target ?? {}) as AllocationPct;
  const latestDecisionRaw = portfolioRaw.latestDecision as Record<string, unknown> | null;

  const reasoningItems = bundle.reasoning.items.map(mapReasoning);
  const latestReasoning = reasoningItems[0] ?? null;

  return {
    ready: bundle.ready,
    fetchedAt: Date.now(),
    hero: {
      title: String(overview.title ?? "Macro Intelligence Agent"),
      lastScanAt: overview.lastScanAt != null ? String(overview.lastScanAt) : null,
      pipelineStatus: (overview.lastPipelineStatus as PipelineStatus) ?? "idle",
      macroRegime: (overview.macroRegime as MacroRegime) ?? "unknown",
      marketRegime: (overview.marketRegime as MarketRegime) ?? "unknown",
      confidence: Number(overview.currentConfidence ?? 0),
      articlesProcessed: Number(overview.articlesProcessed ?? 0),
      articlesTotal: Number(overview.articlesTotal ?? 0),
      predictionsGenerated: Number(overview.predictionsGenerated ?? 0),
      currentRecommendation: (overview.currentRecommendation as AllocationPct) ?? {
        btcPct: 40,
        usdcPct: 60,
      },
      paperEquityUsd: paper?.equityUsd ?? null,
      paperReturnPct: paper?.returnPct ?? null,
      paperStartingUsd: paper?.startingBankUsd ?? null,
      btcSpotPriceUsd: paper?.btcSpotPriceUsd ?? null,
    },
    runtime: {
      pipelineStatus: (overview.lastPipelineStatus as PipelineStatus) ?? "idle",
      lastPipelineRunId:
        overview.lastPipelineRunId != null ? String(overview.lastPipelineRunId) : null,
      llmConfigured: Boolean(bundle.settings.llmConfigured),
      embeddingConfigured: Boolean(bundle.settings.embedding?.configured),
      qdrantConfigured: Boolean(bundle.settings.qdrant?.configured),
    },
    news: bundle.news.items.map(mapArticle),
    newsTotal: bundle.news.total,
    macroEvents: bundle.events.items.map(mapEvent),
    entities: bundle.entities.items.map(mapEntity),
    similarity: bundle.similarity.items.map(
      (item): Btc3SimilarityItem => ({
        currentEventTitle:
          item.currentEventTitle != null ? String(item.currentEventTitle) : null,
        similarEventTitle: String(item.similarEventTitle ?? ""),
        similarityScore:
          item.similarityScore != null ? Number(item.similarityScore) : null,
        btcReturn: item.btcReturn != null ? Number(item.btcReturn) : null,
        durationDays: item.durationDays != null ? Number(item.durationDays) : null,
      }),
    ),
    currentEventTitle: bundle.similarity.currentEvent
      ? String((bundle.similarity.currentEvent as Record<string, unknown>).headline ?? "")
      : null,
    reasoning: latestReasoning,
    predictions: bundle.predictions.items.map(mapPrediction),
    portfolio: {
      current,
      target,
      snapshots: Array.isArray(portfolioRaw.snapshots)
        ? portfolioRaw.snapshots.map((s) => ({
            btcPct: Number((s as Record<string, unknown>).btcPct ?? 0),
            usdcPct: Number((s as Record<string, unknown>).usdcPct ?? 0),
            totalUsd: Number((s as Record<string, unknown>).totalUsd ?? 0),
            createdAt: String((s as Record<string, unknown>).createdAt ?? ""),
          }))
        : [],
      latestDecision: latestDecisionRaw
        ? {
            id: String(latestDecisionRaw._id ?? ""),
            headline: String(latestDecisionRaw.headline ?? ""),
            currentAllocation: latestDecisionRaw.currentAllocation as AllocationPct,
            targetAllocation: latestDecisionRaw.targetAllocation as AllocationPct,
            confidence: Number(latestDecisionRaw.confidence ?? 0),
            status: String(latestDecisionRaw.status ?? ""),
          }
        : null,
    },
    executions: bundle.executions.items.map(mapExecution),
    logs: bundle.logs.items.map(mapLog),
    settings: bundle.settings,
    paper,
    paperRebalances: bundle.paperRebalances.items.map(mapPaperRebalance),
  };
}
