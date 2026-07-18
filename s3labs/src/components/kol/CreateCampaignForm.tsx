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
import { KolInvitePanel } from "@/components/kol/KolInvitePanel";
import {
  createCampaign,
  fetchCampaigns,
  fetchKolConfig,
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

function parseAllowlist(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((h) => h.replace(/^@/, "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 100);
}

export function CreateCampaignForm({
  minRewardSol,
  minKolRewardSol,
  platformFeeSol: platformFeeSolProp = DEFAULT_KOL_CONFIG.platformFeeSol,
  minDurationDays = 1,
  maxDurationDays,
  poolWalletAddress,
  onCreated,
  onOpenCampaign,
}: CreateCampaignFormProps) {
  const wallet = useWallet();
  const walletAddress = wallet.publicKey?.toBase58() ?? null;

  const configQuery = useQuery({
    queryKey: ["kol-config", walletAddress],
    queryFn: () => fetchKolConfig({ wallet: walletAddress ?? undefined }),
    staleTime: 60_000,
  });

  const platformFeeSol =
    configQuery.data?.platformFeeSol ?? platformFeeSolProp;
  const feeWaived = Boolean(configQuery.data?.firstCampaignFeeWaived);
  const minKolPoolSol = minKolRewardSol ?? Math.max(0.01, minRewardSol - platformFeeSol);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sourceTweetUrl, setSourceTweetUrl] = useState("");
  const [rewardSol, setRewardSol] = useState(String(minKolPoolSol));
  const [endDate, setEndDate] = useState(() => defaultCampaignEndDate(7));
  const [requireCreatedOneCampaign, setRequireCreatedOneCampaign] =
    useState(false);
  const [allowedHandlesRaw, setAllowedHandlesRaw] = useState("");
  const [useTopN, setUseTopN] = useState(false);
  const [payoutTopN, setPayoutTopN] = useState("10");
  const [topNSharePreset, setTopNSharePreset] = useState<"100" | "70">("100");
  const [pendingCampaign, setPendingCampaign] = useState<KolCampaign | null>(
    null,
  );
  const [dismissedResume, setDismissedResume] = useState(false);

  const campaignsQuery = useQuery({
    queryKey: ["kol-campaigns", walletAddress ?? null],
    queryFn: () => fetchCampaigns({ wallet: walletAddress ?? undefined }),
    staleTime: 60 * 1000,
    enabled: Boolean(walletAddress),
  });

  const existingPending = useMemo(() => {
    if (!walletAddress) return null;
    const w = walletAddress.trim();
    return (
      campaignsQuery.data?.campaigns.find(
        (c) =>
          c.status === "pending_deposit" &&
          c.projectWallet.trim() === w,
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

      const allowedHandles = parseAllowlist(allowedHandlesRaw);
      const topN =
        useTopN && Number(payoutTopN) > 0
          ? Math.min(100, Math.floor(Number(payoutTopN)))
          : null;

      return createCampaign({
        projectWallet: wallet.publicKey.toBase58(),
        sourceTweetUrl,
        title,
        description,
        rewardSol: totalDepositSol,
        durationDays,
        requireCreatedOneCampaign,
        ...(allowedHandles.length > 0 ? { allowedHandles } : {}),
        ...(topN
          ? {
              payoutTopN: topN,
              payoutTopNShareBps: topNSharePreset === "70" ? 7000 : 10_000,
            }
          : {}),
      });
    },
    onSuccess: (data) => {
      setDismissedResume(false);
      setPendingCampaign(data.campaign);
      void campaignsQuery.refetch();
      void configQuery.refetch();
      toast.message("Campaign draft created", {
        description: data.deposit.firstCampaignFeeWaived
          ? "First campaign: platform fee waived. Approve the deposit to go live."
          : "Approve the SOL deposit in your wallet to activate it.",
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
    <div className="space-y-6 max-w-2xl min-w-0">
      <div className="panel-glass rounded-2xl border border-border/60 p-5 sm:p-8 space-y-6">
        <div>
          <p className="eyebrow mb-2">For Projects</p>
          <h2 className="heading-section">Launch a KOL campaign</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Fund a SOL pool on your X post. KOLs compete by engagement. Unused pool
            is refunded when the campaign ends. You earn{" "}
            <span className="text-foreground/90 font-medium">+5 S3Labs Points</span>{" "}
            when it goes live.
          </p>
          {feeWaived ? (
            <p className="text-xs text-primary mt-2 font-medium">
              First campaign: platform fee waived (0 SOL).
            </p>
          ) : null}
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
                Draft saved — finish payment to go live. You can also open it anytime from My campaigns.
              </p>
            </div>

            <CampaignFundDepositCard
              campaign={pendingCampaign}
              compact
              onFunded={(campaign) => {
                setPendingCampaign(null);
                setDismissedResume(true);
                void campaignsQuery.refetch();
                void configQuery.refetch();
                onCreated?.(campaign);
              }}
              onDeleted={() => {
                setPendingCampaign(null);
                setDismissedResume(true);
                void campaignsQuery.refetch();
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
                <Label htmlFor="kol-tweet">X post URL to amplify</Label>
                <Input
                  id="kol-tweet"
                  value={sourceTweetUrl}
                  onChange={(e) => setSourceTweetUrl(e.target.value)}
                  placeholder="https://x.com/yourproject/status/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kol-desc">Brief / talking points (optional)</Label>
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
                    </span>
                    {platformFeeSol > 0
                      ? ` (incl. ${platformFeeSol} SOL fee)`
                      : " (fee waived)"}
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

              <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Growth & payout controls
                </p>
                <div className="flex items-center justify-between gap-4">
                  <Label
                    htmlFor="kol-rule-created-campaign"
                    className="text-sm font-normal leading-snug"
                  >
                    Require KOLs to fund a campaign to earn
                  </Label>
                  <Switch
                    id="kol-rule-created-campaign"
                    checked={requireCreatedOneCampaign}
                    onCheckedChange={setRequireCreatedOneCampaign}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kol-allowlist">Allowlist handles (optional)</Label>
                  <Input
                    id="kol-allowlist"
                    value={allowedHandlesRaw}
                    onChange={(e) => setAllowedHandlesRaw(e.target.value)}
                    placeholder="@alice, @bob — empty = open to everyone"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Non-allowlisted engagers still appear on the board; only listed handles earn SOL.
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="kol-topn" className="text-sm font-normal leading-snug">
                    Pay top N only
                  </Label>
                  <Switch
                    id="kol-topn"
                    checked={useTopN}
                    onCheckedChange={setUseTopN}
                  />
                </div>
                {useTopN ? (
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="kol-topn-n">Top N</Label>
                      <Input
                        id="kol-topn-n"
                        type="number"
                        min={1}
                        max={100}
                        value={payoutTopN}
                        onChange={(e) => setPayoutTopN(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Pool split</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={topNSharePreset === "100" ? "hero" : "outline"}
                          className="rounded-full flex-1"
                          onClick={() => setTopNSharePreset("100")}
                        >
                          100% top N
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={topNSharePreset === "70" ? "hero" : "outline"}
                          className="rounded-full flex-1"
                          onClick={() => setTopNSharePreset("70")}
                        >
                          70 / 30
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
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

      <KolInvitePanel
        campaignId={pendingCampaign?.id}
        campaignTitle={title || pendingCampaign?.title || "S3 Labs campaign"}
        brief={description || pendingCampaign?.description}
        previewMode={!pendingCampaign || pendingCampaign.status === "pending_deposit"}
      />
    </div>
  );
}
