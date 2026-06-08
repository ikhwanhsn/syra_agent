import { formatCompactAmount, formatUnits } from "@/lib/marketing/tokenFormat";

export const SYRA_STAKING_MINT = "8a3sEw2kizHxVnT9oLEVLADx8fTMPkjbEGSraqNWpump";
export const SYRA_TOKEN_DECIMALS = 6;

export type StakingProtocolSummary = {
  network: "mainnet" | "devnet";
  mint: string;
  openLockCount: number;
  closedLockCount: number;
  uniqueWallets: number;
  totalAmountRaw: string;
};

export type StakingStatsDisplay = {
  totalLockedCompact: string;
  stakerCount: number;
  openLockCount: number;
};

export function formatStakingStatsDisplay(
  summary: StakingProtocolSummary | null | undefined,
  decimals = SYRA_TOKEN_DECIMALS,
): StakingStatsDisplay | null {
  if (!summary?.totalAmountRaw) return null;
  try {
    const raw = BigInt(summary.totalAmountRaw);
    if (raw <= 0n) return null;
    const human = formatUnits(raw, decimals, 4);
    return {
      totalLockedCompact: formatCompactAmount(human),
      stakerCount: summary.uniqueWallets,
      openLockCount: summary.openLockCount,
    };
  } catch {
    return null;
  }
}

export async function fetchStakingProtocolSummary(
  apiBase: string,
  options?: { mint?: string; network?: "mainnet" | "devnet"; signal?: AbortSignal },
): Promise<StakingProtocolSummary | null> {
  const base = apiBase.replace(/\/?$/, "/");
  const mint = options?.mint ?? SYRA_STAKING_MINT;
  const network = options?.network ?? "mainnet";
  const qs = new URLSearchParams({ mint, network });

  const res = await fetch(`${base}streamflow-locks/stats/summary?${qs}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    signal: options?.signal,
  });

  const body = (await res.json().catch(() => null)) as {
    success?: boolean;
    data?: StakingProtocolSummary;
  } | null;

  if (!res.ok || !body?.success || !body.data) return null;
  return body.data;
}
