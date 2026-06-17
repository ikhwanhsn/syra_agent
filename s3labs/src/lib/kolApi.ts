import { API_BASE } from "../../config/global";

export interface KolApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface KolCampaign {
  id: string;
  projectWallet: string;
  sourceTweetId: string;
  sourceTweetUrl: string;
  sourceTweetText: string;
  title: string;
  description: string;
  rewardLamports: number;
  rewardSol: number;
  kolRewardPoolLamports?: number;
  kolRewardPoolSol?: number;
  platformFeeLamports?: number;
  platformFeeSol?: number;
  kolRewardPercent?: number;
  platformFeePercent?: number;
  platformFeeWallet?: string;
  platformFeeTxSignature?: string | null;
  platformFeeStatus?: "pending" | "confirmed" | "failed" | null;
  depositTxSignature: string | null;
  status: "pending_deposit" | "active" | "completed" | "cancelled";
  startAt: string | null;
  endAt: string | null;
  durationDays: number;
  lastSnapshotAt: string | null;
  finalizedAt: string | null;
  createdAt: string | null;
  poolWalletAddress: string;
  submissionCount?: number;
}

export interface KolSubmission {
  id: string;
  campaignId: string;
  kolWallet: string;
  tweetId: string;
  tweetUrl: string;
  mode: "reply" | "quote";
  authorHandle: string;
  verified: boolean;
  latestMetrics: {
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    quoteCount: number;
    viewCount: number;
  };
  latestScore: number;
  projectedLamports: number;
  projectedSol: number;
  createdAt: string | null;
}

export interface KolPayoutInfo {
  lamports: number;
  sol: number;
  txSignature: string | null;
  status: "pending" | "confirmed" | "failed";
}

export interface KolLeaderboardEntry extends KolSubmission {
  payout: KolPayoutInfo | null;
}

export interface KolConfig {
  poolWalletAddress: string;
  minRewardSol: number;
  maxDurationDays: number;
  kolRewardPercent: number;
  platformFeePercent: number;
  platformFeeWallet: string;
}

export function getKolRewardSol(campaign: Pick<KolCampaign, "kolRewardPoolSol" | "rewardSol">): number {
  return campaign.kolRewardPoolSol ?? campaign.rewardSol * 0.8;
}

export const DEFAULT_KOL_CONFIG: KolConfig = {
  poolWalletAddress: "GGj37PSMDUUgkac5HkMx36Sk38zbHDMtXFLn6MR2HXnv",
  minRewardSol: 0.01,
  maxDurationDays: 90,
  kolRewardPercent: 80,
  platformFeePercent: 20,
  platformFeeWallet: "854tpY9AnaMYDpviWeo4eWXzoUmvLrYwkU16F2MtzHz8",
};

async function kolFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await res.json().catch(() => ({}))) as KolApiResponse<T>;
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (body.data === undefined) {
    throw new Error("Empty API response");
  }
  return body.data;
}

export function fetchKolConfig(): Promise<KolConfig> {
  return kolFetch<KolConfig>("/kol/config").catch(() => DEFAULT_KOL_CONFIG);
}

export function fetchCampaigns(status?: string): Promise<{ campaigns: KolCampaign[] }> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return kolFetch<{ campaigns: KolCampaign[] }>(`/kol/campaigns${qs}`);
}

export function fetchCampaignDetail(id: string): Promise<{
  campaign: KolCampaign;
  leaderboard: KolLeaderboardEntry[];
}> {
  return kolFetch(`/kol/campaigns/${encodeURIComponent(id)}`);
}

export function createCampaign(input: {
  projectWallet: string;
  sourceTweetUrl: string;
  title: string;
  description?: string;
  rewardSol: number;
  durationDays: number;
}): Promise<{
  campaign: KolCampaign;
  deposit: {
    poolWalletAddress: string;
    rewardLamports: number;
    rewardSol: number;
    kolRewardPoolLamports: number;
    kolRewardPoolSol: number;
    platformFeeLamports: number;
    platformFeeSol: number;
    kolRewardPercent: number;
    platformFeePercent: number;
    platformFeeWallet: string;
  };
}> {
  return kolFetch("/kol/campaigns", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function confirmCampaignDeposit(
  campaignId: string,
  input: { txSignature: string; projectWallet: string },
): Promise<{ campaign: KolCampaign }> {
  return kolFetch(`/kol/campaigns/${encodeURIComponent(campaignId)}/confirm-deposit`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function submitEngagement(
  campaignId: string,
  input: { kolWallet: string; tweetUrl: string },
): Promise<{ submission: KolSubmission }> {
  return kolFetch(`/kol/campaigns/${encodeURIComponent(campaignId)}/submissions`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchWalletEarnings(wallet: string): Promise<{
  wallet: string;
  active: Array<{ submission: KolSubmission; campaign: KolCampaign; payout: KolPayoutInfo | null }>;
  paid: Array<{ submission: KolSubmission; campaign: KolCampaign; payout: KolPayoutInfo | null }>;
  totals: {
    projectedLamports: number;
    projectedSol: number;
    paidLamports: number;
    paidSol: number;
  };
}> {
  return kolFetch(`/kol/wallets/${encodeURIComponent(wallet)}/earnings`);
}
