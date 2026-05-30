import { syraFetch } from "@/lib/agentAuthApi";
import { getApiBaseUrl } from "@/lib/chatApi";
import type { AgentChain } from "@/lib/agentWalletUi";

export type SyraChainId = AgentChain;

export interface SyraChainInfo {
  id: SyraChainId;
  name: string;
  caip2: string;
  status: "active" | "limited" | "configure";
  features: string[];
  note?: string;
  erc8183?: { statusUrl: string | null; negotiateUrl: string | null } | null;
}

export interface SyraChainsResponse {
  success: boolean;
  data?: { chains: SyraChainInfo[] };
}

export async function fetchSyraChains(): Promise<SyraChainInfo[]> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const res = await syraFetch(`${base}/agent/chains`);
  const json = (await res.json()) as SyraChainsResponse;
  if (!json.success || !json.data?.chains) {
    throw new Error("Failed to load chain status");
  }
  return json.data.chains;
}
