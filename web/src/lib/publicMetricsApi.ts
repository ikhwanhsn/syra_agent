import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/chatApi";

export interface SettlementWindow {
  windowStartedAt: string;
  updatedAt: string;
  outcomes: {
    payment_required: number;
    paid: number;
    settle_failed: number;
    verify_failed?: number;
    upstream_error?: number;
    error?: number;
  };
  settledUsd: number;
  settleAttempted: number;
  settleFailRate: number;
  aboveAlertThreshold: boolean;
  topFailReasons?: Array<{ reason: string; count: number }>;
}

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
  last7d: {
    calls: number;
    usdSettled: number;
    uniquePayingWallets?: number | null;
  };
  last30d: { calls: number };
  northStar?: {
    paidCallsLast7d: number;
    uniquePayingWalletsLast7d: number | null;
  };
  funnel?: {
    payersSawPaymentRequired: number;
    payersConvertedToPaid: number;
    paymentRequiredToPaidRate: number;
    firstPaidPayersLast30d: number;
    d7EligiblePayers: number;
    d7RepeatPayers: number;
    d7RepeatRate: number;
  } | null;
  settlement?: {
    note?: string;
    last1h?: SettlementWindow;
    last24h?: SettlementWindow;
    last7d?: SettlementWindow;
    alertThreshold?: {
      settleFailRate: number;
      minAttempts: number;
      window: string;
    };
  } | null;
  bySource?: Record<string, number> | null;
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
  buyback?: {
    buybackShareOfRevenue: number;
    note: string;
    pendingRevenueUsd: number;
    totalAccumulatedUsd: number;
    totalFlushedUsd: number;
    totalBuybackUsdSpent: number;
    totalSyraAcquired: number;
    treasuryWallet: string | null;
    treasurySyraBalance: number | null;
    lastFlushAt: string | null;
    lastBuybackSignature: string | null;
    lastBuybackSolscan: string | null;
    recentBuybacks: Array<{
      at: string | null;
      revenueUsd: number;
      buybackUsd: number;
      syraAcquired: number | null;
      swapSignature: string;
      source?: "x402_scheduler" | "manual_onchain" | "manual_ingest" | string;
      solscanUrl: string | null;
    }>;
  } | null;
  holders?: {
    note: string;
    current: {
      mint: string;
      marketCapUsd: number | null;
      liquidityUsd: number | null;
      volume24hUsd: number | null;
      priceUsd: number | null;
      priceChange24hPct: number | null;
      topHoldersSampled: number | null;
      top10ConcentrationPct: number | null;
      uniqueStakers: number | null;
      totalStakedFormatted: string | null;
      dexscreenerUrl: string;
    } | null;
    history7d: Array<{
      at: string | null;
      marketCapUsd: number | null;
      liquidityUsd: number | null;
      volume24hUsd: number | null;
      priceUsd: number | null;
      uniqueStakers: number | null;
      top10ConcentrationPct: number | null;
    }>;
  } | null;
  rewards?: {
    note: string;
    uniqueEarners: number;
    totalLifetimeSpendUsd: number;
    totalClaimableSyra: number;
    totalClaimedSyra: number;
    totalPendingPoints?: number;
    pointsToSyraRate: number;
  } | null;
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
