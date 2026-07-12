import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  CampaignEndDatePicker,
  defaultCampaignEndDate,
  durationDaysFromEndDate,
} from "@/components/kol/CampaignEndDatePicker";
import { CampaignFundDepositCard } from "@/components/kol/CampaignFundDepositCard";
import { isAdminWallet } from "@/lib/adminWallet";
import {
  createCampaign,
  fetchCampaigns,
  KolApiError,
  DEFAULT_KOL_CONFIG,
  type KolCampaign,
} from "@/lib/kolApi";
import { lamportsToSol, solToLamports } from "@/lib/solanaKol";

interface CreateCampaignFormProps {
  minRewardSol: number;
  minKolRewardSol?: number;
  platformFeeSol?: number;
  minDurationDays?: number;
  maxDurationDays: number;
  poolWalletAddress: string;
  onCreated?: (campaign: KolCampaign) => void;
  onOpenCampaign?: (campaignId: string) => void;
}

export function CreateCampaignForm({
  minRewardSol,
  minKolRewardSol,
  platformFeeSol = DEFAULT_KOL_CONFIG.platformFeeSol,
  minDurationDays = 1,
  maxDurationDays,
  poolWalletAddress,
  onCreated,
  onOpenCampaign,
}: CreateCampaignFormProps) {
  const wallet = useWallet();
  const minKolPoolSol = minKolRewardSol ?? minRewardSol - platformFeeSol;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceTweetUrl, setSourceTweetUrl] = useState("");
  const [rewardSol, setRewardSol] = useState(String(minKolPoolSol));
  const [endDate, setEndDate] = useState(() => defaultCampaignEndDate(7));
  const [requireCreatedOneCampaign, setRequireCreatedOneCampaign] =
    useState(false);
  const [pendingCampaign, setPendingCampaign] = useState<KolCampaign | null>(
    null,
  );
  const [dismissedResume, setDismissedResume] = useState(false);

  const walletAddress = wallet.publicKey?.toBase58() ?? null;
  const isAdmin = isAdminWallet(walletAddress);

  const campaignsQuery = useQuery({
    queryKey: ["kol-campaigns"],
    queryFn: () => fetchCampaigns(),
    staleTime: 60 * 1000,
    enabled: Boolean(walletAddress),
  });

  const existingPending = useMemo(() => {
    if (!walletAddress) return null;
    return (
      campaignsQuery.data?.campaigns.find(
        (c) =>
          c.status === "pending_deposit" &&
          c.projectWallet.trim().toLowerCase() === walletAddress.trim().toLowerCase(),
      ) ?? null
    );
  }, [campaignsQuery.data?.campaigns, walletAddress]);

  useEffect(() => {
    if (!existingPending || dismissedResume) return;
    setPendingCampaign(existingPending);
  }, [existingPending, dismissedResume]);

  const durationDays = durationDaysFromEndDate(endDate);
  const kolRewardNum = Number(rewardSol);
  const minKolPoolLamports = solToLamports(minKolPoolSol);
  const kolRewardLamports =
    Number.isFinite(kolRewardNum) && kolRewardNum > 0
      ? solToLamports(kolRewardNum)
      : 0;
  const totalDepositLamports =
    kolRewardLamports > 0
      ? kolRewardLamports + solToLamports(platformFeeSol)
      : 0;
  const totalDepositSol = lamportsToSol(totalDepositLamports);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.publicKey)
        throw new Error("Connect your Solana wallet first");

      if (kolRewardLamports < minKolPoolLamports) {
        throw new Error(`Minimum KOL reward is ${minKolPoolSol} SOL`);
      }

      if (durationDays < minDurationDays || durationDays > maxDurationDays) {
        throw new Error(
          `Campaign must run ${minDurationDays}–${maxDurationDays} days`,
        );
      }

      return createCampaign({
        projectWallet: wallet.publicKey.toBase58(),
        sourceTweetUrl,
        title,
        description,
        rewardSol: totalDepositSol,
        durationDays,
        ...(isAdmin && requireCreatedOneCampaign
          ? { requireCreatedOneCampaign: true }
          : {}),
      });
    },
    onSuccess: (data) => {
      setDismissedResume(false);
      setPendingCampaign(data.campaign);
      void campaignsQuery.refetch();
      toast.message("Campaign draft created", {
        description: "Approve the SOL deposit in your wallet to activate it.",
      });
    },
    onError: (e: Error) => {
      if (e instanceof KolApiError && e.code === "pending_deposit_limit") {
        void campaignsQuery.refetch().then(() => {
          toast.error("You already have an unpaid campaign draft", {
            description: "Open it to finish payment, or continue from the form below.",
          });
        });
        return;
      }
      toast.error(e.message);
    },
  });

  const isBusy = createMutation.isPending;
  const awaitingDeposit = Boolean(pendingCampaign?.status === "pending_deposit");
  const rewardValid = kolRewardLamports >= minKolPoolLamports;
  const durationValid =
    durationDays >= minDurationDays && durationDays <= maxDurationDays;

  return (
    <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-8 space-y-6 max-w-2xl min-w-0">
      <div>
        <p className="eyebrow mb-2">For Projects</p>
        <h2 className="heading-section">Launch a KOL campaign</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Post the X URL you want amplified and fund the campaign. KOLs earn by
          engagement at snapshot. You earn{" "}
          <span className="text-foreground/90 font-medium">
            +5 S3Labs Points
          </span>{" "}
          when your campaign goes live.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 min-w-0">
        {wallet.publicKey ? (
          <span className="text-xs text-muted-foreground font-mono break-all">
            {wallet.publicKey.toBase58()}
          </span>
        ) : (
          <p className="text-sm text-muted-foreground">
            Connect your wallet from the navbar to continue.
          </p>
        )}
      </div>

      {awaitingDeposit && pendingCampaign ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 space-y-1">
            <p className="text-sm font-medium text-foreground">{pendingCampaign.title}</p>
            <p className="text-xs text-muted-foreground">
              Draft saved — finish payment to go live. You can also open it anytime from Browse.
            </p>
          </div>

          <CampaignFundDepositCard
            campaign={pendingCampaign}
            compact
            onFunded={(campaign) => {
              setPendingCampaign(null);
              setDismissedResume(true);
              void campaignsQuery.refetch();
              onCreated?.(campaign);
            }}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {onOpenCampaign ? (
              <Button
                variant="outline"
                className="rounded-full w-full sm:w-auto"
                onClick={() => onOpenCampaign(pendingCampaign.id)}
              >
                Open campaign page
              </Button>
            ) : null}
            <Button
              variant="ghost"
              className="rounded-full w-full sm:w-auto text-muted-foreground"
              disabled={isBusy}
              onClick={() => {
                setPendingCampaign(null);
                setDismissedResume(true);
              }}
            >
              Hide for now
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Hiding does not cancel the draft. Find it under{" "}
            <span className="text-foreground/80">Browse → Your draft</span> to pay later.
            Pool wallet:{" "}
            <span className="font-mono break-all">{poolWalletAddress}</span>
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="kol-title">Campaign title</Label>
              <Input
                id="kol-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Launch week awareness push"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kol-tweet">X post URL to shill</Label>
              <Input
                id="kol-tweet"
                value={sourceTweetUrl}
                onChange={(e) => setSourceTweetUrl(e.target.value)}
                placeholder="https://x.com/yourproject/status/..."
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
                autoResize
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="kol-reward">KOL reward (SOL)</Label>
                <Input
                  id="kol-reward"
                  type="number"
                  min={minKolPoolSol}
                  step="0.01"
                  value={rewardSol}
                  onChange={(e) => setRewardSol(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Min {minKolPoolSol} SOL · total deposit{" "}
                  <span className="text-foreground/80 font-medium tabular-nums">
                    {totalDepositSol.toFixed(3)} SOL
                  </span>{" "}
                  (incl. {platformFeeSol} SOL platform fee)
                </p>
              </div>
              <div className="space-y-2">
                <Label>Campaign end date</Label>
                <CampaignEndDatePicker
                  value={endDate}
                  onChange={setEndDate}
                  minDurationDays={minDurationDays}
                  maxDurationDays={maxDurationDays}
                />
              </div>
            </div>

            {isAdmin ? (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Admin participation rules
                </p>
                <div className="flex items-center justify-between gap-4">
                  <Label
                    htmlFor="kol-rule-created-campaign"
                    className="text-sm font-normal leading-snug"
                  >
                    Require funded campaign to qualify
                  </Label>
                  <Switch
                    id="kol-rule-created-campaign"
                    checked={requireCreatedOneCampaign}
                    onCheckedChange={setRequireCreatedOneCampaign}
                  />
                </div>
              </div>
            ) : null}
          </div>

          {existingPending && dismissedResume ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm space-y-2">
              <p className="text-muted-foreground leading-relaxed">
                You still have an unpaid draft{" "}
                <span className="font-medium text-foreground">
                  “{existingPending.title}”
                </span>
                . Fund it before creating another.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="hero"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setDismissedResume(false);
                    setPendingCampaign(existingPending);
                  }}
                >
                  Continue payment
                </Button>
                {onOpenCampaign ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => onOpenCampaign(existingPending.id)}
                  >
                    Open campaign
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <Button
            variant="hero"
            className="rounded-full w-full sm:w-auto"
            disabled={
              !wallet.publicKey ||
              isBusy ||
              !title ||
              !sourceTweetUrl ||
              !rewardValid ||
              !durationValid ||
              Boolean(existingPending)
            }
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating campaign…
              </>
            ) : (
              "Create campaign draft"
            )}
          </Button>
        </>
      )}
    </div>
  );
}
