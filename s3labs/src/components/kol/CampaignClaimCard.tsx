import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Coins, ExternalLink, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  claimCampaignReward,
  fetchWalletVerification,
  KolApiError,
  type KolLeaderboardEntry,
  type KolViewerClaimEligibility,
} from "@/lib/kolApi";
import { formatSol } from "@/lib/kolFormat";

interface CampaignClaimCardProps {
  campaignId: string;
  campaignTitle: string;
  leaderboard: KolLeaderboardEntry[];
  viewerClaimEligibility?: KolViewerClaimEligibility | null;
  onClaimed?: () => void;
}

function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^@/, "").toLowerCase();
}

export function CampaignClaimCard({
  campaignId,
  campaignTitle,
  leaderboard,
  viewerClaimEligibility,
  onClaimed,
}: CampaignClaimCardProps) {
  const wallet = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const address = wallet.publicKey?.toBase58();

  const verificationQuery = useQuery({
    queryKey: ["kol-x-verification", address],
    queryFn: () => fetchWalletVerification(address!),
    enabled: Boolean(address),
    staleTime: 5 * 60 * 1000,
  });

  const verifiedHandleKey = verificationQuery.data?.xHandleKey
    ? normalizeHandle(verificationQuery.data.xHandleKey)
    : verificationQuery.data?.xHandle
      ? normalizeHandle(verificationQuery.data.xHandle)
      : null;

  const ownEntry = verifiedHandleKey
    ? leaderboard.find(
        (entry) =>
          normalizeHandle(entry.authorHandleKey ?? entry.authorHandle) ===
          verifiedHandleKey,
      )
    : null;

  const claimBlockedByCampaignRule =
    viewerClaimEligibility?.requireCreatedOneCampaign === true &&
    !viewerClaimEligibility.hasCreatedCampaign;

  const claimable =
    ownEntry?.claimStatus === "claimable" &&
    (ownEntry.earnedSol ?? 0) > 0 &&
    !claimBlockedByCampaignRule;

  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Connect your Solana wallet first");
      return claimCampaignReward(campaignId, { wallet: address });
    },
    onSuccess: (data) => {
      if (data.status === "pending_minimum") {
        toast.message("Reward queued", {
          description:
            "Your balance is below the minimum on-chain payout. It will roll over until you reach 0.01 SOL.",
        });
      } else {
        toast.success("Reward claimed!", {
          description: `${formatSol((data.sentLamports ?? data.lamports) / 1_000_000_000)} SOL sent to your wallet.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ["kol-earnings", address] });
      onClaimed?.();
    },
    onError: (e: Error) => {
      if (e instanceof KolApiError && e.code === "require_created_campaign") {
        toast.error(e.message);
        return;
      }
      toast.error(e.message);
    },
  });

  if (!ownEntry) return null;

  const earnedSol = ownEntry.earnedSol ?? ownEntry.projectedSol ?? 0;
  const alreadyClaimed = ownEntry.claimStatus === "claimed";

  return (
    <div className="panel-glass rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-5 sm:p-8 space-y-4">
      <div className="flex items-start gap-3">
        <Coins className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-lg">Your reward</h3>
          <p className="text-sm text-muted-foreground mt-1">
            @{ownEntry.authorHandle} earned{" "}
            <span className="font-semibold text-foreground">
              {formatSol(earnedSol)} SOL
            </span>{" "}
            on {campaignTitle}.
          </p>
        </div>
      </div>

      {!verificationQuery.data?.verified ? (
        <p className="text-sm text-amber-400">
          Verify your X account above to claim this reward.
        </p>
      ) : claimBlockedByCampaignRule ? (
        <div className="space-y-3">
          <p className="text-sm text-amber-400">
            {viewerClaimEligibility?.message ??
              "Create one campaign first to claim your reward."}
          </p>
          <Button
            variant="hero"
            className="rounded-full"
            onClick={() => navigate("/kol?tab=create")}
          >
            Create a campaign
          </Button>
        </div>
      ) : alreadyClaimed ? (
        <p className="text-sm text-muted-foreground">Reward already claimed.</p>
      ) : claimable ? (
        <Button
          variant="hero"
          className="rounded-full"
          disabled={!address || claimMutation.isPending}
          onClick={() => claimMutation.mutate()}
        >
          {claimMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Claiming…
            </>
          ) : (
            `Claim ${formatSol(earnedSol)} SOL`
          )}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">
          No claimable reward for your verified account on this campaign.
        </p>
      )}

      {ownEntry.payout?.txSignature ? (
        <a
          href={`https://solscan.io/tx/${ownEntry.payout.txSignature}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary"
        >
          View transaction
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : null}
    </div>
  );
}
