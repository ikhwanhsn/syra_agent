import { buildKolRankShareUrl } from "@/components/kol/kolRankShareExport";
import type { KolCampaign } from "@/lib/kolApi";
import { getKolRewardSol } from "@/lib/kolApi";
import { formatSol } from "@/lib/kolFormat";

/** X post copy for announcing a campaign is live (admin share tool). */
export function buildAdminCampaignAnnounceText(campaign: KolCampaign): string {
  const rewardSol = getKolRewardSol(campaign);
  const handle = campaign.sourceAuthorHandle
    ? `@${campaign.sourceAuthorHandle.replace(/^@/, "")}`
    : null;
  const url = buildKolRankShareUrl(campaign.id);
  const timeLeft =
    campaign.endAt && new Date(campaign.endAt).getTime() > Date.now()
      ? new Intl.DateTimeFormat("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(new Date(campaign.endAt))
      : null;

  const lines = [
    "New KOL campaign is live on S3 Labs",
    "",
    campaign.title.trim(),
  ];

  if (campaign.description?.trim()) {
    lines.push("", campaign.description.trim());
  }

  lines.push("", `Reward pool: ${formatSol(rewardSol)} SOL`);

  if (campaign.durationDays) {
    lines.push(
      `Duration: ${campaign.durationDays} day${campaign.durationDays === 1 ? "" : "s"}`,
    );
  }

  if (timeLeft) {
    lines.push(`Ends: ${timeLeft}`);
  }

  if (handle) {
    lines.push(`Project: ${handle}`);
  }

  lines.push(
    "",
    "Reply or quote the source post on X — earn SOL by engagement when the campaign ends.",
    "",
    url,
  );

  return lines.join("\n").trim();
}
