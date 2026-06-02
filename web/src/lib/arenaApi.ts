import { getApiBaseUrl } from "@/lib/env";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/arena`;

export interface ArenaStrategySpec {
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
  regime: "adaptive" | "trend" | "mean_reversion" | "flat";
  marketType: "contract" | "spot";
  allowShort: boolean;
  overlayMinBias: number;
}

export interface PlaybookMetrics {
  status: string;
  failureReason: string | null;
  totalReturnPct: number | null;
  sharpeRatio: number | null;
  maxDrawdownPct: number | null;
  winRate: number | null;
  totalTrades: number | null;
}

export interface AlphaOverlay {
  bias: number;
  biasLabel: string;
  gatePass: boolean;
  components?: Record<string, { score: number; summary: string }>;
  computedAt?: string;
}

export interface ArenaAgentRow {
  id: string;
  name: string;
  prompt: string;
  strategySpec: ArenaStrategySpec;
  bitgetVibeSessionId: string | null;
  playbook: {
    strategyId?: string | null;
    draftId?: string | null;
    versionId?: string | null;
    version?: string | null;
    uploadStatus?: string | null;
    backtestStatus?: string | null;
    metrics?: PlaybookMetrics | null;
    error?: string | null;
  };
  alphaOverlay: AlphaOverlay;
  publishStatus: string;
  asset8004: { asset?: string | null; tokenUri?: string | null };
  subscriberCount: number;
  shareSlug: string | null;
  rankScore: number;
  paperReturnPct: number | null;
  paperWinRatePct: number | null;
  rank?: number;
  backtestReturnPct?: number | null;
  sharpeRatio?: number | null;
  maxDrawdownPct?: number | null;
  winRate?: number | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function arenaFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    throw new Error(body.error || res.statusText || "Arena API error");
  }
  return body.data as T;
}

export function fetchArenaConfig() {
  return arenaFetch<{ playbookCapable: boolean }>("/config");
}

export function fetchArenaLeaderboard(limit = 20) {
  return arenaFetch<{ agents: ArenaAgentRow[]; playbookCapable: boolean }>(
    `/leaderboard?limit=${limit}`,
  );
}

export function fetchArenaAgent(id: string) {
  return arenaFetch<{
    agent: ArenaAgentRow;
    vibeSession: unknown;
    playbookCapable: boolean;
  }>(`/agents/${id}`);
}

export function createArenaAgent(body: {
  prompt: string;
  name?: string;
  walletAddress?: string;
  runPlaybook?: boolean;
  runPaperTick?: boolean;
}) {
  return arenaFetch<{
    agent: ArenaAgentRow;
    vibeSession: unknown;
    playbookCapable: boolean;
  }>("/agents", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function tickArenaAgent(id: string) {
  return arenaFetch<unknown>(`/agents/${id}/tick`, { method: "POST", body: "{}" });
}

export function publishArenaAgent(id: string, register8004 = false) {
  return arenaFetch<unknown>(`/agents/${id}/publish`, {
    method: "POST",
    body: JSON.stringify({ register8004 }),
  });
}

export function subscribeArenaAgent(id: string, chatId?: string) {
  return arenaFetch<unknown>(`/agents/${id}/subscribe`, {
    method: "POST",
    body: JSON.stringify({ chatId }),
  });
}

export function seedArenaAgents() {
  return arenaFetch<{ seeded: number; agents: ArenaAgentRow[] }>("/seed", {
    method: "POST",
    body: "{}",
  });
}

export function compileArenaStrategy(prompt: string) {
  return arenaFetch<{ strategySpec: ArenaStrategySpec }>("/compile", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}
