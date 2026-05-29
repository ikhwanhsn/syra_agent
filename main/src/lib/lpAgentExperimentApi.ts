import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/lp-agent`;

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

/** Format a USD amount for LP experiment UI (not for on-chain precision). */
export function formatLpUsd(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return usdCompact.format(n);
}

/**
 * Net PnL in USD from the snapshot at open: simNetPnlSol × (depositUsd / depositSol).
 * Matches server-side cohort aggregates.
 */
export function lpRunNetPnlUsdFromSnapshot(run: {
  simNetPnlSol?: number | null;
  depositSol?: number | null;
  depositUsd?: number | null;
}): number {
  const netSol = Number(run.simNetPnlSol);
  const depSol = Number(run.depositSol);
  const depUsd = Number(run.depositUsd);
  if (!Number.isFinite(netSol) || !Number.isFinite(depSol) || depSol <= 0 || !Number.isFinite(depUsd)) return 0;
  return netSol * (depUsd / depSol);
}

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
  /** Simulated free bank (SOL) after open fees; excludes principal in open slots. */
  cashSol?: number;
  sumNetPnlSol?: number;
  avgNetPnlSol?: number;
  /** Sum of (simNetPnlSol × depositUsd/depositSol) per run — USD notion at position open. */
  sumNetPnlUsd?: number;
  avgNetPnlUsd?: number;
  sumChainFeesSol?: number;
  sumChainFeesUsd?: number;
}

export interface LpExperimentSimConfig {
  startingBankSol: number;
  maxPositionSol: number;
  maxConcurrentPositions: number;
  openFeeBps: number;
  closeFeeBps: number;
}

export interface LpExperimentLabAgentRow {
  strategyId: number;
  cashSol: number;
  startingBankSol: number;
  openPositions: number;
  deployedSol: number;
  equitySol: number;
}

export interface LpExperimentLabState {
  activeExperimentId: string | null;
  title: string;
  startedAt: string | null;
  /** CoinGecko (or cached) SOL/USD — for converting cash/equity to display USD only. */
  referenceSolPriceUsd?: number;
  simConfig: LpExperimentSimConfig;
  agents: LpExperimentLabAgentRow[];
}

export interface LpGlobalOverview {
  solPriceUsd: number;
  meteora: {
    poolsScanned: number;
    scanTvlUsd: number;
    scanVolume24hUsd: number;
  };
  candidates: {
    poolCount: number;
    trackedTvlUsd: number;
  };
  simulation: {
    activeExperimentId: string | null;
    strategyCount: number;
    settledRuns: number;
    openPositions: number;
    sumNetPnlSol: number;
    sumEquitySol: number;
    sumDeployedSol: number;
    leaderStrategyId: number | null;
    leaderAvgNetPnlSol: number | null;
    leaderWinRate: number | null;
    topWinRateStrategyId: number | null;
    topWinRatePct: number | null;
  };
  realAgent: {
    enabledAgents: number;
    openPositions: number;
    deployedSol: number;
    realizedNetPnlSol: number;
    realWinRate: number | null;
    realWins: number;
    realLosses: number;
    totalFeesClaimedSol: number;
    totalPositions: number;
  };
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
  simOpenFeeSol?: number | null;
  simCloseFeeSol?: number | null;
  simNetPnlSol?: number | null;
  depositSol?: number | null;
  depositUsd?: number | null;
  experimentId?: string | null;
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

export async function fetchLpStats(): Promise<{ agents: LpAgentStats[]; experimentId: string | null }> {
  const res = await fetch(`${base()}/stats`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { agents?: LpAgentStats[]; experimentId?: string | null };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.agents) {
    throw new Error(body.error || "Failed to load LP stats");
  }
  return { agents: body.data.agents, experimentId: body.data.experimentId ?? null };
}

export async function fetchLpGlobalOverview(): Promise<LpGlobalOverview> {
  const res = await fetch(`${base()}/overview`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: LpGlobalOverview;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load LP overview");
  }
  return body.data;
}

export async function fetchLpLabState(): Promise<LpExperimentLabState> {
  const res = await fetch(`${base()}/state`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: LpExperimentLabState;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load LP experiment state");
  }
  return body.data;
}

export async function fetchLpRuns(options: {
  limit?: number;
  offset?: number;
  strategyId?: number;
  status?: string;
  symbol?: string;
  experimentId?: string;
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
  const experimentId = options.experimentId?.trim();
  if (experimentId) q.set("experimentId", experimentId);

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
