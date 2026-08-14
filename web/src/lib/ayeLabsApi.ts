import { getApiBaseUrl } from "@/lib/env";

const paper = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/ayelabs`;

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: string;
  };
  if (!res.ok || body.success === false) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body.data as T;
}

export type AyeLabsAgentStats = {
  strategyId: number;
  strategyName: string;
  wins: number;
  losses: number;
  expired: number;
  decided: number;
  openPositions: number;
  winRate: number | null;
  sumNetPnlSol: number;
  leaderScore?: number;
};

export async function fetchAyeLabsLabState() {
  return parseJson<{
    activeExperimentId: string;
    title: string;
    startedAt: string;
    simConfig: Record<string, number>;
    screening?: Record<string, unknown>;
    strategySource?: string;
    gmgnConfigured?: boolean;
  }>(await fetch(`${paper()}/state`));
}

export async function fetchAyeLabsStats() {
  return parseJson<{ experimentId: string; agents: AyeLabsAgentStats[] }>(
    await fetch(`${paper()}/stats`),
  );
}

export async function fetchAyeLabsStrategies() {
  const data = await parseJson<{ strategies: Array<Record<string, unknown>> }>(
    await fetch(`${paper()}/strategies`),
  );
  return data.strategies;
}

export async function fetchAyeLabsRuns(
  opts: { limit?: number; offset?: number; status?: string } = {},
) {
  const q = new URLSearchParams();
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  if (opts.status) q.set("status", opts.status);
  return parseJson<{ rows: Array<Record<string, unknown>>; total: number }>(
    await fetch(`${paper()}/runs?${q}`),
  );
}
