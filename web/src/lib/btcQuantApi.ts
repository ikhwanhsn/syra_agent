import { getApiBaseUrl } from "@/lib/chatApi";

const simBase = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/btc-quant`;
const realBase = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/btc-quant-real`;

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatBtcUsd(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return usdCompact.format(n);
}

export type BtcRunStatus = "open" | "win" | "loss" | "expired" | "skipped_invalid_levels" | "error";

export interface BtcQuantStrategy {
  id: number;
  name: string;
  bar: string;
  dataSource: string;
  signalGate?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  notes?: string;
}

export interface BtcAgentStats {
  strategyId: number;
  strategyName: string;
  bar: string;
  dataSource: string;
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
  avgPnlUsd?: number;
}

export interface BtcExperimentLabAgentRow {
  strategyId: number;
  cashUsd: number;
  startingBankUsd: number;
  openPositions: number;
  deployedUsd: number;
  equityUsd: number;
  returnPct?: number | null;
}

export type BtcQuantLane = "btc1" | "btc2";

export interface BtcExperimentLabState {
  lane?: BtcQuantLane;
  activeExperimentId: string | null;
  title: string;
  startedAt: string | null;
  simConfig: {
    startingBankUsd: number;
    maxConcurrentPositions: number;
  };
  agents: BtcExperimentLabAgentRow[];
}

export interface BtcGlobalOverview {
  lane?: BtcQuantLane;
  btcSpotPriceUsd: number | null;
  onchain: {
    venue: string;
    asset: string;
    execution: string;
  };
  simulation: {
    activeExperimentId: string | null;
    strategyCount: number;
    settledRuns: number;
    openPositions: number;
    sumPnlUsd: number;
    sumEquityUsd: number;
    leaderStrategyId: number | null;
    leaderSumPnlUsd: number | null;
    leaderWinRatePct: number | null;
    topWinRateStrategyId: number | null;
    topWinRatePct: number | null;
  };
  realAgent: {
    enabled: boolean;
    openPositions: number;
    realizedNetPnlUsd: number;
    realWinRate: number | null;
    realWins: number;
    realLosses: number;
    cronEnabled?: boolean;
    leaderStrategyId?: number | null;
  };
}

export interface BtcRunRow {
  _id: string;
  strategyId: number;
  strategyName: string;
  bar: string;
  dataSource: string;
  symbol: string;
  status: BtcRunStatus;
  resolution?: string | null;
  clearSignal?: string;
  entry?: number | null;
  stopLoss?: number | null;
  firstTarget?: number | null;
  priceAtSignal?: number | null;
  notionalUsd?: number | null;
  simExitPrice?: number | null;
  simPnlUsd?: number | null;
  experimentId?: string | null;
  createdAt?: string;
  resolvedAt?: string | null;
}

export interface BtcQuantRealState {
  enabled: boolean;
  experimentId: string;
  title: string;
  startedAt: string | null;
  agentAddress: string | null;
  leaderStrategyId: number | null;
  maxNotionalUsd: number;
  reserveUsdc: number;
  slippageBps: number;
  lastSignalAt: string | null;
  lastResolveAt: string | null;
  lastError: string | null;
  closeAllRequested: boolean;
  openPositions: number;
  realizedNetPnlUsd: number;
  realWinRate: number | null;
  realWins: number;
  realLosses: number;
  canEnable: boolean;
  cronEnabled: boolean;
  onchain: {
    venue: string;
    inputMint: string;
    outputMint: string;
    execution: string;
  };
}

export interface BtcSignalReportPayload {
  source: string;
  meta: Record<string, string>;
  report: Record<string, unknown>;
  anchorCloseMs: number | null;
  instrument: string;
}

export interface BtcOhlcvPoint {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface BtcRealPositionRow {
  _id: string;
  strategyId: number;
  strategyName: string;
  status: string;
  entryPriceUsd?: number | null;
  realExitPriceUsd?: number | null;
  realNetPnlUsd?: number | null;
  notionalUsd: number;
  openTxSig?: string | null;
  closeTxSig?: string | null;
  openedAt?: string;
  resolvedAt?: string | null;
}

export interface BtcQuantStrategyCooldown {
  strategyId: number;
  reason: string;
  until: string;
}

export interface BtcQuantLearningSnapshot {
  lane: BtcQuantLane;
  lessons: string[];
  strategyCooldowns: BtcQuantStrategyCooldown[];
  thresholdOverrides: Record<string, unknown>;
  lastEvolutionAt: string | null;
  lastEvolutionSummary: string | null;
  decidedRunsAnalyzed: number;
  closedPositionsAnalyzed: number;
  overrideCount: number;
}

async function parseJson<T>(res: Response): Promise<{ ok: boolean; body: T }> {
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, body };
}

function simUrl(path: string, lane?: BtcQuantLane, extra?: URLSearchParams): string {
  const q = extra ?? new URLSearchParams();
  if (lane && lane !== "btc1") q.set("lane", lane);
  const qs = q.toString();
  return `${simBase()}${path}${qs ? `?${qs}` : ""}`;
}

export async function fetchBtcStrategies(): Promise<BtcQuantStrategy[]> {
  const res = await fetch(`${simBase()}/strategies`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { strategies?: BtcQuantStrategy[] };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.strategies) {
    throw new Error(body.error || "Failed to load BTC strategies");
  }
  return body.data.strategies;
}

export async function fetchBtcLabState(lane: BtcQuantLane = "btc1"): Promise<BtcExperimentLabState> {
  const res = await fetch(simUrl("/state", lane), { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: BtcExperimentLabState;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load BTC lab state");
  }
  return body.data;
}

export async function fetchBtcStats(
  lane: BtcQuantLane = "btc1",
): Promise<{ agents: BtcAgentStats[]; experimentId: string | null; lane?: BtcQuantLane }> {
  const res = await fetch(simUrl("/stats", lane), { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { agents?: BtcAgentStats[]; experimentId?: string | null; lane?: BtcQuantLane };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.agents) {
    throw new Error(body.error || "Failed to load BTC stats");
  }
  return {
    agents: body.data.agents,
    experimentId: body.data.experimentId ?? null,
    lane: body.data.lane,
  };
}

export async function fetchBtcOverview(lane: BtcQuantLane = "btc1"): Promise<BtcGlobalOverview> {
  const res = await fetch(simUrl("/overview", lane), { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: BtcGlobalOverview;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load BTC overview");
  }
  return body.data;
}

export async function fetchBtcRuns(options: {
  limit?: number;
  offset?: number;
  strategyId?: number;
  status?: string;
  experimentId?: string;
  lane?: BtcQuantLane;
} = {}): Promise<{ runs: BtcRunRow[]; total: number }> {
  const q = new URLSearchParams({
    limit: String(options.limit ?? 25),
    offset: String(options.offset ?? 0),
  });
  if (options.strategyId != null && Number.isInteger(options.strategyId)) {
    q.set("strategyId", String(options.strategyId));
  }
  const status = options.status?.trim();
  if (status) q.set("status", status);
  const experimentId = options.experimentId?.trim();
  if (experimentId) q.set("experimentId", experimentId);

  const res = await fetch(simUrl("/runs", options.lane, q), { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { runs?: BtcRunRow[]; total?: number };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.runs || typeof body.data.total !== "number") {
    throw new Error(body.error || "Failed to load BTC runs");
  }
  return { runs: body.data.runs, total: body.data.total };
}

export async function fetchBtcRealState(): Promise<BtcQuantRealState> {
  const res = await fetch(`${realBase()}/state`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: BtcQuantRealState;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load BTC real state");
  }
  return body.data;
}

export async function enableBtcQuantReal(options: {
  leaderStrategyId?: number;
  maxNotionalUsd?: number;
} = {}): Promise<BtcQuantRealState> {
  const res = await fetch(`${realBase()}/enable`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: BtcQuantRealState;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to enable BTC real agent");
  }
  return body.data;
}

export async function disableBtcQuantReal(): Promise<BtcQuantRealState> {
  const res = await fetch(`${realBase()}/disable`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: BtcQuantRealState;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to disable BTC real agent");
  }
  return body.data;
}

export async function fetchBtcSignalReport(bar = "1h"): Promise<BtcSignalReportPayload> {
  const q = new URLSearchParams({ bar });
  const res = await fetch(`${simBase()}/signal-report?${q}`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: BtcSignalReportPayload;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load BTC signal report");
  }
  return body.data;
}

export async function fetchBtcOhlcv(
  bar = "1h",
  limit = 80,
): Promise<{ bar: string; points: BtcOhlcvPoint[] }> {
  const q = new URLSearchParams({ bar, limit: String(limit) });
  const res = await fetch(`${simBase()}/ohlcv?${q}`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { bar: string; points: BtcOhlcvPoint[] };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.points) {
    throw new Error(body.error || "Failed to load BTC OHLCV");
  }
  return body.data;
}

export async function fetchBtcRealPositions(options: {
  limit?: number;
  offset?: number;
  status?: string;
  experimentId?: string;
} = {}): Promise<{ positions: BtcRealPositionRow[]; total: number }> {
  const q = new URLSearchParams({
    limit: String(options.limit ?? 25),
    offset: String(options.offset ?? 0),
  });
  if (options.status) q.set("status", options.status);
  if (options.experimentId) q.set("experimentId", options.experimentId);

  const res = await fetch(`${realBase()}/positions?${q}`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { positions?: BtcRealPositionRow[]; total?: number };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.positions || typeof body.data.total !== "number") {
    throw new Error(body.error || "Failed to load BTC real positions");
  }
  return { positions: body.data.positions, total: body.data.total };
}

export async function fetchBtcLearning(
  lane: BtcQuantLane = "btc1",
): Promise<BtcQuantLearningSnapshot> {
  const res = await fetch(simUrl("/learning", lane), { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: BtcQuantLearningSnapshot;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load BTC learning snapshot");
  }
  return body.data;
}
