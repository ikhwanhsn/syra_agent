import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/mm`;

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatMmUsd(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return usdCompact.format(n);
}

export function formatMmPct(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export type MmStrategyId = "tight" | "wide" | "adaptive";
export type MmRunStatus = "resting" | "filled" | "closed" | "cancelled" | "error";
export type MmVolRegime = "low" | "normal" | "high";

export interface MmSimConfig {
  startingBankUsd: number;
  spreadBps: number;
  orderSizeUsd: number;
  gridLevels: number;
  maxInventoryUsd: number;
  minEdgeBufferPct: number;
  quoteSlippageBps: number;
  creatorFeeBps: number;
}

export interface MmStrategyStat {
  roundTrips: number;
  volumeUsd: number;
  pnlUsd: number;
  avgPnlPct: number;
  volumePerDollar: number;
}

export interface MmLearningSnapshot {
  lessons: string[];
  thresholdOverrides: Record<string, unknown>;
  strategyStats: Record<string, MmStrategyStat>;
  promotedStrategyId: MmStrategyId;
  strategyCooldowns: Array<{ strategyId: string; reason: string | null; until: string }>;
  lastEvolutionAt: string | null;
  lastEvolutionSummary: string | null;
  runsAnalyzed: number;
  creatorFeeBps: number;
  baseConfig: {
    spreadBps: number;
    orderSizeUsd: number;
    gridLevels: number;
    maxInventoryUsd: number;
    minEdgeBufferPct: number;
    deploySlicePct: number;
  };
  effectiveConfig: {
    spreadBps: number;
    orderSizeUsd: number;
    gridLevels: number;
    maxInventoryUsd: number;
    minEdgeBufferPct: number;
    deploySlicePct: number;
  };
}

export interface MmLedger {
  startingBankUsd: number;
  cashUsd: number;
  equityUsd: number;
  deployedUsd: number;
  inventoryUsd: number;
  inventoryDriftPct: number;
  syraInventoryRaw: string;
  realizedPnlUsd: number;
  returnPct: number | null;
  cumulativeVolumeUsd: number;
  projectedCreatorFeeUsd: number;
  volumePerDollarBank: number;
  roundTripsCompleted: number;
  profitableRoundTrips: number;
  losingRoundTrips: number;
  restingOrders: number;
  openInventoryLegs: number;
  today: {
    volumeUsd: number;
    pnlUsd: number;
    roundTrips: number;
    projectedCreatorFeeUsd: number;
  };
}

export interface MmMarketSnapshot {
  midPriceUsd: number;
  buyPriceUsd: number;
  sellPriceUsd: number;
  halfSpreadBps: number;
  impactBps: number;
  probedAt: string;
  source: string;
  volRegime?: MmVolRegime;
  volPct?: number;
}

export interface MmQuoteBookOrder {
  strategyId: MmStrategyId;
  side: "buy" | "sell";
  level: number;
  priceUsd: number;
  notionalUsd: number;
}

export interface MmQuoteBook {
  quotedAt: string;
  midPriceUsd: number;
  halfSpreadBps: number;
  volRegime: MmVolRegime;
  orders: MmQuoteBookOrder[];
  quotedCount: number;
}

export interface MmRun {
  id: string;
  strategyId: MmStrategyId;
  roundTripId: string | null;
  side: "buy" | "sell";
  orderType: "resting" | "paired";
  limitPriceUsd: number;
  fillPriceUsd: number | null;
  notionalUsd: number;
  volumeUsd: number;
  syraAmountRaw: string | null;
  impactBps: number | null;
  reservationPriceUsd: number | null;
  spreadBps: number | null;
  gridLevel: number;
  inventoryUsdAfter: number | null;
  midPriceUsd: number | null;
  volRegime: MmVolRegime;
  status: MmRunStatus;
  resolution: string | null;
  simPnlUsd: number | null;
  simPnlPct: number | null;
  pairedRunId: string | null;
  quotedAt: string | null;
  filledAt: string | null;
  resolvedAt: string | null;
  expiresAt: string | null;
  currentMidUsd: number | null;
  createdAt: string | null;
}

export interface MmOverview {
  title: string;
  startedAt: string | null;
  mode: "paper";
  simConfig: MmSimConfig;
  promotedStrategyId: MmStrategyId;
  activeStrategyId: MmStrategyId;
  ledger: MmLedger;
  market: MmMarketSnapshot | null;
  universe: {
    symbol: string;
    mint: string;
    quoteMint: string;
    priceUsd: number | null;
  };
  quoteBook: MmQuoteBook | null;
  restingRuns: MmRun[];
  recentClosed: MmRun[];
  strategyPopulation: Array<{
    id: MmStrategyId;
    name: string;
    spreadBps: number;
    orderSizeUsd: number;
    gridLevels: number;
  }>;
  dataSources: {
    prices: string;
    fills: string;
    venue: string;
    token: string;
  };
  lastQuoteAt: string | null;
  lastResolveAt: string | null;
}

export interface MmEquityPoint {
  ts: string;
  equityUsd: number;
  pnlUsd: number;
}

export interface MmVolumePoint {
  ts: string;
  volumeUsd: number;
  cumulativeVolumeUsd: number;
  projectedFeeUsd: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function mmFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    headers: { Accept: "application/json" },
    signal,
  });
  const json = (await res.json()) as ApiEnvelope<T>;
  if (!res.ok || !json.success) {
    throw new Error(json.error || `MM API ${res.status}`);
  }
  if (json.data == null) throw new Error("MM API returned empty data");
  return json.data;
}

export function fetchMmOverview(signal?: AbortSignal): Promise<MmOverview> {
  return mmFetch<MmOverview>("/overview", signal);
}

export function fetchMmRuns(params?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<{ runs: MmRun[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.limit != null) q.set("limit", String(params.limit));
  if (params?.offset != null) q.set("offset", String(params.offset));
  if (params?.status) q.set("status", params.status);
  const qs = q.toString();
  return mmFetch<{ runs: MmRun[]; total: number }>(`/runs${qs ? `?${qs}` : ""}`);
}

export function fetchMmEquityHistory(signal?: AbortSignal): Promise<{
  points: MmEquityPoint[];
  startingBankUsd: number;
}> {
  return mmFetch("/equity-history", signal);
}

export function fetchMmVolumeHistory(signal?: AbortSignal): Promise<{
  points: MmVolumePoint[];
  creatorFeeBps: number;
}> {
  return mmFetch("/volume-history", signal);
}

export function fetchMmLearning(signal?: AbortSignal): Promise<MmLearningSnapshot> {
  return mmFetch<MmLearningSnapshot>("/learning", signal);
}

export const MM_STRATEGY_LABELS: Record<MmStrategyId, string> = {
  tight: "Tight / high-freq",
  wide: "Wide / inventory",
  adaptive: "Adaptive vol",
};
