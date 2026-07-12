import { useMutation } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { Coins, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { confirmCampaignDeposit, type KolCampaign } from "@/lib/kolApi";
import { formatSol } from "@/lib/kolFormat";
import { lamportsToSol, sendCampaignDeposit } from "@/lib/solanaKol";

interface CampaignFundDepositCardProps {
  campaign: KolCampaign;
  onFunded?: (campaign: KolCampaign) => void;
  /** Compact variant for embedding in the create form. */
  compact?: boolean;
}

export function CampaignFundDepositCard({
  campaign,
  onFunded,
  compact = false,
}: CampaignFundDepositCardProps) {
  const wallet = useWallet();
  const address = wallet.publicKey?.toBase58();
  const isOwner =
    Boolean(address) &&
    address!.trim().toLowerCase() === campaign.projectWallet.trim().toLowerCase();

  const depositAmountSol = lamportsToSol(campaign.rewardLamports);

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.publicKey) throw new Error("Connect your Solana wallet first");
      if (!isOwner) throw new Error("Only the campaign creator can fund this campaign");

      const signature = await sendCampaignDeposit({
        wallet,
        poolWalletAddress: campaign.poolWalletAddress,
        lamports: campaign.rewardLamports,
      });

      return confirmCampaignDeposit(campaign.id, {
        txSignature: signature,
        projectWallet: wallet.publicKey.toBase58(),
      });
    },
    onSuccess: (data) => {
      onFunded?.(data.campaign);
      toast.success("Campaign is live", {
        description: "+5 S3Labs Points credited. KOLs can now reply or quote on X.",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (campaign.status !== "pending_deposit") return null;

  if (!isOwner) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-6 space-y-2">
        <h3 className="font-semibold">Waiting on funding</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This campaign is drafted but not live yet. The project still needs to deposit{" "}
          <span className="font-medium text-foreground tabular-nums">
            {formatSol(depositAmountSol)} SOL
          </span>{" "}
          to open the reward pool.
        </p>
      </div>
    );
  }

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3"
          : "rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 sm:p-8 space-y-5"
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30">
          <Coins className="w-4 h-4 text-amber-400" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="eyebrow text-amber-400/90">Payment required</p>
          <h3 className="font-semibold text-lg tracking-tight">
            Finish funding to go live
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your campaign draft is saved. Approve a{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatSol(depositAmountSol)} SOL
            </span>{" "}
            deposit to activate the reward pool. You can leave and come back anytime — open this
            campaign again to continue.
          </p>
        </div>
      </div>

      {!wallet.publicKey ? (
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-4 py-3 text-sm">
          <Wallet className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            Connect the wallet that created this campaign to pay.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          variant="hero"
          className="rounded-full w-full sm:w-auto"
          disabled={!wallet.publicKey || depositMutation.isPending}
          onClick={() => depositMutation.mutate()}
        >
          {depositMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Waiting for wallet…
            </>
          ) : (
            `Pay ${formatSol(depositAmountSol)} SOL & go live`
          )}
        </Button>
      </div>

      <p className="text-xs font-mono text-muted-foreground break-all">
        Pool: {campaign.poolWalletAddress}
      </p>
    </div>
  );
}
