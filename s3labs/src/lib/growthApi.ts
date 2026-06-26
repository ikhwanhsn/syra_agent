import { API_BASE } from "../../config/global";

export interface DailyCount {
  date: string;
  count: number;
}

export interface StatusCounts {
  all: number;
  [key: string]: number;
}

export interface ScoutRunMeta {
  savedAt: string | null;
  ranAt: string | null;
  totalNew: number | null;
  totalUpdated: number | null;
}

export interface KolEngagement {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  total: number;
}

export interface KolMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  pendingDepositCampaigns: number;
  cancelledCampaigns: number;
  uniqueKols: number;
  uniqueProjects: number;
  totalSubmissions: number;
  totalRewardLamports: number;
  totalRewardSol: number;
  totalKolPoolLamports: number;
  totalKolPoolSol: number;
  totalPaidLamports: number;
  totalPaidSol: number;
  platformFeesSol: number;
  confirmedPlatformFeesSol: number;
  payoutSuccessRate: number | null;
  payoutByStatus: StatusCounts;
  engagement: KolEngagement;
  campaignsPerDay: DailyCount[];
}

export interface JobsMetrics {
  totalAllTime: number;
  totalFresh: number;
  remoteCount: number;
  remotePercent: number;
  postedToTelegram: number;
  byCategory: StatusCounts;
  bySource: StatusCounts;
  newPerDay: DailyCount[];
}

export interface EventsMetrics {
  totalAllTime: number;
  totalUpcoming: number;
  indonesiaUpcoming: number;
  globalUpcoming: number;
  byStatus: StatusCounts;
  bySource: StatusCounts;
  byCategory: StatusCounts;
  discoveriesPerDay: DailyCount[];
}

export interface HackathonsMetrics {
  totalAllTime: number;
  totalFresh: number;
  indonesiaFresh: number;
  byStatus: StatusCounts;
  byOpenState: StatusCounts;
  bySource: StatusCounts;
  totalPrizeUsd: number;
  avgPrizeUsd: number;
  totalRegistrations: number;
  discoveriesPerDay: DailyCount[];
}

export interface WalletsMetrics {
  connectedWallets: number;
  stakerCount: number;
  totalStakedRaw: string;
}

export interface RunsMetrics {
  events: ScoutRunMeta;
  hackathons: ScoutRunMeta;
  jobs: ScoutRunMeta;
}

export interface FunnelStage {
  acquisition: {
    connectedWallets: number;
    discoveryReach: number;
    uniqueKols: number;
    uniqueProjects: number;
  };
  activation: {
    totalCampaigns: number;
    activeCampaigns: number;
    pendingDepositCampaigns: number;
    eventsInterested: number;
    hackathonsJoined: number;
  };
  engagement: {
    totalSubmissions: number;
    engagementTotal: number;
    eventsAttended: number;
    hackathonsSubmitted: number;
    stakerCount: number;
  };
  monetization: {
    totalFundedSol: number;
    totalPaidSol: number;
    platformFeesSol: number;
    confirmedPlatformFeesSol: number;
  };
}

export interface GrowthMetrics {
  generatedAt: string;
  trendDays: number;
  kol: KolMetrics;
  jobs: JobsMetrics;
  events: EventsMetrics;
  hackathons: HackathonsMetrics;
  wallets: WalletsMetrics;
  runs: RunsMetrics;
  funnel: FunnelStage;
}

interface GrowthMetricsResponse {
  success: boolean;
  data?: GrowthMetrics;
  error?: string;
  message?: string;
}

async function adminFetch<T>(
  wallet: string | null | undefined,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (wallet) {
    headers["X-Admin-Wallet"] = wallet;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  const body = (await res.json()) as GrowthMetricsResponse;
  if (!res.ok || !body.success) {
    const msg = body.message || body.error || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  if (!body.data) {
    throw new Error("Missing growth metrics data");
  }
  return body.data as T;
}

export function fetchGrowthMetrics(wallet: string): Promise<GrowthMetrics> {
  return adminFetch<GrowthMetrics>(wallet, "/internal/growth-metrics");
}
