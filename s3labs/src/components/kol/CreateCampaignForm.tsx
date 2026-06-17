import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  confirmCampaignDeposit,
  createCampaign,
  type KolCampaign,
} from "@/lib/kolApi";
import { sendCampaignDeposit } from "@/lib/solanaKol";

interface CreateCampaignFormProps {
  minRewardSol: number;
  maxDurationDays: number;
  poolWalletAddress: string;
  onCreated?: (campaign: KolCampaign) => void;
}

export function CreateCampaignForm({
  minRewardSol,
  maxDurationDays,
  poolWalletAddress,
  onCreated,
}: CreateCampaignFormProps) {
  const wallet = useWallet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceTweetUrl, setSourceTweetUrl] = useState("");
  const [rewardSol, setRewardSol] = useState(String((minRewardSol * 0.8).toFixed(2)));
  const [durationDays, setDurationDays] = useState("7");
  const [pendingCampaign, setPendingCampaign] = useState<KolCampaign | null>(null);
  const [depositInfo, setDepositInfo] = useState<{
    poolWalletAddress: string;
    rewardLamports: number;
    kolRewardPoolLamports?: number;
    platformFeeLamports?: number;
  } | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.publicKey) throw new Error("Connect your Solana wallet first");
      const kolRewardSol = Number(rewardSol);
      if (!Number.isFinite(kolRewardSol) || kolRewardSol <= 0) {
        throw new Error("Enter a valid KOL reward amount");
      }
      // Backend pool is total deposit; KOLs receive 80% of that at payout.
      const totalDepositSol = kolRewardSol / 0.8;
      return createCampaign({
        projectWallet: wallet.publicKey.toBase58(),
        sourceTweetUrl,
        title,
        description,
        rewardSol: totalDepositSol,
        durationDays: Number(durationDays),
      });
    },
    onSuccess: (data) => {
      setPendingCampaign(data.campaign);
      setDepositInfo(data.deposit);
      toast.message("Campaign draft created", {
        description: "Approve the SOL deposit in your wallet to activate it.",
      });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.publicKey) throw new Error("Connect your Solana wallet first");
      if (!pendingCampaign || !depositInfo) {
        throw new Error("Create the campaign first");
      }

      const signature = await sendCampaignDeposit({
        wallet,
        poolWalletAddress: depositInfo.poolWalletAddress,
        lamports: depositInfo.rewardLamports,
      });

      return confirmCampaignDeposit(pendingCampaign.id, {
        txSignature: signature,
        projectWallet: wallet.publicKey.toBase58(),
      });
    },
    onSuccess: (data) => {
      setPendingCampaign(null);
      setDepositInfo(null);
      onCreated?.(data.campaign);
      toast.success("Campaign is live", {
        description: "KOLs can now submit replies and quotes.",
      });
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  const minKolRewardSol = minRewardSol * 0.8;
  const isBusy = createMutation.isPending || depositMutation.isPending;
  const awaitingDeposit = Boolean(pendingCampaign && depositInfo);

  return (
    <div className="panel-glass rounded-2xl border border-border/60 p-6 sm:p-8 space-y-6 max-w-2xl">
      <div>
        <p className="eyebrow mb-2">For Projects</p>
        <h2 className="heading-section">Launch a KOL campaign</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Post the X URL you want amplified and fund the campaign. KOLs earn by engagement at snapshot.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <WalletMultiButton className="!rounded-full !bg-primary !h-10" />
        {wallet.publicKey ? (
          <span className="text-xs text-muted-foreground font-mono">
            {wallet.publicKey.toBase58()}
          </span>
        ) : null}
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="kol-title">Campaign title</Label>
          <Input
            id="kol-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Launch week awareness push"
            disabled={awaitingDeposit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kol-tweet">X post URL to shill</Label>
          <Input
            id="kol-tweet"
            value={sourceTweetUrl}
            onChange={(e) => setSourceTweetUrl(e.target.value)}
            placeholder="https://x.com/yourproject/status/..."
            disabled={awaitingDeposit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="kol-desc">Description (optional)</Label>
          <Textarea
            id="kol-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key talking points for KOLs"
            rows={3}
            disabled={awaitingDeposit}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="kol-reward">KOL reward (SOL)</Label>
            <Input
              id="kol-reward"
              type="number"
              min={minKolRewardSol}
              step="0.01"
              value={rewardSol}
              onChange={(e) => setRewardSol(e.target.value)}
              disabled={awaitingDeposit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kol-duration">Duration (days)</Label>
            <Input
              id="kol-duration"
              type="number"
              min={1}
              max={maxDurationDays}
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
              disabled={awaitingDeposit}
            />
          </div>
        </div>
      </div>

      {depositInfo ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm space-y-2">
          <p className="font-medium text-amber-300">Step 2 — Fund campaign</p>
          <p className="text-muted-foreground">
            Approve the transaction in your wallet to activate this campaign and fund the KOL
            reward pool.
          </p>
          <p className="text-xs font-mono text-muted-foreground break-all">
            Pool: {poolWalletAddress}
          </p>
          {pendingCampaign ? (
            <p className="text-xs text-muted-foreground">Campaign ID: {pendingCampaign.id}</p>
          ) : null}
        </div>
      ) : null}

      {!awaitingDeposit ? (
        <Button
          variant="hero"
          className="rounded-full"
          disabled={!wallet.publicKey || isBusy || !title || !sourceTweetUrl}
          onClick={() => createMutation.mutate()}
        >
          {createMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating campaign…
            </>
          ) : (
            "Step 1 — Create campaign"
          )}
        </Button>
      ) : (
        <div className="flex flex-wrap gap-3">
          <Button
            variant="hero"
            className="rounded-full"
            disabled={!wallet.publicKey || isBusy}
            onClick={() => depositMutation.mutate()}
          >
            {depositMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Waiting for wallet…
              </>
            ) : (
              "Step 2 — Confirm in wallet"
            )}
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            disabled={isBusy}
            onClick={() => {
              setPendingCampaign(null);
              setDepositInfo(null);
            }}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
