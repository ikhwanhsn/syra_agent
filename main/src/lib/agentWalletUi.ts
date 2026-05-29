export type AgentChain = "solana" | "base" | "bsc";
export type AgentSortKey = "agent" | "wallet" | "chain" | "updated";
export type AgentSortOrder = "asc" | "desc";

export interface AgentWalletRow {
  anonymousId: string;
  walletAddress: string;
  chain: AgentChain;
  agentAddress: string;
  avatarUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AgentWalletProfile {
  anonymousId: string;
  walletAddress: string | null;
  chain: AgentChain;
  agentAddress: string;
  avatarUrl: string | null;
  solanaAgentAddress: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export function normalizeAgentChain(raw?: string | null): AgentChain {
  const c = String(raw || "solana").toLowerCase();
  if (c === "base") return "base";
  if (c === "bsc" || c === "bnb") return "bsc";
  return "solana";
}

export function agentDetailPath(anonymousId: string): string {
  return `/agents/${encodeURIComponent(anonymousId)}`;
}

export function shortenAddress(addr: string, isEvm = false): string {
  if (!addr) return "—";
  if (isEvm || addr.startsWith("0x")) {
    return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  }
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export function isSolanaAgent(agent: {
  chain?: AgentChain | string;
  agentAddress?: string;
  walletAddress?: string | null;
}): boolean {
  if (agent.chain === "base" || agent.chain === "bsc") return false;
  if (agent.agentAddress?.startsWith("0x")) return false;
  if (agent.walletAddress?.startsWith("0x")) return false;
  return true;
}

export function chainLabel(chain: AgentChain): string {
  if (chain === "base") return "Base";
  if (chain === "bsc") return "BNB Chain";
  return "Solana";
}

export function explorerUrl(chain: AgentChain, address: string): string | null {
  if (!address) return null;
  if (chain === "base") return `https://basescan.org/address/${address}`;
  if (chain === "bsc") {
    return `https://bscscan.com/address/${address}`;
  }
  return `https://solscan.io/account/${address}`;
}

export function userWalletExplorerUrl(walletAddress: string, chain?: AgentChain): string | null {
  if (!walletAddress) return null;
  if (walletAddress.startsWith("0x")) {
    if (chain === "bsc") return `https://bscscan.com/address/${walletAddress}`;
    return `https://basescan.org/address/${walletAddress}`;
  }
  return `https://solscan.io/account/${walletAddress}`;
}

export function chainBadgeClass(chain: AgentChain): string {
  if (chain === "base") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-200";
  }
  if (chain === "bsc") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  return "border-emerald-500/25 bg-emerald-500/10 text-emerald-200";
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 48) return `${hrs}h ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function formatTimestamp(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

export function defaultSortOrder(key: AgentSortKey): AgentSortOrder {
  return key === "updated" ? "desc" : "asc";
}

export function sortAgentRows(
  rows: AgentWalletRow[],
  key: AgentSortKey,
  order: AgentSortOrder,
): AgentWalletRow[] {
  const dir = order === "asc" ? 1 : -1;
  const copy = [...rows];
  copy.sort((a, b) => {
    let cmp = 0;
    if (key === "agent") cmp = a.agentAddress.localeCompare(b.agentAddress);
    else if (key === "wallet") cmp = a.walletAddress.localeCompare(b.walletAddress);
    else if (key === "chain") cmp = a.chain.localeCompare(b.chain) || a.walletAddress.localeCompare(b.walletAddress);
    else {
      const ta = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const tb = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      cmp = ta - tb;
    }
    return cmp * dir;
  });
  return copy;
}
