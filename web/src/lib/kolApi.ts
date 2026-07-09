import { getApiBaseUrl } from "@/lib/env";

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
  sourceAuthorHandle?: string | null;
  sourceAuthorVerified?: boolean;
  title: string;
  description: string;
  rewardLamports: number;
  rewardSol: number;
  kolRewardPoolSol?: number;
  status: "pending_deposit" | "active" | "completed" | "cancelled";
  startAt: string | null;
  endAt: string | null;
  durationDays: number;
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
  latestScore: number;
  projectedSol: number;
  createdAt: string | null;
}

export interface KolPayoutInfo {
  lamports: number;
  sol: number;
  txSignature: string | null;
  status: "pending" | "confirmed" | "failed";
}

export interface KolMarketplaceStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  uniqueKols: number;
  totalRewardSol: number;
  totalPaidSol: number;
}

export interface KolConfig {
  poolWalletAddress: string;
  minRewardSol: number;
  platformFeeSol: number;
}

export const S3LABS_KOL_URL = "https://s3labs.xyz/kol";

export const DEFAULT_KOL_CONFIG: KolConfig = {
  poolWalletAddress: "GGj37PSMDUUgkac5HkMx36Sk38zbHDMtXFLn6MR2HXnv",
  minRewardSol: 0.015,
  platformFeeSol: 0.005,
};

export function getKolRewardSol(campaign: Pick<KolCampaign, "kolRewardPoolSol" | "rewardSol">): number {
  return campaign.kolRewardPoolSol ?? Math.max(0, campaign.rewardSol - DEFAULT_KOL_CONFIG.platformFeeSol);
}

const base = () => getApiBaseUrl().replace(/\/$/, "");

async function kolFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
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

export function fetchKolStats(): Promise<KolMarketplaceStats> {
  return kolFetch<KolMarketplaceStats>("/kol/stats");
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
