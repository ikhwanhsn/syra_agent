import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/chatApi";

export interface PublicMetricsSnapshot {
  success: boolean;
  service: string;
  tagline: string;
  updatedAt: string;
  lifetime: {
    totalCalls: number;
    totalUsdSettled: number;
    uniquePayingWallets: number;
    avgUsdPerCall: number;
  };
  last24h: { calls: number; usdSettled: number };
  last7d: { calls: number; usdSettled: number };
  last30d: { calls: number };
  treasury: { solana: string | null; base: string | null };
  verifyOnChain: {
    hint: string;
    explorers: { base: string | null; solana: string | null };
  };
  byPath: Array<{ path: string; count: number }>;
  byNetwork: Array<{ network: string; calls: number; usdSettled: number }>;
  dailyCalls: Array<{ date: string; count: number }>;
  recentCalls: Array<{
    path: string;
    network: string | null;
    amountUsd: number;
    payer: string | null;
    txSignature: string | null;
    at: string;
  }>;
}

const metricsBase = () => `${getApiBaseUrl().replace(/\/$/, "")}/api/metrics`;

export function fetchPublicMetrics(signal?: AbortSignal): Promise<PublicMetricsSnapshot> {
  return fetch(metricsBase(), { headers: { Accept: "application/json" }, signal }).then(async (res) => {
    if (!res.ok) throw new Error(`Metrics API ${res.status}`);
    return res.json() as Promise<PublicMetricsSnapshot>;
  });
}

export function usePublicMetrics() {
  return useQuery({
    queryKey: ["public-metrics"],
    queryFn: ({ signal }) => fetchPublicMetrics(signal),
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
