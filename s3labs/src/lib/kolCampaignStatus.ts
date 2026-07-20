import type { KolCampaign } from "./kolApi";

export function isCampaignEnded(campaign: Pick<KolCampaign, "endAt">): boolean {
  if (!campaign.endAt) return false;
  return new Date(campaign.endAt).getTime() <= Date.now();
}

export function isCampaignLive(campaign: Pick<KolCampaign, "status" | "endAt">): boolean {
  return campaign.status === "active" && !isCampaignEnded(campaign);
}

export function isCampaignFinalizing(campaign: Pick<KolCampaign, "status" | "endAt">): boolean {
  if (campaign.status === "finalizing") return true;
  return campaign.status === "active" && isCampaignEnded(campaign);
}

export type KolCampaignDisplayPhase =
  | "live"
  | "finalizing"
  | Exclude<KolCampaign["status"], "active" | "finalizing">;

export function getCampaignDisplayPhase(
  campaign: Pick<KolCampaign, "status" | "endAt">,
): KolCampaignDisplayPhase {
  if (isCampaignLive(campaign)) return "live";
  if (isCampaignFinalizing(campaign)) return "finalizing";
  return campaign.status;
}

const displayLabels: Record<KolCampaignDisplayPhase, string> = {
  live: "Active",
  finalizing: "Ended · payouts pending",
  pending_deposit: "Pending deposit",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function getCampaignDisplayLabel(phase: KolCampaignDisplayPhase): string {
  return displayLabels[phase];
}

const displayStyles: Record<KolCampaignDisplayPhase, string> = {
  live: "bg-primary/15 text-primary border-primary/30",
  finalizing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  pending_deposit: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

export function getCampaignDisplayStyle(phase: KolCampaignDisplayPhase): string {
  return displayStyles[phase];
}
