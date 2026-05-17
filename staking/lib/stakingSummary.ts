import { STREAMFLOW_CONFIG } from "@/constants/streamflowConfig";

export interface StakingProtocolSummary {
  network: "mainnet" | "devnet";
  mint: string;
  openLockCount: number;
  closedLockCount: number;
  uniqueWallets: number;
  totalAmountRaw: string;
}

function getApiBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SYRA_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:3000"
  );
}

export async function fetchStakingProtocolSummary(): Promise<StakingProtocolSummary | null> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const network = STREAMFLOW_CONFIG.isDevnet ? "devnet" : "mainnet";
  const mint = STREAMFLOW_CONFIG.tokenMint.toBase58();
  const qs = new URLSearchParams({ mint, network });

  try {
    const res = await fetch(`${base}/streamflow-locks/stats/summary?${qs}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    const body = (await res.json()) as {
      success?: boolean;
      data?: StakingProtocolSummary;
    };
    if (!res.ok || !body.success || !body.data) return null;
    return body.data;
  } catch {
    return null;
  }
}
