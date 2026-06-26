import { useCallback, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Share2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KolLeaderboardEntry } from "@/lib/kolApi";
import { KolRankShareDialog } from "@/components/kol/KolRankShareDialog";
import type { KolRankShareCardData } from "@/components/kol/KolRankShareCard";
import { buildKolRankShareUrl } from "@/components/kol/kolRankShareExport";
import { cn } from "@/lib/utils";

interface KolMyRankShareActionProps {
  entries: KolLeaderboardEntry[];
  campaignId: string;
  campaignTitle: string;
  campaignStatus: string;
  rewardSol: number;
}

function getPayoutSol(entry: KolLeaderboardEntry): number {
  return entry.payout?.sol ?? entry.projectedSol;
}

function walletsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export function KolMyRankShareAction({
  entries,
  campaignId,
  campaignTitle,
  campaignStatus,
  rewardSol,
}: KolMyRankShareActionProps) {
  const wallet = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const walletAddress = wallet.publicKey?.toBase58() ?? null;
  const [shareOpen, setShareOpen] = useState(false);
  const [shareData, setShareData] = useState<KolRankShareCardData | null>(null);

  const payoutLabel = campaignStatus === "completed" ? "Paid" : "Projected";

  const ownEntryIndex = useMemo(() => {
    if (!walletAddress) return -1;
    return entries.findIndex((e) => walletsMatch(e.kolWallet, walletAddress));
  }, [entries, walletAddress]);

  const ownRank = ownEntryIndex >= 0 ? ownEntryIndex + 1 : null;
  const ownEntry = ownEntryIndex >= 0 ? entries[ownEntryIndex] : null;
  const canShare = ownRank != null && ownEntry != null;

  const openShare = useCallback(() => {
    if (!ownEntry || ownRank == null) return;
    setShareData({
      rank: ownRank,
      totalParticipants: entries.length,
      handle: ownEntry.authorHandle,
      verified: ownEntry.verified,
      score: ownEntry.latestScore,
      payoutSol: getPayoutSol(ownEntry),
      payoutLabel,
      likes: ownEntry.latestMetrics.likeCount,
      views: ownEntry.latestMetrics.viewCount,
      mode: ownEntry.mode,
      campaignTitle,
      rewardSol,
      shareUrl: buildKolRankShareUrl(campaignId),
    });
    setShareOpen(true);
  }, [campaignId, campaignTitle, entries.length, ownEntry, ownRank, payoutLabel, rewardSol]);

  const handleClick = useCallback(() => {
    if (canShare) {
      openShare();
      return;
    }
    if (!wallet.connected) {
      openWalletModal(true);
      return;
    }
    toast.message("Share unlocks once your wallet is on this leaderboard.");
  }, [canShare, openShare, openWalletModal, wallet.connected]);

  if (entries.length === 0) return null;

  const tooltip = canShare
    ? `Share your #${ownRank} rank card`
    : wallet.connected
      ? "Connect the wallet you submitted with"
      : "Connect wallet to share your rank";

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full shrink-0 border-border/60 bg-muted/30",
                canShare && "border-primary/35 bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary",
              )}
              onClick={handleClick}
              aria-label={tooltip}
            >
              <Share2 className="h-4 w-4" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tooltip}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <KolRankShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        data={shareData}
        campaignId={campaignId}
      />
    </>
  );
}
