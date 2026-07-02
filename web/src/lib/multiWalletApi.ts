import { syraFetch } from "@/lib/agentAuthApi";
import { getApiBaseUrl } from "@/lib/chatApi";

const base = () => `${getApiBaseUrl()}/multiwallet`;

export type MultiWalletTierId = "basic" | "staker" | "whale" | "admin";

export interface MultiWalletTierSummary {
  tier: MultiWalletTierId;
  limit: number | null;
  activeCount: number;
  remaining: number | null;
  stakedSyra: number;
  activeLockCount?: number;
  fundSolPerWallet: number;
  swapSolPerWallet: number;
  ansemMint: string;
  requiresStakedSyra?: boolean;
  upgradeHints?: {
    basic?: string;
    staker: string;
    whale: string;
  };
}

export interface MultiWalletRow {
  id: string;
  publicKey: string;
  walletIndex: number;
  label: string | null;
  status: "active" | "archived";
  ansemBought: boolean;
  ansemBuySignature: string | null;
  ansemBuyError: string | null;
  ansemBuyAt: string | null;
  ansemBalanceAtBuy: number | null;
  hasAnsemAirdrop: boolean;
  ansemAirdropExtra: number | null;
  createdAt: string;
  solBalance: number | null;
  ansemBalance: number | null;
}

export interface MultiWalletListResponse extends MultiWalletTierSummary {
  wallets: MultiWalletRow[];
}

export interface MultiWalletGenerateResponse {
  tier: MultiWalletTierId;
  limit: number | null;
  activeCount: number;
  wallets: MultiWalletRow[];
}

export interface MultiWalletBuyResult {
  publicKey: string;
  success: boolean;
  signature?: string;
  source?: string;
  error?: string;
}

export interface MultiWalletExecuteBuyResponse {
  total: number;
  succeeded: number;
  failed: number;
  swapSol: number;
  ansemMint: string;
  results: MultiWalletBuyResult[];
}

export interface MultiWalletRevealResponse {
  publicKey: string;
  secretKey: string;
  walletIndex: number;
  label: string | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, unknown>;
}

async function parseApi<T>(res: Response): Promise<T> {
  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;
  if (!res.ok || body.success === false) {
    const err = new Error(body.error || `Request failed (${res.status})`);
    if (body.details) {
      (err as Error & { details?: Record<string, unknown> }).details = body.details;
    }
    throw err;
  }
  return body.data as T;
}

export async function fetchMultiWalletTier(): Promise<MultiWalletTierSummary> {
  const res = await syraFetch(`${base()}/tier`);
  return parseApi<MultiWalletTierSummary>(res);
}

export async function fetchMultiWallets(includeBalances = true): Promise<MultiWalletListResponse> {
  const qs = includeBalances ? "?includeBalances=1" : "";
  const res = await syraFetch(`${base()}/wallets${qs}`);
  return parseApi<MultiWalletListResponse>(res);
}

export async function generateMultiWallets(count: number): Promise<MultiWalletGenerateResponse> {
  const res = await syraFetch(`${base()}/generate`, {
    method: "POST",
    body: JSON.stringify({ count }),
  });
  return parseApi<MultiWalletGenerateResponse>(res);
}

export async function revealMultiWalletSecret(publicKey: string): Promise<MultiWalletRevealResponse> {
  const res = await syraFetch(`${base()}/reveal`, {
    method: "POST",
    body: JSON.stringify({ publicKey }),
  });
  return parseApi<MultiWalletRevealResponse>(res);
}

export async function executeMultiWalletAnsemBuy(
  publicKeys: string[],
  swapSol?: number,
): Promise<MultiWalletExecuteBuyResponse> {
  const res = await syraFetch(`${base()}/execute-buy`, {
    method: "POST",
    body: JSON.stringify({ publicKeys, swapSol }),
  });
  return parseApi<MultiWalletExecuteBuyResponse>(res);
}

export async function archiveMultiWallet(publicKey: string): Promise<{ publicKey: string; status: string }> {
  const res = await syraFetch(`${base()}/archive`, {
    method: "POST",
    body: JSON.stringify({ publicKey }),
  });
  return parseApi<{ publicKey: string; status: string }>(res);
}

export function tierLabel(tier: MultiWalletTierId): string {
  switch (tier) {
    case "admin":
      return "Admin";
    case "whale":
      return "Whale staker";
    case "staker":
      return "Staker";
    default:
      return "Basic (no SYRA)";
  }
}

export function tierWalletLimitLabel(limit: number | null): string {
  return limit == null ? "Unlimited" : String(limit);
}
