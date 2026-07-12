import type { KolCampaign } from "@/lib/kolApi";
import { getKolRewardSol } from "@/lib/kolApi";

export const KOL_CAMPAIGN_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "reward_high", label: "Highest reward" },
  { value: "reward_low", label: "Lowest reward" },
  { value: "ending_soon", label: "Ending soon" },
  { value: "most_time", label: "Most time left" },
  { value: "most_kols", label: "Most KOLs" },
] as const;

export type KolCampaignSort = (typeof KOL_CAMPAIGN_SORT_OPTIONS)[number]["value"];

export const DEFAULT_KOL_CAMPAIGN_SORT: KolCampaignSort = "newest";

export function parseKolCampaignSort(value: string | null | undefined): KolCampaignSort {
  if (
    value &&
    KOL_CAMPAIGN_SORT_OPTIONS.some((option) => option.value === value)
  ) {
    return value as KolCampaignSort;
  }
  return DEFAULT_KOL_CAMPAIGN_SORT;
}

function createdAtMs(campaign: KolCampaign): number {
  if (!campaign.createdAt) return 0;
  const t = new Date(campaign.createdAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

function endAtMs(campaign: KolCampaign): number {
  if (!campaign.endAt) return Number.POSITIVE_INFINITY;
  const t = new Date(campaign.endAt).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

function participants(campaign: KolCampaign): number {
  return campaign.submissionCount ?? 0;
}

/**
 * Stable sort of campaigns for the KOL browse grid.
 */
export function sortKolCampaigns(
  campaigns: KolCampaign[],
  sort: KolCampaignSort,
): KolCampaign[] {
  const list = [...campaigns];

  list.sort((a, b) => {
    switch (sort) {
      case "reward_high": {
        const diff = getKolRewardSol(b) - getKolRewardSol(a);
        return diff !== 0 ? diff : createdAtMs(b) - createdAtMs(a);
      }
      case "reward_low": {
        const diff = getKolRewardSol(a) - getKolRewardSol(b);
        return diff !== 0 ? diff : createdAtMs(b) - createdAtMs(a);
      }
      case "ending_soon": {
        const diff = endAtMs(a) - endAtMs(b);
        return diff !== 0 ? diff : createdAtMs(b) - createdAtMs(a);
      }
      case "most_time": {
        const diff = endAtMs(b) - endAtMs(a);
        return diff !== 0 ? diff : createdAtMs(b) - createdAtMs(a);
      }
      case "most_kols": {
        const diff = participants(b) - participants(a);
        return diff !== 0 ? diff : createdAtMs(b) - createdAtMs(a);
      }
      case "newest":
      default:
        return createdAtMs(b) - createdAtMs(a);
    }
  });

  return list;
}
