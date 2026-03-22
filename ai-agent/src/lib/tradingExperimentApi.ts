import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/trading-agent`;

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

export async function fetchTradingExperimentStats(): Promise<{
  strategies: TradingExperimentStrategy[];
  agents: TradingExperimentAgentStats[];
}> {
  const res = await fetch(`${base()}/stats`, { credentials: "include" });
  const { ok, body } = await parseJson<{ success?: boolean; data?: { strategies: TradingExperimentStrategy[]; agents: TradingExperimentAgentStats[] }; error?: string }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Failed to load experiment stats");
  }
  return body.data;
}

export async function fetchTradingExperimentRuns(limit = 50): Promise<TradingExperimentRunRow[]> {
  const q = new URLSearchParams({ limit: String(limit) });
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
    data?: { sampled: number; resolved: number; errors: string[] };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data) {
    throw new Error(body.error || "Run cycle failed");
  }
  return body.data;
}
