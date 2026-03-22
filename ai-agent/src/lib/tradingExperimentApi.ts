import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/trading-agent`;

export type TradingExperimentSuiteId = "primary" | "secondary" | "multi_resource";

export interface TradingExperimentSuiteMeta {
  id: TradingExperimentSuiteId;
  title: string;
  description: string;
}

export interface TradingExperimentStrategy {
  id: number;
  name: string;
  token: string;
  bar: string;
  limit: number;
  lookAheadBars: number;
}

export interface TradingExperimentAgentStats {
  agentId: number;
  name: string;
  token: string;
  bar: string;
  limit: number;
  wins: number;
  losses: number;
  decided: number;
  winRate: number | null;
  winRatePct: number | null;
  openPositions: number;
}

export interface TradingExperimentRunRow {
  _id: string;
  suite?: string | null;
  cexSource?: string | null;
  agentId: number;
  agentName: string;
  token: string;
  bar: string;
  symbol: string;
  clearSignal: string;
  status: string;
  entry?: number | null;
  stopLoss?: number | null;
  firstTarget?: number | null;
  resolution?: string | null;
  forwardBarsExamined?: number;
  createdAt?: string;
  resolvedAt?: string | null;
}

async function parseJson<T>(res: Response): Promise<{ ok: boolean; body: T }> {
  const body = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, body };
}

export async function fetchTradingExperimentSuites(): Promise<TradingExperimentSuiteMeta[]> {
  const res = await fetch(`${base()}/suites`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { suites: TradingExperimentSuiteMeta[] };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.suites) {
    throw new Error(body.error || "Failed to load experiment suites");
  }
  return body.data.suites;
}

export async function fetchTradingExperimentStats(
  suite: TradingExperimentSuiteId = "primary",
): Promise<{
  strategies: TradingExperimentStrategy[];
  agents: TradingExperimentAgentStats[];
  suite: string;
}> {
  const q = new URLSearchParams({ suite });
  const res = await fetch(`${base()}/stats?${q}`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: {
      strategies: TradingExperimentStrategy[];
      agents: TradingExperimentAgentStats[];
      suite: string;
    };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load experiment stats");
  }
  return body.data;
}

export async function fetchTradingExperimentRuns(
  limit = 50,
  suite: TradingExperimentSuiteId = "primary",
): Promise<TradingExperimentRunRow[]> {
  const q = new URLSearchParams({ limit: String(limit), suite });
  const res = await fetch(`${base()}/runs?${q}`, { credentials: "include" });
  const { ok, body } = await parseJson<{ success?: boolean; data?: { runs: TradingExperimentRunRow[] }; error?: string }>(res);
  if (!ok || !body.success || !body.data?.runs) {
    throw new Error(body.error || "Failed to load runs");
  }
  return body.data.runs;
}

/**
 * Triggers one resolve + sample cycle on the server. Fails if TRADING_EXPERIMENT_CRON_SECRET is set
 * (use server cron or curl with the secret instead).
 */
export async function postTradingExperimentRunCycle(secretHeader?: string): Promise<{
  sampled: number;
  resolved: number;
  errors: string[];
  bySuite?: Record<string, number>;
}> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secretHeader) headers["x-trading-experiment-secret"] = secretHeader;
  const res = await fetch(`${base()}/run-cycle`, {
    method: "POST",
    credentials: "include",
    headers,
    body: "{}",
  });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { sampled: number; resolved: number; errors: string[]; bySuite?: Record<string, number> };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Run cycle failed");
  }
  return body.data;
}

/** 1m TP/SL scan only (same as frequent server cron). */
export async function postTradingExperimentValidateTick(secretHeader?: string): Promise<{
  resolved: number;
  touched: number;
  errors: string[];
}> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secretHeader) headers["x-trading-experiment-secret"] = secretHeader;
  const res = await fetch(`${base()}/validate-tick`, {
    method: "POST",
    credentials: "include",
    headers,
    body: "{}",
  });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { resolved: number; touched: number; errors: string[] };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Validate tick failed");
  }
  return body.data;
}

/** New signal samples only (hourly job). `suite: "all"` runs both isolated experiments. */
export async function postTradingExperimentSignalTick(
  secretHeader?: string,
  suite: TradingExperimentSuiteId | "all" = "all",
): Promise<{
  created: number;
  errors: string[];
  suite?: string;
  bySuite?: Record<string, number>;
}> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (secretHeader) headers["x-trading-experiment-secret"] = secretHeader;
  const res = await fetch(`${base()}/signal-tick`, {
    method: "POST",
    credentials: "include",
    headers,
    body: JSON.stringify({ suite }),
  });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: {
      created: number;
      errors: string[];
      suite?: string;
      bySuite?: Record<string, number>;
    };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Signal tick failed");
  }
  return body.data;
}
