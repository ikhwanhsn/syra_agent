import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/lp-robinhood`;

const usdCompact = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

export function formatRobinhoodLpUsd(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return "-";
  return usdCompact.format(n);
}

export type RobinhoodLpRunStatus = "open" | "win" | "loss" | "expired" | "skipped" | "error";

export interface RobinhoodLpStrategy {
  id: number;
  name: string;
  lpShape: "spot" | "bid_ask" | "curve" | "mixed";
  binsBelow: number;
  binsAbove: number;
  notes?: string;
}

export interface RobinhoodLpAgentStats {
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
  avgFeesUsd: number;
  cashUsd?: number;
  sumNetPnlUsd?: number;
  avgNetPnlUsd?: number;
  sumChainFeesUsd?: number;
}

export interface RobinhoodLpSimConfig {
  startingBankUsd: number;
  maxPositionUsd: number;
  maxConcurrentPositions: number;
  openFeeUsd: number;
  closeFeeUsd: number;
}

export interface RobinhoodLpLabAgentRow {
  strategyId: number;
  cashUsd: number;
  startingBankUsd: number;
  openPositions: number;
  deployedUsd: number;
  equityUsd: number;
}

export interface RobinhoodLpLabState {
  activeExperimentId: string | null;
  title: string;
  startedAt: string | null;
  simConfig: RobinhoodLpSimConfig;
  agents: RobinhoodLpLabAgentRow[];
}

export interface RobinhoodLpGlobalOverview {
  chain: string;
  chainId: number;
  protocol: string;
  uniswap: {
    poolsScanned: number;
    scanTvlUsd: number;
    scanVolume24hUsd: number;
  };
  simulation: {
    activeExperimentId: string | null;
    strategyCount: number;
    settledRuns: number;
    openPositions: number;
    sumNetPnlUsd: number;
    sumEquityUsd: number;
    sumDeployedUsd: number;
    leaderStrategyId: number | null;
    leaderAvgNetPnlUsd: number | null;
    leaderWinRate: number | null;
    paperMetricsUntrusted?: boolean;
    paperMetricsDisclaimer?: string;
    feeCalibrationMult?: number;
    signalsMode?: string;
  };
  paperMetricsUntrusted?: boolean;
  paperMetricsDisclaimer?: string;
}

export interface RobinhoodLpRunRow {
  _id: string;
  strategyId: number;
  strategyName: string;
  lpShape: string;
  poolAddress: string;
  poolName: string | null;
  baseSymbol: string | null;
  quoteSymbol: string | null;
  status: RobinhoodLpRunStatus;
  resolution?: string | null;
  simPnlPct?: number | null;
  simNetPnlUsd?: number | null;
  depositUsd?: number | null;
  experimentId?: string | null;
  createdAt?: string;
  resolvedAt?: string | null;
}

async function parseJson<T>(res: Response): Promise<{ ok: boolean; body: T }> {
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, body };
}

export async function fetchRobinhoodLpStats(): Promise<{
  agents: RobinhoodLpAgentStats[];
  experimentId: string | null;
  paperMetricsUntrusted: boolean;
  paperMetricsDisclaimer: string | null;
  feeCalibrationMult: number | null;
  signalsMode: string | null;
}> {
  const res = await fetch(`${base()}/stats`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: {
      agents?: RobinhoodLpAgentStats[];
      experimentId?: string | null;
      paperMetricsUntrusted?: boolean;
      paperMetricsDisclaimer?: string;
      feeCalibrationMult?: number;
      signalsMode?: string;
    };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.agents) {
    throw new Error(body.error || "Failed to load Robinhood LP stats");
  }
  return {
    agents: body.data.agents,
    experimentId: body.data.experimentId ?? null,
    paperMetricsUntrusted: body.data.paperMetricsUntrusted !== false,
    paperMetricsDisclaimer: body.data.paperMetricsDisclaimer ?? null,
    feeCalibrationMult:
      typeof body.data.feeCalibrationMult === "number" ? body.data.feeCalibrationMult : null,
    signalsMode: body.data.signalsMode ?? null,
  };
}

export async function fetchRobinhoodLpGlobalOverview(): Promise<RobinhoodLpGlobalOverview> {
  const res = await fetch(`${base()}/overview`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: RobinhoodLpGlobalOverview;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load Robinhood LP overview");
  }
  return body.data;
}

export async function fetchRobinhoodLpLabState(): Promise<RobinhoodLpLabState> {
  const res = await fetch(`${base()}/state`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: RobinhoodLpLabState;
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load Robinhood LP lab state");
  }
  return body.data;
}

export async function fetchRobinhoodLpRuns(options: {
  limit?: number;
  offset?: number;
  strategyId?: number;
  status?: string;
  symbol?: string;
  experimentId?: string;
} = {}): Promise<{ runs: RobinhoodLpRunRow[]; total: number }> {
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
    data?: { runs?: RobinhoodLpRunRow[]; total?: number };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.runs || typeof body.data.total !== "number") {
    throw new Error(body.error || "Failed to load Robinhood LP runs");
  }
  return { runs: body.data.runs, total: body.data.total };
}
