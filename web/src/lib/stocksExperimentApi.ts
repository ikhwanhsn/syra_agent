import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/stocks`;

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatStocksUsd(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return usdCompact.format(n);
}

export type StocksRunStatus = "open" | "win" | "loss" | "expired" | "skipped" | "error";

export interface StocksStrategy {
  id: number;
  name: string;
  minSentiment: number;
  eventWeight: number;
  momentumConfirm: boolean;
  maxHoldHours: number;
  universeFilter?: { symbols?: string[] };
  signalGate?: Record<string, unknown>;
  exit?: { stopLossPct?: number; takeProfitPct?: number };
  notes?: string;
}

export interface StocksAgentStats {
  strategyId: number;
  strategyName: string;
  wins: number;
  losses: number;
  expired: number;
  decided: number;
  winRate: number | null;
  winRatePct: number | null;
  openPositions: number;
  cashUsd?: number;
  equityUsd?: number;
  returnPct?: number | null;
  sumPnlUsd?: number;
  leaderScore?: number;
}

export interface StocksSimConfig {
  startingBankUsd: number;
  maxConcurrentPositions: number;
  maxPositionPct: number;
}

export interface StocksLabAgentRow {
  strategyId: number;
  cashUsd: number;
  startingBankUsd: number;
  openPositions: number;
  deployedUsd: number;
  equityUsd: number;
  returnPct: number | null;
}

export interface StocksLabState {
  activeExperimentId: string | null;
  title: string;
  startedAt: string | null;
  simConfig: StocksSimConfig;
  agents: StocksLabAgentRow[];
}

export interface StocksOverview {
  activeExperimentId: string | null;
  startedAt: string | null;
  universeCount: number;
  strategyCount: number;
  settledRuns: number;
  openPositions: number;
  sumEquityUsd: number;
  sumPnlUsd: number;
  leaderStrategyId: number | null;
  leaderStrategyName: string | null;
  leaderSumPnlUsd: number | null;
  leaderWinRatePct: number | null;
  leaderReturnPct: number | null;
}

export interface StocksRunRow {
  id: string;
  experimentId: string;
  strategyId: number;
  strategyName: string;
  symbol: string;
  mint: string | null;
  nasdaqTicker: string | null;
  entryPriceUsd: number;
  notionalUsd: number;
  signalSnapshot: Record<string, unknown> | null;
  newsHeadline: string | null;
  status: StocksRunStatus;
  resolution: string | null;
  simExitPrice: number | null;
  simPnlUsd: number | null;
  simPnlPct: number | null;
  openedAt: string | null;
  resolvedAt: string | null;
  createdAt: string | null;
}

export interface StocksUniverseEntry {
  symbol: string;
  name: string;
  mint: string;
  nasdaqTicker: string | null;
  isTradingHalted: boolean;
  priceUsd: number | null;
  priceSource: string | null;
  nasdaqPriceUsd: number | null;
}

export interface StocksNewsSignal {
  symbol: string;
  sentimentScore: number;
  eventScore: number;
  freshnessScore: number;
  momentumScore: number;
  volumeScore: number;
  spreadScore: number;
  direction: "long" | "short" | "neutral";
  compositeScore: number;
  topHeadline: string | null;
  newsCount: number;
  fetchedAt: string;
}

async function parseJson<T>(res: Response): Promise<{ ok: boolean; body: T }> {
  const body = (await res.json()) as T;
  return { ok: res.ok, body };
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    credentials: "include",
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  const { ok, body } = await parseJson<{ success?: boolean; data?: T; error?: string }>(res);
  if (!ok || !body.success || body.data === undefined) {
    throw new Error(body.error || `Request failed: ${path}`);
  }
  return body.data;
}

export async function fetchStocksLabState(): Promise<StocksLabState> {
  return fetchApi<StocksLabState>("/state");
}

export async function fetchStocksStats(): Promise<{ experimentId: string | null; agents: StocksAgentStats[] }> {
  return fetchApi("/stats");
}

export async function fetchStocksOverview(): Promise<StocksOverview> {
  return fetchApi<StocksOverview>("/overview");
}

export async function fetchStocksRuns(opts?: {
  limit?: number;
  offset?: number;
  strategyId?: number;
  experimentId?: string;
  status?: string;
}): Promise<{ runs: StocksRunRow[]; total: number }> {
  const q = new URLSearchParams();
  if (opts?.limit != null) q.set("limit", String(opts.limit));
  if (opts?.offset != null) q.set("offset", String(opts.offset));
  if (opts?.strategyId != null) q.set("strategyId", String(opts.strategyId));
  if (opts?.experimentId) q.set("experimentId", opts.experimentId);
  if (opts?.status) q.set("status", opts.status);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return fetchApi(`/runs${suffix}`);
}

export async function fetchStocksStrategies(): Promise<{ strategies: StocksStrategy[] }> {
  return fetchApi("/strategies");
}

export async function fetchStocksUniverse(): Promise<{ universe: StocksUniverseEntry[] }> {
  return fetchApi("/universe");
}

export async function fetchStocksNews(limit = 12): Promise<{ news: StocksNewsSignal[] }> {
  return fetchApi(`/news?limit=${limit}`);
}

export async function fetchStocksLeader(): Promise<{
  leader: StocksAgentStats | null;
}> {
  return fetchApi("/leader");
}
