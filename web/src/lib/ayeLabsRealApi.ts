import { getApiBaseUrl } from "@/lib/env";

const real = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/ayelabs-real`;

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

export type AyeLabsEngineHealth = {
  running: boolean;
  pid: number | null;
  agentAddress: string | null;
  anonymousId: string | null;
  restarts: number;
  lastExitCode: number | null;
  lastStderr: string;
  startedAt: string | null;
  dryRun: boolean;
  wantRunning: boolean;
  mode?: string;
  lastSyncAt?: string | null;
  lastSyncError?: string | null;
};

export type AyeLabsRealState = {
  enabled: boolean;
  experimentId: string | null;
  agentAddress: string | null;
  currentStrategyId: number | null;
  maxPositionSol: number;
  maxConcurrentPositions: number;
  dailyMaxLossSol?: number;
  depositsPaused: boolean;
  closeAllRequested?: boolean;
  publicEarnListed?: boolean;
  lastSignalAt: string | null;
  lastResolveAt: string | null;
  lastError: string | null;
  openPositions?: number;
  realizedNetPnlSol?: number;
  realizedNetPnlUsd?: number;
  /** Alias */
  realizedPnlSol?: number;
  wins?: number;
  losses?: number;
  realWins?: number;
  realLosses?: number;
  realWinRate?: number | null;
  canEnable?: boolean;
  cronEnabled?: boolean;
  paperGraduation?: {
    pass: boolean;
    decided: number;
    sumNetPnlSol?: number;
    sumPnlSol?: number;
    minDecided?: number;
    reason: string | null;
  };
  caps?: {
    maxPositionSol: number;
    maxConcurrentPositions: number;
    capSol?: number;
  };
  hardCaps?: {
    maxPositionSol: number;
    maxConcurrentPositions: number;
    dailyMaxLossSol: number;
  };
  onchain?: {
    venue: string;
    protocol: string;
    denom: string;
    mode: string;
    walletPurpose?: string;
  };
  engine?: AyeLabsEngineHealth;
};

export async function fetchAyeLabsRealState() {
  return parseJson<AyeLabsRealState>(
    await fetch(`${real()}/state`, { credentials: "include" }),
  );
}

export async function fetchAyeLabsRealPositions(
  opts: { limit?: number; offset?: number; status?: string; agentAddress?: string } = {},
) {
  const q = new URLSearchParams();
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.offset) q.set("offset", String(opts.offset));
  if (opts.status) q.set("status", opts.status);
  if (opts.agentAddress) q.set("agentAddress", opts.agentAddress);
  return parseJson<{ positions: Array<Record<string, unknown>>; total: number }>(
    await fetch(`${real()}/positions?${q}`, { credentials: "include" }),
  );
}

export async function enableAyeLabsReal(
  opts: {
    maxPositionSol?: number;
    requireGraduation?: boolean;
    dryRun?: boolean;
  } = {},
) {
  return parseJson<AyeLabsRealState>(
    await fetch(`${real()}/enable`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    }),
  );
}

export async function disableAyeLabsReal(opts: { closeAll?: boolean } = {}) {
  return parseJson<AyeLabsRealState>(
    await fetch(`${real()}/disable`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closeAll: opts.closeAll !== false }),
    }),
  );
}
