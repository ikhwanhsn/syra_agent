import { useCallback, useMemo, useState } from "react";
import { Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KolCampaign, KolLeaderboardEntry } from "@/lib/kolApi";
import { KolCampaignEarnShareDialog } from "@/components/kol/KolCampaignEarnShareDialog";
import type { KolCampaignEarnShareCardData } from "@/components/kol/KolCampaignEarnShareCard";
import { buildKolRankShareUrl } from "@/components/kol/kolRankShareExport";
import { formatSol } from "@/lib/kolFormat";
import { cn } from "@/lib/utils";

interface KolCampaignEarnShareActionProps {
  campaign: KolCampaign;
  rewardSol: number;
  timeLeft: string;
  participantCount: number;
  leaderboard?: KolLeaderboardEntry[];
  variant?: "icon" | "button";
  prominent?: boolean;
  className?: string;
}

function getPayoutSol(entry: KolLeaderboardEntry): number {
  return entry.payout?.sol ?? entry.projectedSol;
}

export function KolCampaignEarnShareAction({
  campaign,
  rewardSol,
  timeLeft,
  participantCount,
  leaderboard = [],
  variant = "button",
  prominent = false,
  className,
}: KolCampaignEarnShareActionProps) {
  const [shareOpen, setShareOpen] = useState(false);

  const topProjectedSol = useMemo(() => {
    if (leaderboard.length === 0) return null;
    return Math.max(...leaderboard.map(getPayoutSol));
  }, [leaderboard]);

  const shareData = useMemo<KolCampaignEarnShareCardData>(
    () => ({
      campaignTitle: campaign.title,
      rewardSol,
      timeLeft,
      participantCount,
      status: campaign.status,
      sourceAuthorHandle: campaign.sourceAuthorHandle,
      sourceAuthorVerified: campaign.sourceAuthorVerified,
      sourceTweetText: campaign.sourceTweetText,
      topProjectedSol,
      shareUrl: buildKolRankShareUrl(campaign.id),
    }),
    [
      campaign.id,
      campaign.sourceAuthorHandle,
      campaign.sourceAuthorVerified,
      campaign.sourceTweetText,
      campaign.status,
      campaign.title,
      participantCount,
      rewardSol,
      timeLeft,
      topProjectedSol,
    ],
  );

  const openShare = useCallback(() => {
    setShareOpen(true);
  }, []);

  const tooltip = `Share ${formatSol(rewardSol)} SOL earnings card`;

  const buttonClassName = cn(
    prominent
      ? "h-11 w-full rounded-full gap-2 border-primary/35 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-semibold shadow-sm"
      : "rounded-full gap-2 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary",
    className,
  );

  return (
    <div className={cn(prominent && variant === "button" && "w-full")}>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {variant === "icon" ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "h-9 w-9 rounded-full shrink-0 border-primary/35 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
                  className,
                )}
                onClick={openShare}
                aria-label={tooltip}
              >
                <Share2 className="h-4 w-4" aria-hidden />
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size={prominent ? "default" : "sm"}
                className={buttonClassName}
                onClick={openShare}
              >
                <Share2 className="h-4 w-4 shrink-0" aria-hidden />
                Share earnings card
              </Button>
            )}
          </TooltipTrigger>
          <TooltipContent side="bottom">{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <KolCampaignEarnShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        data={shareData}
        campaignId={campaign.id}
      />
    </div>
  );
}
