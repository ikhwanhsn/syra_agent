import { getApiBaseUrl } from "@/lib/chatApi";
import { syraFetch } from "@/lib/agentAuthApi";

const base = () => `${getApiBaseUrl().replace(/\/$/, "")}/experiment/lp-agent-real`;

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

export interface LpRealConfig {
  agentAddress: string;
  enabled: boolean;
  targetBankSol: number;
  maxPositionSol: number;
  maxConcurrentPositions: number;
  reserveSolForFees: number;
  currentStrategyId: number | null;
  lastSignalAt: string | null;
  lastResolveAt: string | null;
  lastError: string | null;
  experimentId: string;
  closeAllRequested: boolean;
}

export interface LpRealState {
  config: LpRealConfig | null;
  onChainBalanceSol: number;
  deployedSol: number;
  availableSol: number;
  openPositionsCount: number;
  currentStrategy: { id: number; name: string; lpShape: string } | null;
  /** Minimum on-chain SOL required to enable (matches targetBankSol). */
  minBankSol: number;
  /** True when on-chain balance >= minBankSol. */
  canEnable: boolean;
  /** True when signed-in session has an active Solana agent wallet. */
  isOperator: boolean;
}

export interface LpRealSummary {
  realizedNetPnlSol: number;
  realizedNetPnlUsd: number;
  wins: number;
  losses: number;
  openCount: number;
  totalFeesClaimedSol: number;
  deployedSol: number;
}

export type LpRealPositionStatus =
  | "opening"
  | "open"
  | "closing"
  | "closed_win"
  | "closed_loss"
  | "claim_only"
  | "error"
  | "expired";

export interface LpRealPosition {
  id: string;
  experimentId: string;
  strategyId: number;
  strategyName: string;
  lpShape: string;
  poolAddress: string;
  poolName: string | null;
  baseSymbol: string | null;
  quoteSymbol: string | null;
  status: LpRealPositionStatus;
  resolution: string | null;
  depositSol: number;
  depositUsd: number;
  realNetPnlSol: number | null;
  realNetPnlUsd: number | null;
  realFeesClaimedSol: number;
  openTxSig: string | null;
  closeTxSig: string | null;
  positionPubkey: string;
  openedAt: string | null;
  resolvedAt: string | null;
  errorMessage: string | null;
}

export interface LpRealPositionsPage {
  positions: LpRealPosition[];
  total: number;
  limit: number;
  offset: number;
}

export async function fetchLpRealState(): Promise<LpRealState> {
  const res = await syraFetch(`${base()}/state`);
  return parseJson<LpRealState>(res);
}

export async function fetchLpRealSummary(): Promise<LpRealSummary> {
  const res = await syraFetch(`${base()}/summary`);
  return parseJson<LpRealSummary>(res);
}

export async function fetchLpRealPositions(options?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<LpRealPositionsPage> {
  const q = new URLSearchParams();
  if (options?.limit != null) q.set("limit", String(options.limit));
  if (options?.offset != null) q.set("offset", String(options.offset));
  if (options?.status) q.set("status", options.status);
  const qs = q.toString();
  const res = await syraFetch(`${base()}/positions${qs ? `?${qs}` : ""}`);
  return parseJson<LpRealPositionsPage>(res);
}

export async function enableLpReal(): Promise<LpRealState> {
  const res = await syraFetch(`${base()}/enable`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  return parseJson<LpRealState>(res);
}

export async function disableLpReal(options?: { closeAll?: boolean }): Promise<LpRealState> {
  const res = await syraFetch(`${base()}/disable`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ closeAll: Boolean(options?.closeAll) }),
  });
  return parseJson<LpRealState>(res);
}

export function solscanTxUrl(sig: string): string {
  return `https://solscan.io/tx/${sig}`;
}

export function solscanAccountUrl(address: string): string {
  return `https://solscan.io/account/${address}`;
}
