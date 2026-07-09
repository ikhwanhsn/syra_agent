import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/scalper`;

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatScalperUsd(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return usdCompact.format(n);
}

export function formatScalperPct(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export type ScalperRunStatus = "open" | "win" | "loss" | "expired" | "error";
export type ScalperOpportunitySource = "btc1" | "btc2" | "btc3" | "stocks" | "momentum";

export interface ScalperSimConfig {
  startingBankUsd: number;
  maxConcurrentPositions: number;
  notionalSlicePct: number;
  minNotionalSlicePct?: number;
  takeProfitPct: number;
  stopLossPct: number;
  maxHoldMinutes: number;
  minOpportunityScore: number;
  minEdgeBufferPct?: number;
}

export interface ScalperSourceStat {
  decided: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPnlPct: number;
  scoreMultiplier: number;
}

export interface ScalperSymbolStat {
  decided: number;
  wins: number;
  losses: number;
  winRate: number;
  avgPnlPct: number;
}

export interface ScalperLearningCooldown {
  source?: string;
  symbol?: string;
  reason: string | null;
  until: string;
}

export interface ScalperLearningSnapshot {
  lessons: string[];
  thresholdOverrides: Record<string, unknown>;
  sourceStats: Record<string, ScalperSourceStat>;
  symbolStats: Record<string, ScalperSymbolStat>;
  sourceCooldowns: Array<{ source: string; reason: string | null; until: string }>;
  symbolCooldowns: Array<{ symbol: string; reason: string | null; until: string }>;
  lastEvolutionAt: string | null;
  lastEvolutionSummary: string | null;
  runsAnalyzed: number;
  baseConfig: {
    takeProfitPct: number;
    stopLossPct: number;
    minOpportunityScore: number;
    notionalSlicePct: number;
    maxHoldMinutes: number;
    minEdgeBufferPct: number;
  };
  effectiveConfig: {
    takeProfitPct: number;
    stopLossPct: number;
    minOpportunityScore: number;
    notionalSlicePct: number;
    maxHoldMinutes: number;
    minEdgeBufferPct: number;
  };
}

export interface ScalperLedger {
  startingBankUsd: number;
  cashUsd: number;
  equityUsd: number;
  deployedUsd: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  totalPnlUsd: number;
  returnPct: number | null;
  openPositions: number;
  wins: number;
  losses: number;
  expired: number;
  totalTrades: number;
  winRate: number | null;
  winRatePct: number | null;
}

export interface ScalperOpportunity {
  source: ScalperOpportunitySource;
  symbol: string;
  mint: string;
  assetClass: "crypto" | "equity";
  side: "long" | "short" | "neutral";
  score: number;
  rationale: string;
  expiresAt: string;
  taken?: boolean;
  skippedReason?: string | null;
  meta?: {
    confluenceCount?: number;
    confluenceSources?: string[];
  };
}

export interface ScalperRun {
  id: string;
  symbol: string;
  mint: string;
  assetClass: "crypto" | "equity";
  side: "long";
  source: ScalperOpportunitySource;
  opportunityScore: number;
  confluenceCount?: number;
  rationale: string | null;
  notionalUsd: number;
  entryPriceUsd: number;
  entryFillSource: string | null;
  entryImpactBps: number | null;
  takeProfitPriceUsd: number | null;
  stopLossPriceUsd: number | null;
  exitPriceUsd: number | null;
  exitFillSource: string | null;
  exitImpactBps: number | null;
  currentPriceUsd: number | null;
  unrealizedPnlUsd: number | null;
  unrealizedPnlPct: number | null;
  status: ScalperRunStatus;
  resolution: string | null;
  simPnlUsd: number | null;
  simPnlPct: number | null;
  openedAt: string | null;
  resolvedAt: string | null;
  maxHoldUntil: string | null;
  createdAt: string | null;
}

export interface ScalperOverview {
  title: string;
  startedAt: string | null;
  simConfig: ScalperSimConfig;
  ledger: ScalperLedger;
  today: {
    trades: number;
    pnlUsd: number;
    avgHoldMinutes: number | null;
  };
  universe: Array<{
    symbol: string;
    mint: string;
    assetClass: "crypto" | "equity";
    priceUsd: number | null;
  }>;
  opportunityFeed: {
    scannedAt: string;
    opportunities: ScalperOpportunity[];
    openedCount: number;
    skippedCount: number;
  } | null;
  openRuns: ScalperRun[];
  recentClosed: ScalperRun[];
  dataSources: {
    btcPrice: string;
    equityPrices: string;
    fills: string;
    venue: string;
  };
  lastSignalAt: string | null;
  lastResolveAt: string | null;
}

export interface ScalperEquityPoint {
  ts: string;
  equityUsd: number;
  pnlUsd: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function scalperFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success) {
    throw new Error(json.error || `Scalper API ${res.status}`);
  }
  if (json.data == null) throw new Error("Scalper API returned empty data");
  return json.data;
}

export function fetchScalperOverview(signal?: AbortSignal): Promise<ScalperOverview> {
  return scalperFetch<ScalperOverview>("/overview", signal);
}

export function fetchScalperRuns(params?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<{ runs: ScalperRun[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return scalperFetch<{ runs: ScalperRun[]; total: number }>(`/runs${qs ? `?${qs}` : ""}`);
}

export function fetchScalperEquityHistory(signal?: AbortSignal): Promise<{
  points: ScalperEquityPoint[];
  startingBankUsd: number;
}> {
  return scalperFetch("/equity-history", signal);
}

export function fetchScalperLearning(signal?: AbortSignal): Promise<ScalperLearningSnapshot> {
  return scalperFetch<ScalperLearningSnapshot>("/learning", signal);
}

export const SCALPER_SOURCE_LABELS: Record<ScalperOpportunitySource, string> = {
  btc1: "BTC Quant",
  btc2: "BTC Agent",
  btc3: "Macro Intel",
  stocks: "Stocks News",
  momentum: "Momentum",
};
