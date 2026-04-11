import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/trading-agent`;

export type TradingExperimentSuiteId = "primary" | "secondary" | "multi_resource";

/** Lab ledgers merged into one UI list (order used for sort + encoded bubble ids). */
export const TRADING_EXPERIMENT_LAB_SUITES: readonly TradingExperimentSuiteId[] = [
  "primary",
  "secondary",
  "multi_resource",
];

/** Unified lab label (suites still differ in API `?suite=` but UI presents one experiment). */
export const EXPERIMENT_LEDGER_LABEL: Record<TradingExperimentSuiteId, string> = {
  primary: "Experiment",
  secondary: "Experiment",
  multi_resource: "Experiment",
};

const ENCODED_LAB_AGENT_STRIDE = 10_000;

/**
 * Stable numeric id for chart bubbles when the same agentId exists on multiple ledgers.
 * Decode with {@link decodeExperimentLabAgentId}.
 */
export function encodeExperimentLabAgentId(suite: TradingExperimentSuiteId, agentId: number): number {
  const idx = TRADING_EXPERIMENT_LAB_SUITES.indexOf(suite);
  const s = idx >= 0 ? idx : 0;
  return s * ENCODED_LAB_AGENT_STRIDE + agentId;
}

export function decodeExperimentLabAgentId(encoded: number): {
  experimentSuite: TradingExperimentSuiteId;
  agentId: number;
} {
  const suiteIdx = Math.floor(encoded / ENCODED_LAB_AGENT_STRIDE);
  const agentId = encoded % ENCODED_LAB_AGENT_STRIDE;
  return {
    experimentSuite: TRADING_EXPERIMENT_LAB_SUITES[suiteIdx] ?? "primary",
    agentId,
  };
}

export function normalizeExperimentSuite(raw: string | null | undefined): TradingExperimentSuiteId {
  const s = String(raw || "primary")
    .trim()
    .toLowerCase();
  if (s === "secondary" || s === "multi_resource" || s === "primary") return s;
  return "primary";
}

/** Matches API / Mongo enum for experiment run `status`. */
export const TRADING_EXPERIMENT_RUN_STATUSES = [
  "open",
  "win",
  "loss",
  "expired",
  "skipped_invalid_levels",
  "error",
] as const;

export type TradingExperimentRunStatus = (typeof TRADING_EXPERIMENT_RUN_STATUSES)[number];

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
  /** Multi-resource suite: CEX key. */
  cexSource?: string | null;
  /**
   * When stats are merged across lab ledgers, identifies which suite this row’s runs belong to.
   * Profile and runs APIs still use `?suite=` for this value.
   */
  experimentSuite?: TradingExperimentSuiteId;
}

export interface TradingExperimentRunRow {
  _id: string;
  suite?: string | null;
  cexSource?: string | null;
  /** User custom strategy run */
  userStrategyId?: string | null;
  userWalletAddress?: string | null;
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

/** Parallel fetch of all standard lab suites; agents are tagged with `experimentSuite`. */
export async function fetchTradingExperimentStatsAll(): Promise<{
  agents: TradingExperimentAgentStats[];
}> {
  const parts = await Promise.all(
    TRADING_EXPERIMENT_LAB_SUITES.map((suite) => fetchTradingExperimentStats(suite)),
  );
  const agents = parts.flatMap((p, i) =>
    p.agents.map((a) => ({
      ...a,
      experimentSuite: TRADING_EXPERIMENT_LAB_SUITES[i],
    })),
  );
  return { agents };
}

/** Suite query for `/runs`: single ledger or merged standard lab (`lab_all`). */
export type TradingExperimentRunsSuiteParam =
  | TradingExperimentSuiteId
  | "lab_all"
  | "all"
  | "merged";

export async function fetchTradingExperimentRuns(options: {
  limit?: number;
  offset?: number;
  suite?: TradingExperimentRunsSuiteParam;
  status?: string;
  agentId?: number;
  symbol?: string;
  signal?: string;
} = {}): Promise<{ runs: TradingExperimentRunRow[]; total: number }> {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;
  const suite = options.suite ?? "primary";
  const q = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    suite,
  });
  const st = options.status?.trim();
  if (st) q.set("status", st);
  if (options.agentId != null && Number.isInteger(options.agentId)) {
    q.set("agentId", String(options.agentId));
  }
  const sym = options.symbol?.trim();
  if (sym) q.set("symbol", sym);
  const sig = options.signal?.trim();
  if (sig) q.set("signal", sig);
  const res = await fetch(`${base()}/runs?${q}`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { runs: TradingExperimentRunRow[]; total?: number };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.runs || typeof body.data.total !== "number") {
    throw new Error(body.error || "Failed to load runs");
  }
  return { runs: body.data.runs, total: body.data.total };
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

/** Max custom strategy agents per connected wallet (enforced server-side). */
export const MAX_USER_CUSTOM_STRATEGIES_PER_WALLET = 5;

export interface UserCustomStrategyDoc {
  _id: string;
  walletAddress: string;
  name: string;
  token: string;
  bar: string;
  limit: number;
  lookAheadBars: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserCustomStrategyAgentStats {
  strategyId: string;
  name: string;
  token: string;
  bar: string;
  limit: number;
  lookAheadBars: number;
  wins: number;
  losses: number;
  decided: number;
  winRate: number | null;
  winRatePct: number | null;
  openPositions: number;
}

export async function fetchUserCustomStrategies(walletAddress: string): Promise<{
  strategies: UserCustomStrategyDoc[];
  count: number;
  maxAgents: number;
}> {
  const q = new URLSearchParams({ walletAddress });
  const res = await fetch(`${base()}/custom/strategies?${q}`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { strategies: UserCustomStrategyDoc[]; count: number; maxAgents: number };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.strategies) {
    throw new Error(body.error || "Failed to load custom strategies");
  }
  return {
    strategies: body.data.strategies,
    count: body.data.count,
    maxAgents: body.data.maxAgents,
  };
}

export async function createUserCustomStrategy(payload: {
  walletAddress: string;
  name: string;
  token: string;
  bar: string;
  limit: number;
  lookAheadBars: number;
}): Promise<UserCustomStrategyDoc> {
  const res = await fetch(`${base()}/custom/strategies`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { strategy: UserCustomStrategyDoc };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.strategy) {
    throw new Error(body.error || "Failed to create strategy");
  }
  return body.data.strategy;
}

export async function deleteUserCustomStrategy(
  walletAddress: string,
  strategyId: string,
): Promise<void> {
  const q = new URLSearchParams({ walletAddress });
  const res = await fetch(`${base()}/custom/strategies/${encodeURIComponent(strategyId)}?${q}`, {
    method: "DELETE",
    credentials: "include",
  });
  const { ok, body } = await parseJson<{ success?: boolean; error?: string }>(res);
  if (!ok || !body.success) {
    throw new Error(body.error || "Failed to delete strategy");
  }
}

export async function fetchUserCustomStats(walletAddress: string): Promise<{
  wallet: string;
  maxAgents: number;
  agents: UserCustomStrategyAgentStats[];
}> {
  const q = new URLSearchParams({ walletAddress });
  const res = await fetch(`${base()}/custom/stats?${q}`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { wallet: string; maxAgents: number; agents: UserCustomStrategyAgentStats[] };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.agents) {
    throw new Error(body.error || "Failed to load custom stats");
  }
  return body.data;
}

export async function fetchUserCustomRuns(options: {
  walletAddress: string;
  limit?: number;
  offset?: number;
  strategyId?: string;
  status?: string;
}): Promise<{ runs: TradingExperimentRunRow[]; total: number }> {
  const q = new URLSearchParams({
    walletAddress: options.walletAddress,
    limit: String(options.limit ?? 20),
    offset: String(options.offset ?? 0),
  });
  const st = options.status?.trim();
  if (st) q.set("status", st);
  const sid = options.strategyId?.trim();
  if (sid) q.set("strategyId", sid);
  const res = await fetch(`${base()}/custom/runs?${q}`, { credentials: "include" });
  const { ok, body } = await parseJson<{
    success?: boolean;
    data?: { runs: TradingExperimentRunRow[]; total?: number };
    error?: string;
  }>(res);
  if (!ok || !body.success || !body.data?.runs || typeof body.data.total !== "number") {
    throw new Error(body.error || "Failed to load custom runs");
  }
  return { runs: body.data.runs, total: body.data.total };
}
