import { useQuery } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/chatApi";
import { ANSEM_COMMUNITY_REFETCH_MS, ANSEM_HOLDER_COUNT_REFETCH_MS, ANSEM_MINT } from "@/lib/ansem";
import type {
  HolderInsightsPayload,
  TokenKolRow,
  TokenKolShillsPayload,
} from "@/lib/pumpfunAnalysisApi";

export interface AnsemTopHolderRow {
  rank: number;
  wallet: string | null;
  sharePct: number | null;
  balanceHuman: number | null;
  netWorthUsd?: number | null;
}

export interface AnsemDistributionPayload {
  decentralizationScore: number;
  concentration: {
    top1: number;
    top3: number;
    top5: number;
    top10: number;
    top20: number;
  };
  tiers: { whale: number; dolphin: number; shrimp: number };
  flags: Array<{
    id: string;
    severity: "high" | "medium" | "low";
    message: string;
  }>;
  holderSampleSize: number;
}

export interface AnsemTokenIntelPayload {
  symbol: string;
  name: string;
  complete: boolean | null;
  priceUsd: number | null;
  marketCapUsd: number | null;
  athMarketCapUsd: number | null;
  bondingLiquidityUsd: number | null;
  holderCount: number | null;
  replyCount: number | null;
  createdTimestampMs: number | null;
  lastTradeTimestampMs: number | null;
  imageUri: string | null;
  source: string | null;
}

export interface AnsemCommunityPayload {
  mint: string;
  holders: {
    count: number | null;
    top10ConcentrationPct: number | null;
    top1ConcentrationPct: number | null;
    topHolders: AnsemTopHolderRow[];
    supplyHuman: number | null;
    totalNetWorthUsd: number | null;
  };
  distribution: AnsemDistributionPayload | null;
  holderInsights: HolderInsightsPayload | null;
  holderInsightsError: string | null;
  tokenIntel: AnsemTokenIntelPayload | null;
  kol: TokenKolShillsPayload | null;
  kolError: string | null;
  social: {
    twitter: string | null;
    telegram: string | null;
    website: string | null;
    description: string | null;
  };
  fetchedAt: string;
}

export interface AnsemCommunityResponse {
  data: AnsemCommunityPayload;
  cachedAt: string;
}

export async function fetchAnsemCommunity(
  signal?: AbortSignal,
): Promise<AnsemCommunityResponse> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const res = await fetch(`${base}/free/ansem/community`, {
    signal,
    headers: { Accept: "application/json" },
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: AnsemCommunityPayload;
    cachedAt?: string;
    error?: string;
  };
  if (!res.ok || body.success !== true || !body.data?.mint) {
    throw new Error(body.error || "Community data unavailable");
  }
  return {
    data: body.data,
    cachedAt: body.cachedAt ?? body.data.fetchedAt,
  };
}

export function pickAnsemHolderCount(
  community?: AnsemCommunityPayload | null,
  dedicated?: number | null,
): number | null {
  const candidates = [
    dedicated,
    community?.holders?.count,
    community?.tokenIntel?.holderCount,
  ].filter((c): c is number => c != null && Number.isFinite(c) && c > 0);
  if (!candidates.length) return null;
  return Math.max(...candidates);
}

export interface AnsemHolderCountPayload {
  mint: string;
  count: number | null;
  source: "pumpfun" | "rugcheck" | "gmgn" | "cache" | null;
  stale?: boolean;
}

export async function fetchAnsemHolderCount(
  signal?: AbortSignal,
): Promise<AnsemHolderCountPayload> {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const res = await fetch(`${base}/free/ansem/holder-count`, {
    signal,
    headers: { Accept: "application/json" },
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: AnsemHolderCountPayload;
    error?: string;
  };
  if (!res.ok || body.success !== true || !body.data) {
    throw new Error(body.error || "Holder count unavailable");
  }
  return body.data;
}

export function useAnsemHolderCount() {
  return useQuery({
    queryKey: ["ansem-holder-count", ANSEM_MINT],
    queryFn: ({ signal }) => fetchAnsemHolderCount(signal),
    staleTime: ANSEM_HOLDER_COUNT_REFETCH_MS,
    refetchInterval: ANSEM_HOLDER_COUNT_REFETCH_MS,
    retry: 3,
    placeholderData: (prev) => prev,
    select: (data) => (data.count != null && data.count > 0 ? data.count : null),
  });
}

export function pickAnsemTopKols(community?: AnsemCommunityPayload | null): TokenKolRow[] {
  return community?.kol?.topKols ?? [];
}

export function useAnsemCommunity() {
  return useQuery({
    queryKey: ["ansem-community", ANSEM_MINT, 4],
    queryFn: ({ signal }) => fetchAnsemCommunity(signal),
    staleTime: ANSEM_COMMUNITY_REFETCH_MS,
    refetchInterval: ANSEM_COMMUNITY_REFETCH_MS,
    retry: 1,
  });
}
