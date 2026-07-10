import { useNavigate } from "react-router-dom";
import { Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { KolLeaderboardEntry, KolViewerClaimEligibility } from "@/lib/kolApi";
import { KOL_CREATE_CAMPAIGN_GATE_BODY } from "@/lib/kolRewardEligibility";

interface CampaignParticipationGateCardProps {
  ownEntry: KolLeaderboardEntry;
  viewerClaimEligibility: KolViewerClaimEligibility;
}

export function CampaignParticipationGateCard({
  ownEntry,
  viewerClaimEligibility,
}: CampaignParticipationGateCardProps) {
  const navigate = useNavigate();

  if (
    !viewerClaimEligibility.requireCreatedOneCampaign ||
    viewerClaimEligibility.hasCreatedCampaign
  ) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Megaphone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-2 min-w-0">
          <h3 className="font-semibold">You&apos;re on the board — one step left</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You joined as{" "}
            <span className="text-foreground font-medium">@{ownEntry.authorHandle}</span>.
            This campaign only pays wallets that have created and funded at least one campaign on S3 Labs. Pending deposits do not count.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {KOL_CREATE_CAMPAIGN_GATE_BODY}
          </p>
        </div>
      </div>
      <Button
        variant="hero"
        className="rounded-full"
        onClick={() => navigate("/kol?tab=create")}
      >
        Create a campaign
      </Button>
    </div>
  );
}
