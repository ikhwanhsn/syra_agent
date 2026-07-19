import { API_BASE } from "../../config/global";

export interface KolApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export class KolApiError extends Error {
  readonly code: string;

  constructor(message: string, code = "unknown") {
    super(message);
    this.name = "KolApiError";
    this.code = code;
  }
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
  platformFeeWallet?: string;
  platformFeeTxSignature?: string | null;
  platformFeeStatus?: "pending" | "confirmed" | "failed" | null;
  depositTxSignature: string | null;
  status: "pending_deposit" | "active" | "completed" | "cancelled";
  startAt: string | null;
  endAt: string | null;
  durationDays: number;
  /** When true, KOLs must have funded a campaign to earn rewards. */
  requireCreatedOneCampaign?: boolean;
  allowedHandleKeys?: string[];
  payoutTopN?: number | null;
  payoutTopNShareBps?: number;
  creatorRefundLamports?: number | null;
  creatorRefundSol?: number | null;
  creatorRefundTxSignature?: string | null;
  creatorRefundStatus?: "pending" | "confirmed" | "failed" | "skipped" | null;
  lastSnapshotAt: string | null;
  finalizedAt: string | null;
  createdAt: string | null;
  poolWalletAddress: string;
  submissionCount?: number;
  /** True when the viewer (wallet or verified X) already has a submission. */
  participated?: boolean;
}

export interface KolContribution {
  tweetId: string;
  tweetUrl: string;
  mode: "reply" | "quote";
  metrics: {
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    quoteCount: number;
    viewCount: number;
  };
  score: number;
  scoreBreakdown?: KolScoreBreakdown | null;
}

export interface KolSubmission {
  id: string;
  campaignId: string;
  kolWallet: string | null;
  tweetId: string;
  tweetUrl: string;
  mode: "reply" | "quote";
  authorHandle: string;
  authorHandleKey?: string;
  authorFollowers?: number | null;
  authorVerified?: boolean;
  verified: boolean;
  /** Top-N posts counted toward latestScore (combined). */
  contributions?: KolContribution[];
  /** Number of posts included in the combined score. */
  postCount?: number;
  latestMetrics: {
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    quoteCount: number;
    viewCount: number;
  };
  /** Combined score = sum of top-N contribution scores. */
  latestScore: number;
  scoreBreakdown?: KolScoreBreakdown | null;
  finalScore?: number | null;
  reputationCreditedAt?: string | null;
  projectedLamports: number;
  projectedSol: number;
  earnedLamports?: number;
  earnedSol?: number;
  claimStatus?: "unearned" | "claimable" | "claimed";
  discoveredAt?: string | null;
  createdAt: string | null;
}

export interface KolPayoutInfo {
  lamports: number;
  sol: number;
  txSignature: string | null;
  status: "pending" | "pending_minimum" | "confirmed" | "failed";
}

export interface KolLeaderboardEntry extends KolSubmission {
  payout: KolPayoutInfo | null;
  /** null when campaign does not require creating a campaign first. */
  rewardEligible?: boolean | null;
  /** Score-based payout before campaign-creation eligibility gate. */
  potentialProjectedSol?: number | null;
}

export interface KolEngagementTotals {
  likes: number;
  retweets: number;
  replies: number;
  quotes: number;
  views: number;
  total: number;
}

export interface KolMetricBreakdown {
  raw: number;
  afterImpossibility: number;
  afterFollowerCap: number;
  afterDiminishing: number;
  weighted: number;
  weight: number;
}

export interface KolScoreBreakdown {
  version: number;
  metrics: {
    like?: KolMetricBreakdown;
    reply?: KolMetricBreakdown;
    retweet?: KolMetricBreakdown;
    quote?: KolMetricBreakdown;
    view?: KolMetricBreakdown;
  };
  baseScore: number;
  credibilityMultiplier: number;
  integrityFactor: number;
  integrityFlags: string[];
  finalScore: number;
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

export interface WalletPointsEntry {
  id: string;
  campaignId: string;
  campaignTitle: string | null;
  campaignStatus: KolCampaign["status"] | null;
  entryType: "kol_participation" | "campaign_creation";
  submissionId: string | null;
  handle: string | null;
  rank: number | null;
  participationPoints: number;
  earlyPoints: number;
  creationPoints: number;
  totalPoints: number;
  awardedAt: string | null;
}

export interface WalletPoints {
  wallet: string;
  walletKey: string;
  totalPoints: number;
  participationPoints: number;
  earlyPoints: number;
  creationPoints: number;
  dailyClaimPoints?: number;
  referralPoints?: number;
  missionPoints?: number;
  campaignsParticipated: number;
  campaignsCreated: number;
  lastHandle: string | null;
  lastAwardedAt: string | null;
  entries: WalletPointsEntry[];
}

export interface S3LabsMission {
  id: string;
  tweetId: string;
  tweetUrl: string;
  text: string;
  authorHandle: string;
  authorName: string | null;
  mediaUrls: string[];
  likeCount: number;
  replyCount: number;
  tweetCreatedAt: string | null;
  status: "active" | "archived";
  pointsReward: number;
  submissionCount: number;
  syncedAt: string | null;
  submitted: boolean;
  pointsAwarded: number;
  replyTweetUrl: string | null;
}

export interface MissionsResponse {
  handle: string;
  pointsReward: number;
  walletVerified: boolean;
  xHandle: string | null;
  completedCount: number;
  totalMissionPoints: number;
  missions: S3LabsMission[];
}

export interface MissionSubmitResult {
  submission: {
    id: string;
    missionId: string;
    missionTweetId: string;
    wallet: string;
    xHandle: string | null;
    replyTweetId: string;
    replyTweetUrl: string;
    pointsAwarded: number;
    submittedAt: string | null;
  };
  totals: {
    totalPoints: number;
    missionPoints: number;
  };
}

export interface MissionSyncResult {
  handle: string;
  fetched: number;
  created: number;
  updated: number;
  syncedAt: string;
}

export interface DailyClaimStatus {
  wallet: string;
  todayUtc: string;
  claimedToday: boolean;
  canClaimToday: boolean;
  config: {
    dailyBase: number;
    weeklyBonus: number;
    monthlyBonus: number;
    weeklyCycleDays: number;
  };
  week: {
    cycleDays: number;
    consecutiveStreak: number;
    daysInCurrentCycle: number;
    daysUntilWeeklyBonus: number;
    weeklyBonusEligible: boolean;
    weeklyBonusEarnedToday: boolean;
  };
  month: {
    calendarLabel: string;
    daysInMonth: number;
    daysClaimed: number;
    daysElapsed: number;
    isMonthEnd: boolean;
    monthlyBonusEligible: boolean;
    monthlyBonusEarnedToday: boolean;
  };
  preview: {
    basePoints: number;
    weeklyBonus: number;
    monthlyBonus: number;
    totalPoints: number;
  };
  lastClaim: {
    id: string;
    claimDate: string;
    basePoints: number;
    weeklyBonus: number;
    monthlyBonus: number;
    totalPoints: number;
    claimedAt: string | null;
  } | null;
  totalDailyClaimPoints: number;
  policy: {
    summary: string;
  };
}

export interface DailyClaimResult {
  wallet: string;
  claim: NonNullable<DailyClaimStatus["lastClaim"]>;
  totals: {
    totalPoints: number;
    dailyClaimPoints: number;
  };
  bonuses: {
    weekly: boolean;
    monthly: boolean;
  };
}

export interface PointsLeaderboardEntry {
  rank: number;
  wallet: string;
  handle: string | null;
  totalPoints: number;
  participationPoints: number;
  earlyPoints: number;
  creationPoints?: number;
  referralPoints?: number;
  dailyClaimPoints?: number;
  missionPoints?: number;
  campaignsParticipated: number;
  campaignsCreated?: number;
  lastAwardedAt: string | null;
}

export type ReferralEventType = "participation" | "podium" | "creation";

export interface ReferralLedgerEntry {
  id: string;
  eventType: ReferralEventType;
  inviteeWallet: string;
  campaignId: string | null;
  points: number;
  awardedAt: string | null;
}

export interface ReferralProfile {
  wallet: string;
  code: string | null;
  sharePath: string | null;
  createdAt: string | null;
  canCreate: boolean;
  inviteeCount: number;
  referralPoints: number;
  totalsByEvent: {
    participation: number;
    podium: number;
    creation: number;
  };
  recent: ReferralLedgerEntry[];
}

export interface ReferralCodeResult {
  code: string;
  wallet: string;
  sharePath: string;
  createdAt: string | null;
}

export interface ReferralClaimResult {
  attributed: boolean;
  alreadyAttributed: boolean;
  code: string;
  referrerWallet: string | null;
}

export type ProjectSortKey = "funded" | "campaigns" | "kols" | "recent";
export type KolSortKey =
  | "earned"
  | "score"
  | "engagement"
  | "campaigns"
  | "recent";

export interface KolConfig {
  poolWalletAddress: string;
  minRewardSol: number;
  minKolRewardSol?: number;
  minTopUpKolRewardSol?: number;
  minPayoutSol?: number;
  minDurationDays?: number;
  maxDurationDays: number;
  platformFeeSol: number;
  platformFeeSolDefault?: number;
  firstCampaignFeeWaived?: boolean;
  creatorScoreBonus?: number;
  discoveryIntervalHours?: number;
  platformFeeWallet: string;
}

export interface KolWalletCampaign extends KolCampaign {
  participants: number;
  engagedParticipants: number;
  projectedLamports: number;
  projectedSol: number;
  earnedLamports: number;
  earnedSol: number;
  paidLamports: number;
  paidSol: number;
}

export interface KolViewerClaimEligibility {
  requireCreatedOneCampaign: boolean;
  hasCreatedCampaign: boolean;
  canClaim: boolean;
  message: string | null;
}

export interface KolWalletClaimEligibility {
  hasCreatedCampaign: boolean;
}

export interface KolWalletVerification {
  verified: boolean;
  wallet: string;
  xHandle: string | null;
  xHandleKey?: string | null;
  verifiedAt?: string | null;
}

export interface KolWalletEarnings {
  wallet: string;
  xVerification?: KolWalletVerification;
  claimEligibility?: KolWalletClaimEligibility;
  active: Array<{
    submission: KolSubmission;
    campaign: KolCampaign;
    payout: KolPayoutInfo | null;
  }>;
  claimable: Array<{
    submission: KolSubmission;
    campaign: KolCampaign;
    payout: KolPayoutInfo | null;
  }>;
  paid: Array<{
    submission: KolSubmission;
    campaign: KolCampaign;
    payout: KolPayoutInfo | null;
  }>;
  pendingMinimum: Array<{
    submission: KolSubmission;
    campaign: KolCampaign;
    payout: KolPayoutInfo | null;
  }>;
  totals: {
    projectedLamports: number;
    projectedSol: number;
    claimableLamports: number;
    claimableSol: number;
    paidLamports: number;
    paidSol: number;
    pendingMinimumLamports: number;
    pendingMinimumSol: number;
    pendingBalanceLamports: number;
    pendingBalanceSol: number;
    minPayoutSol: number;
    minPayoutLamports: number;
  };
  payoutPolicy: {
    minPayoutSol: number;
    summary: string;
  };
}

export interface KolCampaignTopUp {
  id: string;
  campaignId: string;
  projectWallet: string;
  kolRewardLamports: number;
  kolRewardSol: number;
  totalDepositLamports: number;
  totalDepositSol: number;
  platformFeeLamports: number;
  platformFeeSol: number;
  depositTxSignature: string | null;
  platformFeeTxSignature: string | null;
  platformFeeStatus: "pending" | "confirmed" | "failed" | null;
  status: "pending_deposit" | "confirmed" | "failed" | "cancelled";
  createdAt: string | null;
  confirmedAt: string | null;
}

export function getKolRewardSol(
  campaign: Pick<KolCampaign, "kolRewardPoolSol" | "rewardSol">,
): number {
  return (
    campaign.kolRewardPoolSol ??
    Math.max(0, campaign.rewardSol - DEFAULT_KOL_CONFIG.platformFeeSol)
  );
}

/** Best URL to display for a tweet media item (photo preview or direct URL). */
export function getTweetMediaDisplayUrl(item: KolTweetMedia): string {
  return item.previewUrl || item.url;
}

/** First photo/image from a campaign source tweet, if any. */
export function getCampaignTweetPreviewMedia(
  media?: KolTweetMedia[],
): KolTweetMedia | null {
  if (!media?.length) return null;
  const photo = media.find(
    (item) =>
      item.url &&
      (item.mediaType === "photo" ||
        item.mediaType === "image" ||
        !isVideoMediaType(item.mediaType)),
  );
  return photo ?? media.find((item) => item.url) ?? null;
}

function isVideoMediaType(mediaType: string): boolean {
  const type = mediaType.toLowerCase();
  return type === "video" || type === "gif" || type === "animated_gif";
}

export const DEFAULT_KOL_CONFIG: KolConfig = {
  poolWalletAddress: "GGj37PSMDUUgkac5HkMx36Sk38zbHDMtXFLn6MR2HXnv",
  minRewardSol: 0.015,
  minKolRewardSol: 0.01,
  minTopUpKolRewardSol: 0.01,
  minPayoutSol: 0.01,
  minDurationDays: 1,
  maxDurationDays: 30,
  platformFeeSol: 0.005,
  platformFeeSolDefault: 0.005,
  firstCampaignFeeWaived: false,
  creatorScoreBonus: 1.15,
  discoveryIntervalHours: 6,
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
    throw new KolApiError(
      body.error || `Request failed (${res.status})`,
      body.code ?? "unknown",
    );
  }
  if (body.data === undefined) {
    throw new Error("Empty API response");
  }
  return body.data;
}

export function fetchKolConfig(opts?: { wallet?: string }): Promise<KolConfig> {
  const params = new URLSearchParams();
  if (opts?.wallet) params.set("wallet", opts.wallet);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return kolFetch<KolConfig>(`/kol/config${qs}`).catch(() => DEFAULT_KOL_CONFIG);
}

export function fetchWalletCampaigns(
  wallet: string,
): Promise<{ wallet: string; firstCampaignFeeWaived: boolean; campaigns: KolWalletCampaign[] }> {
  return kolFetch(`/kol/wallets/${encodeURIComponent(wallet)}/campaigns`);
}

export function fetchCampaigns(opts?: {
  status?: string;
  wallet?: string;
}): Promise<{ campaigns: KolCampaign[] }> {
  const params = new URLSearchParams();
  if (opts?.status) params.set("status", opts.status);
  if (opts?.wallet) params.set("wallet", opts.wallet);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return kolFetch<{ campaigns: KolCampaign[] }>(`/kol/campaigns${qs}`);
}

export function fetchCampaignDetail(
  id: string,
  opts?: { wallet?: string },
): Promise<{
  campaign: KolCampaign;
  leaderboard: KolLeaderboardEntry[];
  viewerClaimEligibility?: KolViewerClaimEligibility | null;
}> {
  const params = new URLSearchParams();
  if (opts?.wallet) params.set("wallet", opts.wallet);
  const qs = params.toString() ? `?${params.toString()}` : "";
  return kolFetch(`/kol/campaigns/${encodeURIComponent(id)}${qs}`);
}

export function submitCampaignPost(
  campaignId: string,
  input: {
    kolWallet: string;
    tweetUrl: string;
    mode?: "reply" | "quote";
  },
): Promise<{ submission: KolSubmission }> {
  return kolFetch(`/kol/campaigns/${encodeURIComponent(campaignId)}/submit`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createCampaign(input: {
  projectWallet: string;
  sourceTweetUrl: string;
  title: string;
  description?: string;
  rewardSol: number;
  durationDays: number;
  requireCreatedOneCampaign?: boolean;
  allowedHandles?: string[];
  payoutTopN?: number | null;
  payoutTopNShareBps?: number | null;
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
    platformFeeWallet: string;
    firstCampaignFeeWaived?: boolean;
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
  return kolFetch(
    `/kol/campaigns/${encodeURIComponent(campaignId)}/confirm-deposit`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function cancelPendingCampaign(
  campaignId: string,
  input: { projectWallet: string },
): Promise<{ deleted: boolean; campaignId: string; campaign: KolCampaign }> {
  return kolFetch(`/kol/campaigns/${encodeURIComponent(campaignId)}/cancel`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function createCampaignTopUp(
  campaignId: string,
  input: { projectWallet: string; kolRewardSol: number },
): Promise<{
  topUp: KolCampaignTopUp;
  deposit: {
    poolWalletAddress: string;
    rewardLamports: number;
    rewardSol: number;
    kolRewardPoolLamports: number;
    kolRewardPoolSol: number;
    platformFeeLamports: number;
    platformFeeSol: number;
    platformFeeWallet: string;
  };
}> {
  return kolFetch(`/kol/campaigns/${encodeURIComponent(campaignId)}/top-ups`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function confirmCampaignTopUp(
  campaignId: string,
  topUpId: string,
  input: { txSignature: string; projectWallet: string },
): Promise<{ topUp: KolCampaignTopUp; campaign: KolCampaign }> {
  return kolFetch(
    `/kol/campaigns/${encodeURIComponent(campaignId)}/top-ups/${encodeURIComponent(topUpId)}/confirm-deposit`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export function requestXVerification(input: {
  wallet: string;
  xHandle: string;
}): Promise<{
  xHandle: string;
  xHandleKey: string;
  wallet: string;
  code?: string;
  status: "pending" | "verified";
  alreadyVerified?: boolean;
  verifiedAt?: string | null;
  message?: string;
  expiresAt: string | null;
  instructions?: string;
}> {
  return kolFetch("/kol/verify/request", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function confirmXVerification(input: {
  wallet: string;
  xHandle: string;
}): Promise<{
  verified: boolean;
  xHandle: string;
  xHandleKey: string;
  wallet: string;
  verifiedAt: string | null;
  alreadyVerified?: boolean;
  message?: string;
  verifiedVia?: string;
  autoDistributed?: {
    distributed: Array<{
      campaignId?: string;
      submissionId?: string;
      status: string;
      txSignature?: string;
      lamports?: number;
      sentLamports?: number;
      reason?: string;
      error?: string;
    }>;
    skipped?: boolean;
    reason?: string;
  };
}> {
  return kolFetch("/kol/verify/confirm", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchWalletVerification(
  wallet: string,
): Promise<KolWalletVerification> {
  return kolFetch<KolWalletVerification>(
    `/kol/wallets/${encodeURIComponent(wallet)}/verification`,
  );
}

export function claimCampaignReward(
  campaignId: string,
  input: { wallet: string },
): Promise<{
  status: "confirmed" | "pending_minimum";
  txSignature?: string;
  lamports: number;
  sentLamports?: number;
  pendingBalanceLamports?: number;
  minPayoutLamports?: number;
  minPayoutSol?: number;
  submission: KolSubmission;
  payout?: KolPayoutInfo;
}> {
  return kolFetch(`/kol/campaigns/${encodeURIComponent(campaignId)}/claim`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchWalletEarnings(
  wallet: string,
): Promise<KolWalletEarnings> {
  return kolFetch<KolWalletEarnings>(
    `/kol/wallets/${encodeURIComponent(wallet)}/earnings`,
  );
}

export function fetchWalletPoints(wallet: string): Promise<WalletPoints> {
  return kolFetch<WalletPoints>(
    `/kol/wallets/${encodeURIComponent(wallet)}/points`,
  );
}

export function fetchDailyClaimStatus(
  wallet: string,
): Promise<DailyClaimStatus> {
  return kolFetch<DailyClaimStatus>(
    `/kol/wallets/${encodeURIComponent(wallet)}/daily-claim`,
  );
}

export function claimDailyPoints(wallet: string): Promise<DailyClaimResult> {
  return kolFetch<DailyClaimResult>(
    `/kol/wallets/${encodeURIComponent(wallet)}/daily-claim`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export function fetchPointsLeaderboard(opts?: {
  limit?: number;
}): Promise<{ leaderboard: PointsLeaderboardEntry[] }> {
  const params = new URLSearchParams();
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return kolFetch<{ leaderboard: PointsLeaderboardEntry[] }>(
    `/kol/points/leaderboard${qs}`,
  );
}

export function fetchMissions(opts?: {
  wallet?: string;
  limit?: number;
}): Promise<MissionsResponse> {
  const params = new URLSearchParams();
  if (opts?.wallet) params.set("wallet", opts.wallet);
  if (opts?.limit != null) params.set("limit", String(opts.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";
  return kolFetch<MissionsResponse>(`/kol/missions${qs}`);
}

export function submitMissionComment(input: {
  missionId: string;
  wallet: string;
  tweetUrl: string;
}): Promise<MissionSubmitResult> {
  return kolFetch<MissionSubmitResult>(
    `/kol/missions/${encodeURIComponent(input.missionId)}/submit`,
    {
      method: "POST",
      body: JSON.stringify({
        wallet: input.wallet,
        tweetUrl: input.tweetUrl,
      }),
    },
  );
}

/**
 * Admin-only: sync latest @s3labs_ X posts into missions.
 * Requires connected admin wallet via X-Admin-Wallet header.
 */
export async function syncMissions(
  wallet: string,
  opts?: { limit?: number },
): Promise<MissionSyncResult> {
  const res = await fetch(`${API_BASE}/kol/missions/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Wallet": wallet,
    },
    body: JSON.stringify({ limit: opts?.limit }),
  });

  const body = (await res.json().catch(() => ({}))) as KolApiResponse<MissionSyncResult>;
  if (!res.ok || !body.success) {
    throw new KolApiError(
      body.error || `Request failed (${res.status})`,
      body.code ?? "unknown",
    );
  }
  if (body.data === undefined) {
    throw new Error("Empty API response");
  }
  return body.data;
}

export function fetchReferralProfile(wallet: string): Promise<ReferralProfile> {
  const params = new URLSearchParams({ wallet });
  return kolFetch<ReferralProfile>(`/kol/referrals/me?${params.toString()}`);
}

export function createReferralCode(input: {
  wallet: string;
  code: string;
}): Promise<ReferralCodeResult> {
  return kolFetch<ReferralCodeResult>("/kol/referrals/code", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function claimReferralAttribution(input: {
  wallet: string;
  code: string;
}): Promise<ReferralClaimResult> {
  return kolFetch<ReferralClaimResult>("/kol/referrals/claim", {
    method: "POST",
    body: JSON.stringify(input),
  });
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

export type KolHandleEarningsAmountKind =
  | "paid"
  | "held"
  | "claimable"
  | "projected"
  | "none";

export interface KolHandleEarnings {
  handle: string;
  name: string;
  verified: boolean;
  profilePicture: string | null;
  followers: number | null;
  totals: {
    paidLamports: number;
    paidSol: number;
    heldLamports: number;
    heldSol: number;
    claimableLamports: number;
    claimableSol: number;
    projectedLamports: number;
    projectedSol: number;
    totalEarnedLamports: number;
    totalEarnedSol: number;
  };
  campaignCount: number;
  submissionCount: number;
  campaignsCompleted: number;
  reputationScore: number;
  rows: Array<{
    submission: KolSubmission;
    campaign: KolCampaign | null;
    payout: KolPayoutInfo | null;
    amountLamports: number;
    amountSol: number;
    amountKind: KolHandleEarningsAmountKind;
  }>;
}

/** Public X-handle earnings lookup — no wallet required. */
export function fetchEarningsByXHandle(
  username: string,
): Promise<KolHandleEarnings> {
  const clean = username.trim().replace(/^@/, "");
  return kolFetch<KolHandleEarnings>(
    `/kol/earnings-by-x/${encodeURIComponent(clean)}`,
  );
}

export interface SubscribeEmailResult {
  subscribed: boolean;
  email: string;
  isNew: boolean;
  welcomeEmailSent: boolean;
  emailConfigured: boolean;
}

/** Subscribe to KOL campaign email alerts. */
export function subscribeEmail(
  email: string,
  source = "kol_page",
): Promise<SubscribeEmailResult> {
  return kolFetch<SubscribeEmailResult>("/kol/subscribe", {
    method: "POST",
    body: JSON.stringify({ email, source }),
  });
}

export interface KolAdminSnapshotResult {
  metrics: {
    refreshed?: number;
    failed?: number;
    skipped?: boolean;
    reason?: string;
    totalSubmissions?: number;
    snapshotComplete?: boolean;
    capturedAt?: string | null;
  };
  lastSnapshotAt: string | null;
}

/**
 * Admin-only: force metric refresh for a campaign (batched getTweetsByIds).
 * Requires connected admin wallet via X-Admin-Wallet header.
 */
export async function adminSnapshotCampaign(
  campaignId: string,
  wallet: string,
): Promise<KolAdminSnapshotResult> {
  const res = await fetch(
    `${API_BASE}/kol/campaigns/${encodeURIComponent(campaignId)}/admin/snapshot`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Wallet": wallet,
      },
      body: JSON.stringify({}),
    },
  );

  const body = (await res.json().catch(() => ({}))) as KolApiResponse<KolAdminSnapshotResult>;
  if (!res.ok || !body.success) {
    throw new KolApiError(
      body.error || `Request failed (${res.status})`,
      body.code ?? "unknown",
    );
  }
  if (body.data === undefined) {
    throw new Error("Empty API response");
  }
  return body.data;
}

export interface KolAdminDiscoverHandleResult {
  found: boolean;
  handle?: string;
  sourceTweetId?: string;
  sourceTweetUrl?: string;
  sourceAuthorHandle?: string;
  tweetsScanned?: number;
  targetedQuoteHits?: number;
  targetedReplyHits?: number;
  hydrated?: number;
  matched?: number;
  created?: number;
  updated?: number;
  skipped?: boolean;
  reason?: string;
  posts?: Array<{
    id: string;
    mode: string;
    via?: string;
    inReplyToId: string | null;
    quotedTweetId: string | null;
  }>;
  sample?: Array<{
    id: string;
    text: string;
    inReplyToId: string | null;
    quotedTweetId: string | null;
  }>;
  capturedAt?: string;
}

/**
 * Admin-only: deterministically scan a single handle's tweets for a reply/quote
 * to the campaign source tweet and upsert it. Requires admin wallet header.
 */
export async function adminDiscoverHandle(
  campaignId: string,
  handle: string,
  wallet: string,
): Promise<KolAdminDiscoverHandleResult> {
  const res = await fetch(
    `${API_BASE}/kol/campaigns/${encodeURIComponent(campaignId)}/admin/discover-handle`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Wallet": wallet,
      },
      body: JSON.stringify({ handle }),
    },
  );

  const body = (await res.json().catch(() => ({}))) as KolApiResponse<KolAdminDiscoverHandleResult>;
  if (!res.ok || !body.success) {
    throw new KolApiError(
      body.error || `Request failed (${res.status})`,
      body.code ?? "unknown",
    );
  }
  if (body.data === undefined) {
    throw new Error("Empty API response");
  }
  return body.data;
}

export interface KolAdminTrackTweetResult {
  found: boolean;
  alreadyTracked?: boolean;
  handle?: string;
  mode?: "reply" | "quote" | string;
  sourceTweetId?: string;
  sourceTweetUrl?: string;
  sourceAuthorHandle?: string;
  tweetId?: string;
  tweetUrl?: string;
  inReplyToId?: string | null;
  quotedTweetId?: string | null;
  conversationId?: string | null;
  isQuote?: boolean;
  text?: string;
  score?: number;
  created?: number;
  updated?: number;
  skipped?: boolean;
  reason?: string;
  message?: string;
  capturedAt?: string;
  metrics?: {
    likeCount?: number;
    retweetCount?: number;
    replyCount?: number;
    quoteCount?: number;
    viewCount?: number;
  };
}

/**
 * Admin-only: track one engagement by pasting its X post URL.
 * Fetches that tweet by id and upserts if it replies/quotes the campaign post.
 */
export async function adminTrackTweet(
  campaignId: string,
  tweetUrl: string,
  wallet: string,
): Promise<KolAdminTrackTweetResult> {
  const res = await fetch(
    `${API_BASE}/kol/campaigns/${encodeURIComponent(campaignId)}/admin/track-tweet`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Admin-Wallet": wallet,
      },
      body: JSON.stringify({ tweetUrl }),
    },
  );

  const body = (await res.json().catch(() => ({}))) as KolApiResponse<KolAdminTrackTweetResult>;
  if (!res.ok || !body.success) {
    throw new KolApiError(
      body.error || `Request failed (${res.status})`,
      body.code ?? "unknown",
    );
  }
  if (body.data === undefined) {
    throw new Error("Empty API response");
  }
  return body.data;
}
