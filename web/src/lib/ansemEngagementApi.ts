import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiBaseUrl } from "@/lib/chatApi";
import { ANSEM_MINT } from "@/lib/ansem";
import { syraFetch } from "@/lib/agentAuthApi";

export interface AnsemEngagementBreakdown {
  mentions: { score: number; max: number; count: number };
  engagement: { score: number; max: number; avgEngagementRatePct: number };
  reach: { score: number; max: number; followersCount: number };
}

export interface AnsemEngagementTweetSample {
  id: string;
  text: string;
  likes: number;
  retweets: number;
  replies: number;
  createdAt: string | null;
  url: string | null;
}

export interface AnsemEngagementRecord {
  anonymousId: string;
  source?: "wallet" | "discovered";
  walletAddress: string;
  walletShort: string;
  xUsername: string;
  displayName: string;
  profileImageUrl: string | null;
  followersCount: number;
  engagementScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  ansemMentionCount: number;
  ansemEngagementTotal: number;
  avgEngagementRatePct: number;
  breakdown: AnsemEngagementBreakdown | null;
  topTweets: AnsemEngagementTweetSample[];
  checkedAt: string;
  dayUtc: string;
  profileUrl?: string;
}

export interface AnsemEngagementQuota {
  limit: number;
  used: number;
  remaining: number;
  dayUtc?: string;
}

export interface AnsemEngagementStatus {
  quota: AnsemEngagementQuota;
  record: AnsemEngagementRecord | null;
  twitterApiConfigured: boolean;
}

export interface AnsemEngagementLeaderboardEntry extends AnsemEngagementRecord {
  rank: number;
  profileUrl: string;
}

const LEADERBOARD_REFETCH_MS = 60_000;

function apiBase(): string {
  return getApiBaseUrl().replace(/\/$/, "");
}

export async function fetchAnsemEngagementLeaderboard(
  signal?: AbortSignal,
): Promise<{ entries: AnsemEngagementLeaderboardEntry[]; updatedAt: string }> {
  const res = await fetch(`${apiBase()}/free/ansem/engagement/leaderboard?limit=50`, {
    signal,
    headers: { Accept: "application/json" },
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: { entries?: AnsemEngagementLeaderboardEntry[]; updatedAt?: string };
    error?: string;
  };
  if (!res.ok || body.success !== true || !body.data) {
    throw new Error(body.error || "Leaderboard unavailable");
  }
  return {
    entries: body.data.entries ?? [],
    updatedAt: body.data.updatedAt ?? new Date().toISOString(),
  };
}

export async function fetchAnsemEngagementStatus(): Promise<AnsemEngagementStatus> {
  const res = await syraFetch(`${apiBase()}/agent/ansem/engagement/status`);
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: AnsemEngagementStatus;
    error?: string;
  };
  if (res.status === 401) {
    throw new Error("wallet_sign_in_required");
  }
  if (!res.ok || body.success !== true || !body.data) {
    throw new Error(body.error || "Status unavailable");
  }
  return body.data;
}

export async function checkAnsemEngagement(xHandle: string): Promise<{
  data: AnsemEngagementRecord;
  quota: AnsemEngagementQuota;
}> {
  const res = await syraFetch(`${apiBase()}/agent/ansem/engagement/check`, {
    method: "POST",
    body: JSON.stringify({ xHandle }),
  });
  const body = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    data?: AnsemEngagementRecord;
    quota?: AnsemEngagementQuota;
    error?: string;
    message?: string;
  };
  if (res.status === 401) {
    throw new Error("wallet_sign_in_required");
  }
  if (res.status === 429) {
    throw new Error(body.message || "daily_limit_reached");
  }
  if (!res.ok || body.success !== true || !body.data) {
    const detail =
      typeof (body as { detail?: string }).detail === "string"
        ? (body as { detail?: string }).detail
        : undefined;
    throw new Error(body.message || detail || body.error || "Engagement check failed");
  }
  return { data: body.data, quota: body.quota ?? { limit: 1, used: 1, remaining: 0 } };
}

export function useAnsemEngagementLeaderboard() {
  return useQuery({
    queryKey: ["ansem-engagement-leaderboard", ANSEM_MINT],
    queryFn: ({ signal }) => fetchAnsemEngagementLeaderboard(signal),
    staleTime: LEADERBOARD_REFETCH_MS,
    refetchInterval: LEADERBOARD_REFETCH_MS,
  });
}

export function useAnsemEngagementStatus(enabled: boolean) {
  return useQuery({
    queryKey: ["ansem-engagement-status"],
    queryFn: () => fetchAnsemEngagementStatus(),
    enabled,
    staleTime: 30_000,
    retry: (count, err) => {
      if (err instanceof Error && err.message === "wallet_sign_in_required") return false;
      return count < 1;
    },
  });
}

export function useAnsemEngagementCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (xHandle: string) => checkAnsemEngagement(xHandle),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ansem-engagement-status"] });
      void queryClient.invalidateQueries({ queryKey: ["ansem-engagement-leaderboard", ANSEM_MINT] });
    },
  });
}
