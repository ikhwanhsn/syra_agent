export type MacroRegime = "risk_on" | "risk_off" | "neutral" | "unknown";
export type MarketRegime = "bull" | "bear" | "range" | "unknown";
export type PipelineStatus = "idle" | "running" | "success" | "partial" | "failed";
export type EntityType =
  | "person"
  | "organization"
  | "country"
  | "asset"
  | "macro_concept"
  | "central_bank";
export type LogLevel = "info" | "warn" | "error" | "debug";

export interface AllocationPct {
  btcPct: number;
  usdcPct: number;
}

export interface Btc3Article {
  id: string;
  title: string;
  summary: string;
  url: string;
  providerId: string;
  publishedAt: string;
  language: string;
  status: string;
  categories: string[];
}

export interface Btc3MacroEvent {
  id: string;
  headline: string;
  summary: string;
  categories: string[];
  articleCount: number;
  publishedAt: string;
  status: string;
}

export interface Btc3Entity {
  id: string;
  name: string;
  type: EntityType;
  mentionCount: number;
}

export interface Btc3SimilarityItem {
  currentEventTitle: string | null;
  similarEventTitle: string;
  similarityScore: number | null;
  btcReturn: number | null;
  durationDays: number | null;
}

export interface Btc3HistoricalEvidence {
  eventTitle: string;
  similarityScore: number;
  btcReturn: number;
  durationDays: number;
}

export interface Btc3Reasoning {
  id: string;
  summary: string;
  bullishFactors: string[];
  bearishFactors: string[];
  historicalEvidence: Btc3HistoricalEvidence[];
  confidence: number;
  recommendedAllocation: AllocationPct;
  timeHorizon: string;
  status: string;
}

export interface Btc3HorizonPrediction {
  expectedReturn: number | null;
  expectedDownside: number | null;
  expectedVolatility: number | null;
  confidence: number | null;
}

export interface Btc3Prediction {
  id: string;
  horizons: {
    h24: Btc3HorizonPrediction;
    d7: Btc3HorizonPrediction;
    d30: Btc3HorizonPrediction;
  };
  status: string;
}

export interface Btc3PortfolioSnapshot {
  btcPct: number;
  usdcPct: number;
  totalUsd: number;
  createdAt: string;
}

export interface Btc3AllocationDecision {
  id: string;
  headline: string;
  currentAllocation: AllocationPct;
  targetAllocation: AllocationPct;
  confidence: number;
  status: string;
}

export interface Btc3Execution {
  id: string;
  route: string | null;
  inputAmount: string | null;
  outputAmount: string | null;
  estimatedFeeUsd: number | null;
  status: string;
  error: string | null;
}

export interface Btc3SystemLog {
  id: string;
  step: string;
  level: LogLevel;
  message: string;
  durationMs: number | null;
  createdAt: string;
}

export interface Btc3NewsProvider {
  id: string;
  name: string;
  type: string;
  category: string;
  enabled: boolean;
  status: string;
  notes: string | null;
}

export interface Btc3Settings {
  cronEnabled: boolean;
  cronIntervalMs: number;
  llmModel: string;
  llmConfigured: boolean;
  embedding: { configured: boolean; model: string };
  qdrant: { configured: boolean };
  redisConfigured: boolean;
  mongoConfigured: boolean;
  providers: Btc3NewsProvider[];
}

export interface Btc3Hero {
  title: string;
  lastScanAt: string | null;
  pipelineStatus: PipelineStatus;
  macroRegime: MacroRegime;
  marketRegime: MarketRegime;
  confidence: number;
  articlesProcessed: number;
  articlesTotal: number;
  predictionsGenerated: number;
  currentRecommendation: AllocationPct;
  paperEquityUsd: number | null;
  paperReturnPct: number | null;
  paperStartingUsd: number | null;
  btcSpotPriceUsd: number | null;
}

export interface Btc3PaperRebalance {
  id: string;
  direction: "buy_btc" | "sell_btc" | "hold";
  headline: string;
  btcPriceUsd: number;
  notionalUsd: number;
  beforeAllocation: AllocationPct & { totalUsd?: number };
  afterAllocation: AllocationPct & { totalUsd?: number };
  equityUsd: number;
  returnPct: number | null;
  status: string;
  createdAt: string;
}

export interface Btc3LearningSnapshot {
  ready?: boolean;
  lessons: string[];
  thresholdOverrides: Record<string, unknown>;
  lastEvolutionAt: string | null;
  lastEvolutionSummary: string | null;
  rebalancesAnalyzed: number;
  baseConfig?: {
    minRebalancePct: number;
    initialBtcPct: number;
  };
}

export interface Btc3PaperTrading {
  experimentId: string | null;
  startedAt: string | null;
  equityUsd: number;
  startingBankUsd: number;
  returnPct: number | null;
  btcSpotPriceUsd: number | null;
  rebalanceCount: number;
  executedRebalances: number;
  mode: "paper";
  allocation: AllocationPct;
  holdings: {
    usdcAmount: number;
    btcAmount: number;
    btcUsd: number;
  };
}

export interface Btc3Runtime {
  pipelineStatus: PipelineStatus;
  lastPipelineRunId: string | null;
  llmConfigured: boolean;
  embeddingConfigured: boolean;
  qdrantConfigured: boolean;
}

export interface Btc3AgentState {
  hero: Btc3Hero;
  runtime: Btc3Runtime;
  news: Btc3Article[];
  newsTotal: number;
  macroEvents: Btc3MacroEvent[];
  entities: Btc3Entity[];
  similarity: Btc3SimilarityItem[];
  currentEventTitle: string | null;
  reasoning: Btc3Reasoning | null;
  predictions: Btc3Prediction[];
  portfolio: {
    current: AllocationPct & { totalUsd?: number };
    target: AllocationPct;
    snapshots: Btc3PortfolioSnapshot[];
    latestDecision: Btc3AllocationDecision | null;
  };
  executions: Btc3Execution[];
  logs: Btc3SystemLog[];
  settings: Btc3Settings;
  paper: Btc3PaperTrading | null;
  paperRebalances: Btc3PaperRebalance[];
  learning: Btc3LearningSnapshot | null;
  ready: boolean;
  fetchedAt: number;
}
