import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/lp-agent`;

export type LpRunStatus = "open" | "win" | "loss" | "expired" | "skipped" | "error";

export interface LpStrategy {
  id: number;
  name: string;
  lpShape: "spot" | "bid_ask" | "curve" | "mixed";
  binsBelow: number;
  binsAbove: number;
  screeningOverrides?: Record<string, unknown>;
  signalGate?: Record<string, unknown>;
  signalWeights?: Record<string, number>;
  exit?: Record<string, unknown>;
  notes?: string;
}

export interface LpCandidatePool {
  strategyId: number;
  strategyName: string;
  poolAddress: string;
  poolName: string;
  baseSymbol: string | null;
  quoteSymbol: string | null;
  score: number;
  gatePassed: boolean;
  gateReasons: string[];
  signalSnapshot: Record<string, unknown> | null;
  tvlUsd: number | null;
  volume24hUsd: number | null;
  feeTvlRatio: number | null;
}

export interface LpAgentStats {
  strategyId: number;
  strategyName: string;
  lpShape: string;
  wins: number;
  losses: number;
  expired: number;
  decided: number;
  winRate: number | null;
  winRatePct: number | null;
  openPositions: number;
  avgPnlPct: number;
  avgFeesSol: number;
}

export interface LpRunRow {
  _id: string;
  strategyId: number;
  strategyName: string;
  lpShape: string;
  poolAddress: string;
  poolName: string | null;
  baseSymbol: string | null;
  quoteSymbol: string | null;
  status: LpRunStatus;
  resolution?: string | null;
  simPnlPct?: number | null;
  simFeesEarnedSol?: number | null;
  createdAt?: string;
  resolvedAt?: string | null;
}

async function parseJson<T>(res: Response): Promise<{ ok: boolean; body: T }> {
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, body };
}

export async function fetchLpStrategies(): Promise<LpStrategy[]> {
  const res = await fetch(`${base()}/strategies`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { strategies?: LpStrategy[] };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.strategies) {
    throw new Error(body.error || "Failed to load LP strategies");
  }
  return body.data.strategies;
}

export async function fetchLpCandidatePools(): Promise<LpCandidatePool[]> {
  const res = await fetch(`${base()}/candidates`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { candidates?: LpCandidatePool[] };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.candidates) {
    throw new Error(body.error || "Failed to load LP candidates");
  }
  return body.data.candidates;
}

export async function fetchLpStats(): Promise<{ agents: LpAgentStats[] }> {
  const res = await fetch(`${base()}/stats`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { agents?: LpAgentStats[] };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.agents) {
    throw new Error(body.error || "Failed to load LP stats");
  }
  return { agents: body.data.agents };
}

export async function fetchLpRuns(options: {
  limit?: number;
  offset?: number;
  strategyId?: number;
  status?: string;
  symbol?: string;
} = {}): Promise<{ runs: LpRunRow[]; total: number }> {
  const q = new URLSearchParams({
    limit: String(options.limit ?? 25),
    offset: String(options.offset ?? 0),
  });
  if (options.strategyId != null && Number.isInteger(options.strategyId)) {
    q.set("strategyId", String(options.strategyId));
  }
  const status = options.status?.trim();
  if (status) q.set("status", status);
  const symbol = options.symbol?.trim();
  if (symbol) q.set("symbol", symbol);

  const res = await fetch(`${base()}/runs?${q}`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { runs?: LpRunRow[]; total?: number };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.runs || typeof body.data.total !== "number") {
    throw new Error(body.error || "Failed to load LP runs");
  }
  return { runs: body.data.runs, total: body.data.total };
}
