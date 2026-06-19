import { getApiBaseUrl } from "@/lib/chatApi";
import type { AgentWalletPurpose } from "@/lib/agentWalletCatalog";

async function fetchInternalJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getApiBaseUrl()}${path}`;
  const res = await fetch(url, { ...init, credentials: "include" });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      (typeof body.error === "string" && body.error) ||
      (typeof body.message === "string" && body.message) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

export interface InternalAgentWalletBalances {
  agentAddress: string;
  solBalance: number;
  usdcBalance: number;
}

export interface InternalAgentWalletRow {
  anonymousId: string;
  agentAddress: string;
  purpose: AgentWalletPurpose;
  provisionedVia: string | null;
  payerAddress: string | null;
  walletAddress: string | null;
  chain: string;
  balances: InternalAgentWalletBalances | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface InternalAgentWalletSet {
  baseAnonymousId: string;
  walletAddress: string | null;
  payerAddress: string | null;
  provisionedVia: string | null;
  chain: string;
  wallets: Partial<Record<AgentWalletPurpose, InternalAgentWalletRow>>;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface InternalAgentWalletsResponse {
  success: boolean;
  data: {
    total: number;
    limit: number;
    offset: number;
    agents: InternalAgentWalletSet[];
  };
}

export async function fetchInternalAgentWallets(params?: {
  limit?: number;
  offset?: number;
  q?: string;
}): Promise<InternalAgentWalletsResponse["data"]> {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set("limit", String(params.limit));
  if (params?.offset != null) search.set("offset", String(params.offset));
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  const res = await fetchInternalJson<InternalAgentWalletsResponse>(
    `/internal/agent-wallets${qs ? `?${qs}` : ""}`,
  );
  return res.data;
}
