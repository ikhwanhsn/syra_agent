import { syraFetch } from "@/lib/agentAuthApi";
import { getApiBaseUrl } from "@/lib/env";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/earn/yield`;

async function parseJson<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: T;
    error?: string;
    code?: string;
  };
  if (!res.ok || body.success === false) {
    const err = new Error(body.error || `Request failed (${res.status})`) as Error & {
      code?: string;
    };
    err.code = body.code;
    throw err;
  }
  return body.data as T;
}

export type EarnDenom = "SOL" | "USDC";
export type EarnRiskLevel = "lower" | "moderate" | "higher" | "extreme";

export type EarnYieldProductStats = {
  productId?: string;
  denom?: EarnDenom;
  /** "lab" = platform aggregate across agents; never personal wallet PnL. */
  scope?: "lab" | "agent" | "earn_session" | string;
  wins?: number | null;
  losses?: number | null;
  errors?: number;
  decided?: number;
  openCount?: number;
  winRate?: number | null;
  winRatePct?: number | null;
  errorRate?: number;
  errorRatePct?: number;
  netPnl?: number;
  netPnlUsd?: number;
  realizedNetPnlSol?: number;
  realizedNetPnlUsd?: number;
  feesClaimedSol?: number;
  equityUsd?: number | null;
  returnPct?: number | null;
  drawdownPct?: number | null;
  aprPctHint?: number | null;
  paperVsRealNote?: string;
  settlement24h?: {
    settleSuccessRate: number;
    settleFailRate: number;
    settleAttempted: number;
    meetsLaunchGuardrail: boolean;
  } | null;
  error?: string;
};

export type EarnYieldProduct = {
  id: string;
  label: string;
  status: string;
  declaredStatus?: string;
  chain: string;
  description: string;
  summary?: string | null;
  howItWorks?: string[];
  rails?: string[];
  riskLevel?: EarnRiskLevel | null;
  denom: EarnDenom;
  walletPurpose?: string;
  walletQuery?: string;
  actionable?: boolean;
  evidence?: Record<string, unknown>;
  minDeposit?: number;
  maxDeposit?: number;
  performanceFeeBps?: number;
  performanceFeePct?: number;
  stats?: EarnYieldProductStats | null;
  readiness?: {
    ready: boolean;
    blockers: string[];
    depositsPaused: boolean;
  };
  disclosures?: string[];
};

export type EarnYieldBoard = {
  products: EarnYieldProduct[];
  platformStats: EarnYieldProductStats | null;
  readiness: {
    ready: boolean;
    blockers: string[];
    depositsPaused: boolean;
  };
  beta: {
    open: boolean;
    allowed: boolean;
    minDepositSol: number;
    maxDepositSol: number;
    performanceFeeBps: number;
    performanceFeePct: number;
  };
  disclosures: string[];
};

export type EarnYieldUserStatus = {
  productId?: string;
  denom?: EarnDenom;
  allowed: boolean;
  betaOpen: boolean;
  agentAddress: string | null;
  enabled: boolean;
  config: {
    enabled: boolean;
    publicEarnListed: boolean;
    depositsPaused: boolean;
    publicMaxDeposit?: number;
    publicMaxDepositSol?: number;
    publicMaxDepositUsdc?: number;
    performanceFeeBps: number;
    lastError: string | null;
    pausedNoStrategyAt: string | null;
  } | null;
  canEnable: boolean;
  summary: {
    /** "earn_session" = since Earn enable on this wallet; never lab history. */
    scope?: "agent" | "lab" | "earn_session" | string;
    publicEarnStartedAt?: string | null;
    netPnl?: number;
    netPnlUsd?: number;
    realizedNetPnlSol?: number;
    realizedNetPnlUsd?: number;
    unrealizedPnlSol?: number;
    totalReturnSol?: number;
    wins?: number;
    losses?: number;
    winRatePct?: number | null;
    openCount?: number;
    equityUsd?: number | null;
    returnPct?: number | null;
  } | null;
  /** Live LP agent wallet capital (deployed + liquid). Null when no LP wallet. */
  wallet?: {
    onChainBalanceSol: number;
    deployedSol: number;
    availableSol: number;
    unrealizedPnlSol: number;
    totalReturnSol: number;
    canOpenNewPositions: boolean;
    lastSignalAt: string | null;
    /** True when agent is enabled but last signal tick is older than the stale window. */
    stale: boolean;
  } | null;
};

export async function fetchEarnYieldBoard(wallet?: string | null): Promise<EarnYieldBoard> {
  const q = wallet ? `?wallet=${encodeURIComponent(wallet)}` : "";
  const res = await fetch(`${base()}/board${q}`, { headers: { Accept: "application/json" } });
  return parseJson(res);
}

export async function fetchEarnYieldStatus(
  anonymousId?: string | null,
  productId?: string | null,
): Promise<EarnYieldUserStatus> {
  const params = new URLSearchParams();
  if (anonymousId) params.set("anonymousId", anonymousId);
  if (productId) params.set("productId", productId);
  const q = params.toString() ? `?${params}` : "";
  const res = await syraFetch(`${base()}/status${q}`, { headers: { Accept: "application/json" } });
  return parseJson(res);
}

export async function enableEarnYield(
  maxDeposit?: number,
  productId?: string | null,
) {
  const body: Record<string, unknown> = {};
  if (maxDeposit != null) body.maxDeposit = maxDeposit;
  if (productId) body.productId = productId;
  const res = await syraFetch(`${base()}/enable`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function disableEarnYield(closeAll = false, productId?: string | null) {
  const body: Record<string, unknown> = { closeAll };
  if (productId) body.productId = productId;
  const res = await syraFetch(`${base()}/disable`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}
