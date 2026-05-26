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
  /** When this agent config was first created. */
  startedAt?: string | null;
  updatedAt?: string | null;
}

export interface LpRealScreeningSnapshot {
  score?: number;
  tvlUsd?: number;
  volume24hUsd?: number;
  feeTvlRatio?: number;
}

export interface LpRealCurrentStrategy {
  id: number;
  name: string;
  lpShape: string;
  isSimLeader?: boolean;
  simSumNetPnlSol?: number | null;
  simAvgNetPnlSol?: number | null;
  simDecidedRuns?: number;
}

export interface LpRealState {
  config: LpRealConfig | null;
  /** Native + wSOL only (used for tx fee gates). */
  onChainBalanceSol: number;
  /** Native SOL + USDC/USDT valued in SOL — use for total capital. */
  walletEquitySol: number;
  deployedSol: number;
  /** walletEquitySol + open position deposits (cost basis at open). */
  totalCapitalSol: number;
  /** Book at enable (or inferred from total − realized). */
  capitalBaselineSol: number;
  /** totalCapitalSol − capitalBaselineSol. */
  totalReturnSol: number;
  availableSol: number;
  openPositionsCount: number;
  currentStrategy: LpRealCurrentStrategy | null;
  /** Scale target book (wallet + deployed); matches sim starting bank — not required to run. */
  minBankSol: number;
  /** Minimum wallet SOL to turn on with zero open positions (~1 slot + fees). */
  minWalletToStartSol: number;
  /** True when wallet has enough liquid SOL to open another maxPositionSol slot. */
  canEnable: boolean;
  /** True when the user may enable the agent (entry balance or existing open positions). */
  canTurnOn: boolean;
  /** True when the agent can open another maxPositionSol slot on the next signal tick. */
  canOpenNewPositions: boolean;
  /** True when signed-in session has an active Solana agent wallet. */
  isOperator: boolean;
}

export interface LpRealSummary {
  realizedNetPnlSol: number;
  realizedNetPnlUsd: number;
  /** totalReturnSol − realizedNetPnlSol (open slots + wallet vs baseline). */
  unrealizedPnlSol: number;
  totalReturnSol: number;
  wins: number;
  losses: number;
  openCount: number;
  totalFeesClaimedSol: number;
  deployedSol: number;
  solPriceUsd?: number;
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
  binStep?: number | null;
  binsBelow?: number;
  binsAbove?: number;
  entryPriceUsd?: number | null;
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
  /** Record created (may differ slightly from openedAt during opening). */
  createdAt?: string | null;
  /** Last resolve-tick evaluation while open. */
  lastEvaluatedAt?: string | null;
  errorMessage: string | null;
  screeningSnapshot?: LpRealScreeningSnapshot | null;
  /** True after open tx signature is recorded (SOL actually deployed). */
  depositLocked?: boolean;
  policyReasons?: string[];
}

export interface LpRealPositionsPage {
  positions: LpRealPosition[];
  total: number;
  limit: number;
  offset: number;
}

function lpRealQuery(anonymousId?: string | null): string {
  const q = new URLSearchParams();
  if (anonymousId?.trim()) q.set("anonymousId", anonymousId.trim());
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchLpRealState(anonymousId?: string | null): Promise<LpRealState> {
  const res = await syraFetch(`${base()}/state${lpRealQuery(anonymousId)}`);
  return parseJson<LpRealState>(res);
}

export async function fetchLpRealSummary(anonymousId?: string | null): Promise<LpRealSummary> {
  const res = await syraFetch(`${base()}/summary${lpRealQuery(anonymousId)}`);
  return parseJson<LpRealSummary>(res);
}

export async function fetchLpRealPositions(options?: {
  limit?: number;
  offset?: number;
  status?: string;
  anonymousId?: string | null;
}): Promise<LpRealPositionsPage> {
  const q = new URLSearchParams();
  if (options?.anonymousId?.trim()) q.set("anonymousId", options.anonymousId.trim());
  if (options?.limit != null) q.set("limit", String(options.limit));
  if (options?.offset != null) q.set("offset", String(options.offset));
  if (options?.status) q.set("status", options.status);
  const qs = q.toString();
  const res = await syraFetch(`${base()}/positions${qs ? `?${qs}` : ""}`);
  return parseJson<LpRealPositionsPage>(res);
}

export async function enableLpReal(anonymousId?: string | null): Promise<LpRealState> {
  const res = await syraFetch(`${base()}/enable`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      anonymousId?.trim() ? { anonymousId: anonymousId.trim() } : {},
    ),
  });
  return parseJson<LpRealState>(res);
}

export async function disableLpReal(options?: {
  closeAll?: boolean;
  anonymousId?: string | null;
}): Promise<LpRealState> {
  const res = await syraFetch(`${base()}/disable`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      closeAll: Boolean(options?.closeAll),
      ...(options?.anonymousId?.trim()
        ? { anonymousId: options.anonymousId.trim() }
        : {}),
    }),
  });
  return parseJson<LpRealState>(res);
}

export function solscanTxUrl(sig: string): string {
  return `https://solscan.io/tx/${sig}`;
}

export function solscanAccountUrl(address: string): string {
  return `https://solscan.io/account/${address}`;
}
