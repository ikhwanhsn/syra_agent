import { API_BASE } from "../../config/global";

export interface KolApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface KolTweetMedia {
  mediaType: string;
  url: string;
  previewUrl?: string | null;
}

export interface KolCampaign {
  id: string;
  projectWallet: string;
  sourceTweetId: string;
  sourceTweetUrl: string;
  sourceTweetText: string;
  sourceTweetMedia?: KolTweetMedia[];
  sourceAuthorHandle?: string | null;
  sourceAuthorName?: string | null;
  sourceAuthorFollowers?: number | null;
  sourceAuthorVerified?: boolean;
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
  authorHandleKey?: string;
  verified: boolean;
  latestMetrics: {
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    quoteCount: number;
    viewCount: number;
  };
  latestScore: number;
  finalScore?: number | null;
  reputationCreditedAt?: string | null;
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

export interface KolEngagementTotals {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  total: number;
}

export interface KolMarketplaceStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  pendingDepositCampaigns: number;
  uniqueKols: number;
  uniqueProjects: number;
  totalSubmissions: number;
  totalRewardLamports: number;
  totalRewardSol: number;
  totalKolPoolLamports: number;
  totalKolPoolSol: number;
  totalPaidLamports: number;
  totalPaidSol: number;
  engagement: KolEngagementTotals;
}

export interface KolProjectSummary {
  handle: string;
  name: string;
  followers: number | null;
  verified: boolean;
  profilePicture?: string | null;
  campaignCount: number;
  activeCampaignCount: number;
  completedCampaignCount: number;
  totalFundedLamports: number;
  totalFundedSol: number;
  totalKolPoolLamports: number;
  totalKolPoolSol: number;
  kolsReached: number;
  lastActivityAt: string | null;
}

export interface KolSummary {
  handle: string;
  name?: string;
  verified?: boolean;
  profilePicture?: string | null;
  campaignCount: number;
  submissionCount: number;
  reputationScore: number;
  activeScore: number;
  totalScore: number;
  campaignsCompleted: number;
  engagement: KolEngagementTotals;
  projectedLamports: number;
  projectedSol: number;
  earnedLamports: number;
  earnedSol: number;
  lastActivityAt: string | null;
}

export type KolProfileRole = "project" | "kol";

export interface KolProfile {
  handle: string;
  name: string;
  followers: number | null;
  verified: boolean;
  description: string | null;
  profilePicture: string | null;
  xProfileRefreshedAt?: string | null;
  roles: KolProfileRole[];
  asProject: {
    campaignCount: number;
    activeCampaignCount: number;
    completedCampaignCount: number;
    totalFundedLamports: number;
    totalFundedSol: number;
    totalKolPoolLamports: number;
    totalKolPoolSol: number;
    campaigns: KolCampaign[];
  };
  asKol: {
    campaignCount: number;
    submissionCount: number;
    reputationScore: number;
    activeScore: number;
    totalScore: number;
    campaignsCompleted: number;
    engagement: KolEngagementTotals;
    earnedLamports: number;
    earnedSol: number;
    projectedLamports: number;
    projectedSol: number;
    engagements: Array<{
      submission: KolSubmission;
      campaign: KolCampaign | null;
      payout: KolPayoutInfo | null;
    }>;
  };
}

export type ProjectSortKey = "funded" | "campaigns" | "kols" | "recent";
export type KolSortKey = "earned" | "score" | "engagement" | "campaigns" | "recent";

export interface KolConfig {
  poolWalletAddress: string;
  minRewardSol: number;
  minKolRewardSol?: number;
  minDurationDays?: number;
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
  minRewardSol: 0.125,
  minKolRewardSol: 0.1,
  minDurationDays: 1,
  maxDurationDays: 30,
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

export function fetchKolStats(): Promise<KolMarketplaceStats> {
  return kolFetch<KolMarketplaceStats>("/kol/stats");
}

export function fetchProjects(opts?: {
  limit?: number;
  sort?: ProjectSortKey;
}): Promise<{ projects: KolProjectSummary[] }> {
  const params = new URLSearchParams();
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  if (opts?.sort) params.set("sort", opts.sort);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return kolFetch<{ projects: KolProjectSummary[] }>(`/kol/projects${qs}`);
}

export function fetchKols(opts?: {
  limit?: number;
  sort?: KolSortKey;
}): Promise<{ kols: KolSummary[] }> {
  const params = new URLSearchParams();
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  if (opts?.sort) params.set("sort", opts.sort);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return kolFetch<{ kols: KolSummary[] }>(`/kol/kols${qs}`);
}

export function fetchKolProfile(username: string): Promise<KolProfile> {
  const clean = username.trim().replace(/^@/, "");
  return kolFetch<KolProfile>(`/kol/profiles/${encodeURIComponent(clean)}`);
}
