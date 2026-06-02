import { getApiBaseUrl } from "@/lib/env";

/** Same auth/proxy tier as other experiment labs (`/experiment/trading-agent`, etc.). */
const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/bitget-vibe`;

export interface StrategySpec {
  name: string;
  token: string;
  bar: string;
  limit: number;
  lookAheadBars: number;
  entryCondition: string;
  minRsi: number | null;
  maxRsi: number | null;
  takeProfitPct: number | null;
  stopLossPct: number | null;
  maxNotionalUsd: number | null;
}

export type VibeExecutionMode = "paper" | "live";

export type LoopPhase =
  | "perceive"
  | "decide"
  | "risk"
  | "execute"
  | "manage"
  | "exit"
  | "skip";

export interface LoopStep {
  phase: LoopPhase;
  message: string;
  payload?: unknown;
  at?: string;
}

export interface VibeSessionSummary {
  id: string;
  name: string;
  mode: VibeExecutionMode;
  status: string;
  shareSlug: string | null;
  winRatePct: number | null;
  returnPct: number | null;
  openPositions: number;
  updatedAt: string;
}

export interface VibeRunRow {
  _id: string;
  status: string;
  symbol: string;
  clearSignal: string;
  entry: number | null;
  stopLoss: number | null;
  firstTarget: number | null;
  simPnlUsd: number | null;
  notionalUsd: number | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export interface VibeMetrics {
  wins: number;
  losses: number;
  decided: number;
  winRate: number | null;
  winRatePct: number | null;
  realizedPnlUsd: number;
  equityUsd: number;
  returnPct: number | null;
  openPositions: number;
  totalRuns: number;
  recentRuns: VibeRunRow[];
  equityCurve: { t: number; equity: number }[];
}

export interface VibeSessionDetail {
  id: string;
  name: string;
  prompt: string;
  strategySpec: StrategySpec;
  mode: VibeExecutionMode;
  status: string;
  cashUsd: number;
  startingUsd: number;
  tickCount: number;
  lastTickAt: string | null;
  lastPerception: unknown;
  lastLoopSteps: LoopStep[];
  shareSlug: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BitgetVibeConfig {
  defaultMode: VibeExecutionMode;
  liveCapable: boolean;
  agentHub: {
    skillHub: string[];
    mcp: string;
  };
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const ENDPOINT_NOT_FOUND_HINT =
  "Bitget Vibe API is not on this server yet. Local dev: set VITE_USE_LOCAL_API=true in web/.env and run the API (cd api && npm run dev). Production: deploy the latest api/ to api.syraa.fun.";

async function vibeFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
    },
  });
  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || !json.success) {
    const err = json.error || res.statusText || "Request failed";
    if (res.status === 404 && /endpoint not found/i.test(err)) {
      throw new Error(ENDPOINT_NOT_FOUND_HINT);
    }
    throw new Error(err);
  }
  return json.data as T;
}

export function fetchBitgetVibeConfig(): Promise<BitgetVibeConfig> {
  return vibeFetch<BitgetVibeConfig>("/config");
}

export function compileVibeStrategy(prompt: string): Promise<{ strategySpec: StrategySpec }> {
  return vibeFetch<{ strategySpec: StrategySpec }>("/compile", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}

export function createVibeSession(body: {
  prompt: string;
  name?: string;
  mode?: VibeExecutionMode;
  runFirstTick?: boolean;
}): Promise<{
  session: VibeSessionDetail;
  metrics: VibeMetrics;
  liveCapable: boolean;
  tickResult?: unknown;
}> {
  return vibeFetch("/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchVibeSession(id: string): Promise<{
  session: VibeSessionDetail;
  metrics: VibeMetrics;
  liveCapable: boolean;
}> {
  return vibeFetch(`/sessions/${encodeURIComponent(id)}`);
}

export function tickVibeSession(id: string): Promise<{
  session: VibeSessionDetail;
  metrics: VibeMetrics;
  liveCapable: boolean;
  tickResult: unknown;
}> {
  return vibeFetch(`/sessions/${encodeURIComponent(id)}/tick`, { method: "POST" });
}

export function listVibeSessions(limit = 20): Promise<{ sessions: VibeSessionSummary[] }> {
  return vibeFetch(`/sessions?limit=${limit}`);
}

export function exportVibeMetricsCsv(metrics: VibeMetrics, sessionName: string): string {
  const header = "run_id,status,symbol,signal,entry,stop_loss,target,pnl_usd,notional_usd,created_at";
  const rows = metrics.recentRuns.map((r) =>
    [
      r._id,
      r.status,
      r.symbol,
      r.clearSignal,
      r.entry ?? "",
      r.stopLoss ?? "",
      r.firstTarget ?? "",
      r.simPnlUsd ?? "",
      r.notionalUsd ?? "",
      r.createdAt,
    ].join(","),
  );
  return `# ${sessionName}\n# win_rate_pct,${metrics.winRatePct ?? ""}\n# return_pct,${metrics.returnPct ?? ""}\n${header}\n${rows.join("\n")}`;
}
