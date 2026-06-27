import type { KolProfileShareCardData } from "@/components/profile/KolProfileShareCard";
import { buildKolProfileShareUrl } from "@/components/kol/kolRankShareExport";
import type { KolProfile } from "@/lib/kolApi";
import { formatSol } from "@/lib/kolFormat";

function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function resolveProfileShareHero(data: KolProfileShareCardData): {
  label: string;
  value: string;
} {
  const hasReputation = data.reputationScore != null && data.reputationScore > 0;
  const hasProjectFunded = data.projectFundedSol != null && data.projectFundedSol > 0;

  if (hasReputation) {
    return { label: "Reputation score", value: data.reputationScore!.toFixed(1) };
  }
  if (data.totalPoints > 0) {
    return { label: "S3Labs points", value: formatPoints(data.totalPoints) };
  }
  if (hasProjectFunded) {
    return { label: "Total funded", value: formatSol(data.projectFundedSol!) };
  }
  if (data.campaignsParticipated > 0) {
    return { label: "Campaigns joined", value: String(data.campaignsParticipated) };
  }
  return { label: "Reputation score", value: (data.reputationScore ?? 0).toFixed(1) };
}

export function buildProfileShareFromKolProfile(profile: KolProfile): KolProfileShareCardData {
  const isKol = profile.roles.includes("kol");
  const isProject = profile.roles.includes("project");

  return {
    handle: profile.handle,
    displayName: profile.name,
    verified: profile.verified,
    profilePicture: profile.profilePicture,
    followers: profile.followers,
    reputationScore: isKol ? profile.asKol.totalScore : null,
    totalPoints: 0,
    earnedSol: isKol ? profile.asKol.earnedSol : 0,
    projectedSol: isKol ? profile.asKol.projectedSol : 0,
    campaignsParticipated: isKol
      ? profile.asKol.campaignCount
      : profile.asProject.campaignCount,
    campaignsCompleted: isKol
      ? profile.asKol.campaignsCompleted
      : profile.asProject.completedCampaignCount,
    engagementTotal: isKol ? profile.asKol.engagement.total : undefined,
    shareUrl: buildKolProfileShareUrl(profile.handle),
    projectFundedSol: isProject ? profile.asProject.totalFundedSol : undefined,
  };
}

export interface WalletProfileShareInput {
  handle: string | null;
  displayName: string;
  verified?: boolean;
  profilePicture?: string | null;
  followers?: number | null;
  reputationScore?: number | null;
  totalPoints: number;
  earnedSol: number;
  projectedSol: number;
  campaignsParticipated: number;
  campaignsCompleted?: number;
  engagementTotal?: number;
}

export function buildProfileShareFromWallet(input: WalletProfileShareInput): KolProfileShareCardData | null {
  const cleanHandle = input.handle?.trim().replace(/^@/, "") ?? "";
  if (!cleanHandle && input.totalPoints <= 0 && input.earnedSol <= 0) {
    return null;
  }

  const shareHandle = cleanHandle || "creator";
  const shareUrl = cleanHandle ? buildKolProfileShareUrl(cleanHandle) : "https://s3labs.id/kol";

  return {
    handle: shareHandle,
    displayName: input.displayName.trim() || shareHandle,
    verified: input.verified,
    profilePicture: input.profilePicture,
    followers: input.followers,
    reputationScore: input.reputationScore,
    totalPoints: input.totalPoints,
    earnedSol: input.earnedSol,
    projectedSol: input.projectedSol,
    campaignsParticipated: input.campaignsParticipated,
    campaignsCompleted: input.campaignsCompleted,
    engagementTotal: input.engagementTotal,
    shareUrl,
  };
}
