import { getApiBaseUrl } from "@/lib/env";

const paper = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/momentum-rotator`;
const real = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/momentum-rotator-real`;

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

export type MomentumAgentStats = {
  strategyId: number;
  strategyName: string;
  wins: number;
  losses: number;
  expired: number;
  decided: number;
  openPositions: number;
  winRate: number | null;
  sumPnlUsd: number;
  leaderScore?: number;
};

export async function fetchMomentumLabState() {
  return parseJson<{
    activeExperimentId: string;
    title: string;
    startedAt: string;
    simConfig: Record<string, number>;
  }>(await fetch(`${paper()}/state`));
}

export async function fetchMomentumStats() {
  return parseJson<{ experimentId: string; agents: MomentumAgentStats[] }>(
    await fetch(`${paper()}/stats`),
  );
}

export async function fetchMomentumStrategies() {
  const data = await parseJson<{ strategies: Array<Record<string, unknown>> }>(
    await fetch(`${paper()}/strategies`),
  );
  return data.strategies;
}

export async function fetchMomentumRuns(opts: { limit?: number; offset?: number; status?: string } = {}) {
  const q = new URLSearchParams();
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  if (opts.status) q.set("status", opts.status);
  return parseJson<{ rows: Array<Record<string, unknown>>; total: number }>(
    await fetch(`${paper()}/runs?${q}`),
  );
}

export async function fetchMomentumRealState() {
  return parseJson<Record<string, unknown>>(await fetch(`${real()}/state`, { credentials: "include" }));
}
