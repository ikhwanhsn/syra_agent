import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  ArrowRight,
  CalendarDays,
  Coins,
  Link2,
  Loader2,
  Megaphone,
  Sparkles,
  Type,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InfoHint, LabelWithHint } from "@/components/ui/info-hint";
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
import {
  CREATE_FORM_ALLOWLIST_HINT,
  CREATE_FORM_POOL_SPLIT_HINT,
  CREATE_FORM_REQUIRE_LIVE_HINT,
  CREATE_FORM_REQUIRE_LIVE_LABEL,
  CREATE_FORM_TOP_N_HINT,
} from "@/lib/kolRewardEligibility";
import { cn } from "@/lib/utils";
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

const fieldClass =
  "h-11 w-full rounded-xl border-border/50 bg-background/50 px-4 shadow-sm backdrop-blur-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-primary/20";

function parseAllowlist(raw: string): string[] {
  return raw
    .split(/[,\s]+/)
    .map((h) => h.replace(/^@/, "").trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 100);
}

function Field({
  step,
  icon,
  label,
  htmlFor,
  hint,
  info,
  infoLabel,
  children,
  className,
}: {
  step?: number;
  icon?: ReactNode;
  label: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  info?: ReactNode;
  infoLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group/field min-w-0 w-full space-y-2.5", className)}>
      <div className="flex items-center gap-2 min-w-0">
        {step != null ? (
          <span
            className={cn(
              "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
              "border border-primary/25 bg-primary/10 text-[11px] font-semibold tabular-nums text-primary",
            )}
            aria-hidden
          >
            {step}
          </span>
        ) : null}
        {icon ? (
          <span className="hidden text-muted-foreground/80 sm:inline-flex shrink-0">
            {icon}
          </span>
        ) : null}
        <Label
          htmlFor={htmlFor}
          className="text-[13px] font-medium tracking-tight text-foreground/90"
        >
          {label}
        </Label>
        {info ? <InfoHint content={info} label={infoLabel} /> : null}
      </div>
      {children}
      {hint ? (
        <p className="text-[11px] sm:text-xs text-muted-foreground leading-relaxed">
          {hint}
        </p>
      ) : null}
    </div>
  );
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
  const canSubmit =
    Boolean(wallet.publicKey) &&
    !isBusy &&
    Boolean(title) &&
    Boolean(sourceTweetUrl) &&
    rewardValid &&
    durationValid &&
    !existingPending;

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      <div
        className={cn(
          "relative w-full min-w-0 overflow-hidden rounded-3xl",
          "border border-border/50 panel-glass shadow-elevated",
        )}
      >
        {/* Soft atmosphere — stays within brand primary, no purple/glow spam */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-primary/[0.06] blur-3xl"
          aria-hidden
        />

        {/* Header */}
        <header className="relative border-b border-border/40 px-4 py-5 min-[400px]:px-5 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
              <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-primary shadow-md">
                <Megaphone className="h-5 w-5 text-primary-foreground" aria-hidden />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="eyebrow mb-1">For projects</p>
                <h2 className="heading-section text-xl sm:text-2xl lg:text-[1.75rem] tracking-tight">
                  Launch a{" "}
                  <span className="text-gradient">KOL campaign</span>
                </h2>
                <p className="mt-1.5 max-w-xl text-sm text-muted-foreground leading-relaxed">
                  One form — fund a SOL pool on your X post. KOLs compete; unused pool
                  returns to you.{" "}
                  <span className="text-foreground/85 font-medium">+5 points</span> when live.
                </p>
                {feeWaived ? (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                    <Sparkles className="h-3 w-3" aria-hidden />
                    First campaign — platform fee waived
                  </p>
                ) : null}
              </div>
            </div>

            <div
              className={cn(
                "shrink-0 self-stretch lg:self-center",
                "rounded-2xl border border-border/50 bg-background/40 px-3.5 py-2.5 backdrop-blur-sm",
              )}
            >
              {wallet.publicKey ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <Wallet className="h-3.5 w-3.5 text-primary" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      Funding wallet
                    </p>
                    <p className="font-mono text-xs text-foreground/90 truncate max-w-[11rem] min-[400px]:max-w-[15rem] sm:max-w-[18rem]">
                      {wallet.publicKey.toBase58()}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-1">
                  Connect your wallet from the navbar to continue
                </p>
              )}
            </div>
          </div>
        </header>

        {awaitingDeposit && pendingCampaign ? (
          <div className="relative space-y-5 px-4 py-5 min-[400px]:px-5 sm:px-8 sm:py-7 min-w-0">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Coins className="h-4 w-4 text-primary" aria-hidden />
              </span>
              <div>
                <h3 className="font-semibold text-base sm:text-lg tracking-tight">
                  Finish payment to go live
                </h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                  Draft saved — deposit SOL to open the reward pool.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-background/40 px-4 py-3.5 backdrop-blur-sm">
              <p className="text-sm font-medium text-foreground break-words">
                {pendingCampaign.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                You can also open it anytime from My campaigns.
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

            <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:flex-wrap">
              {onOpenCampaign ? (
                <Button
                  variant="outline"
                  className="rounded-full w-full min-[400px]:w-auto"
                  onClick={() => onOpenCampaign(pendingCampaign.id)}
                >
                  Open campaign page
                </Button>
              ) : null}
              <Button
                variant="ghost"
                className="rounded-full w-full min-[400px]:w-auto text-muted-foreground"
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
            <div className="relative space-y-6 px-4 py-5 min-[400px]:px-5 sm:px-8 sm:py-7 min-w-0 sm:space-y-7">
              <Field
                step={1}
                icon={<Type className="h-3.5 w-3.5" />}
                label="Campaign title"
                htmlFor="kol-title"
              >
                <Input
                  id="kol-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Launch week awareness push"
                  className={fieldClass}
                />
              </Field>

              <Field
                step={2}
                icon={<Link2 className="h-3.5 w-3.5" />}
                label="X post URL to amplify"
                htmlFor="kol-tweet"
                hint="KOLs will reply or quote this post, then submit their link."
              >
                <Input
                  id="kol-tweet"
                  value={sourceTweetUrl}
                  onChange={(e) => setSourceTweetUrl(e.target.value)}
                  placeholder="https://x.com/yourproject/status/..."
                  className={fieldClass}
                  inputMode="url"
                />
              </Field>

              <Field
                step={3}
                icon={<Megaphone className="h-3.5 w-3.5" />}
                label={
                  <>
                    Brief / talking points{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </>
                }
                htmlFor="kol-desc"
              >
                <Textarea
                  id="kol-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key talking points for KOLs"
                  rows={3}
                  autoResize
                  className={cn(
                    fieldClass,
                    "min-h-[5.5rem] h-auto py-3 resize-none",
                  )}
                />
              </Field>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 md:items-start">
                <Field
                  step={4}
                  icon={<Coins className="h-3.5 w-3.5" />}
                  label="KOL reward (SOL)"
                  htmlFor="kol-reward"
                  info="This is the SOL pool paid to KOLs by engagement score when the campaign ends. Platform fee (if any) is added on top in the deposit total below."
                  infoLabel="What is KOL reward?"
                  hint={`Minimum ${minKolPoolSol} SOL`}
                >
                  <div className="relative w-full min-w-0">
                    <Input
                      id="kol-reward"
                      type="text"
                      inputMode="decimal"
                      lang="en-US"
                      autoComplete="off"
                      value={rewardSol}
                      onChange={(e) => {
                        const next = e.target.value.replace(/,/g, ".");
                        if (next === "" || /^\d*\.?\d*$/.test(next)) {
                          setRewardSol(next);
                        }
                      }}
                      onBlur={() => {
                        const n = Number(rewardSol);
                        if (!Number.isFinite(n) || n <= 0) return;
                        const rounded = Math.round(n * 1000) / 1000;
                        setRewardSol(String(rounded));
                      }}
                      placeholder="0.01"
                      className={cn(fieldClass, "tabular-nums font-medium pr-14")}
                    />
                    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                      SOL
                    </span>
                  </div>
                </Field>

                <Field
                  step={5}
                  icon={<CalendarDays className="h-3.5 w-3.5" />}
                  label="Campaign end date"
                  info="Pick when the campaign closes. Rankings lock after the end date, then KOLs are paid from the pool."
                  infoLabel="What is the end date?"
                  hint={
                    durationValid
                      ? `${durationDays} day${durationDays === 1 ? "" : "s"} · ends ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                      : `Choose ${minDurationDays}–${maxDurationDays} days from today`
                  }
                >
                  <CampaignEndDatePicker
                    value={endDate}
                    onChange={setEndDate}
                    minDurationDays={minDurationDays}
                    maxDurationDays={maxDurationDays}
                    hideSummary
                  />
                </Field>
              </div>

              {/* Deposit highlight */}
              <div
                className={cn(
                  "rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/[0.08] via-primary/[0.04] to-transparent",
                  "px-4 py-4 sm:px-5 sm:py-4",
                )}
              >
                <div className="flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-medium">
                      You will deposit
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                      {platformFeeSol > 0
                        ? `KOL pool + ${platformFeeSol} SOL platform fee`
                        : "KOL pool only — platform fee waived"}
                    </p>
                  </div>
                  <p className="font-mono text-2xl sm:text-3xl font-semibold tabular-nums tracking-tight text-primary">
                    {totalDepositSol.toFixed(3)}
                    <span className="ml-1.5 text-sm sm:text-base font-medium text-primary/70">
                      SOL
                    </span>
                  </p>
                </div>
              </div>

              {/* Optional rules — softer inset, still same form */}
              <div className="rounded-2xl border border-border/45 bg-muted/15 p-4 sm:p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/50 text-[11px] font-semibold tabular-nums text-muted-foreground">
                        6
                      </span>
                      <p className="text-sm font-medium tracking-tight">Optional rules</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed sm:pl-8">
                      Leave off for an open campaign anyone can earn from.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 sm:pl-0">
                  <div className="flex items-start justify-between gap-3 sm:gap-4 rounded-xl border border-border/40 bg-background/30 px-3.5 py-3">
                    <div className="min-w-0 space-y-1 pr-1">
                      <LabelWithHint
                        htmlFor="kol-rule-created-campaign"
                        hint={CREATE_FORM_REQUIRE_LIVE_HINT}
                        hintLabel="What does this payout rule mean?"
                      >
                        {CREATE_FORM_REQUIRE_LIVE_LABEL}
                      </LabelWithHint>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        KOLs must create + deposit SOL on their own campaign to get paid here.
                      </p>
                    </div>
                    <Switch
                      id="kol-rule-created-campaign"
                      checked={requireCreatedOneCampaign}
                      onCheckedChange={setRequireCreatedOneCampaign}
                      className="shrink-0 mt-0.5"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="kol-allowlist" className="text-[13px] font-medium">
                        Allowlist handles{" "}
                        <span className="font-normal text-muted-foreground">(optional)</span>
                      </Label>
                      <InfoHint
                        content={CREATE_FORM_ALLOWLIST_HINT}
                        label="What is an allowlist?"
                      />
                    </div>
                    <Input
                      id="kol-allowlist"
                      value={allowedHandlesRaw}
                      onChange={(e) => setAllowedHandlesRaw(e.target.value)}
                      placeholder="@alice, @bob — empty = open to everyone"
                      className={fieldClass}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:gap-4 rounded-xl border border-border/40 bg-background/30 px-3.5 py-3">
                    <LabelWithHint
                      htmlFor="kol-topn"
                      hint={CREATE_FORM_TOP_N_HINT}
                      hintLabel="What is Pay top N?"
                    >
                      Pay top N only
                    </LabelWithHint>
                    <Switch
                      id="kol-topn"
                      checked={useTopN}
                      onCheckedChange={setUseTopN}
                      className="shrink-0"
                    />
                  </div>

                  {useTopN ? (
                    <div className="grid gap-3 sm:grid-cols-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                      <div className="space-y-2 min-w-0">
                        <Label htmlFor="kol-topn-n" className="text-[13px] font-medium">
                          Top N
                        </Label>
                        <Input
                          id="kol-topn-n"
                          type="number"
                          min={1}
                          max={100}
                          value={payoutTopN}
                          onChange={(e) => setPayoutTopN(e.target.value)}
                          className={cn(fieldClass, "tabular-nums")}
                        />
                      </div>
                      <div className="space-y-2 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[13px] font-medium">Pool split</Label>
                          <InfoHint
                            content={CREATE_FORM_POOL_SPLIT_HINT}
                            label="How does pool split work?"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={topNSharePreset === "100" ? "hero" : "outline"}
                            className="rounded-full w-full text-xs sm:text-sm h-10"
                            onClick={() => setTopNSharePreset("100")}
                          >
                            100% top N
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={topNSharePreset === "70" ? "hero" : "outline"}
                            className="rounded-full w-full text-xs sm:text-sm h-10"
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
                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.08] px-4 py-3.5 text-sm space-y-3 min-w-0">
                  <p className="text-muted-foreground leading-relaxed">
                    You still have an unpaid draft{" "}
                    <span className="font-medium text-foreground">
                      “{existingPending.title}”
                    </span>
                    . Fund it before creating another.
                  </p>
                  <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:flex-wrap">
                    <Button
                      variant="hero"
                      size="sm"
                      className="rounded-full w-full min-[400px]:w-auto"
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
                        className="rounded-full w-full min-[400px]:w-auto"
                        onClick={() => onOpenCampaign(existingPending.id)}
                      >
                        Open campaign
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>

            {/* CTA footer */}
            <footer className="relative border-t border-border/40 bg-muted/20 px-4 py-4 min-[400px]:px-5 sm:px-8 sm:py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed order-2 sm:order-1 max-w-md">
                  Saves a draft first. Next you’ll deposit SOL to make it live.
                </p>
                <Button
                  variant="hero"
                  size="lg"
                  className="btn-premium rounded-full w-full sm:w-auto order-1 sm:order-2 sm:min-w-[15rem] gap-2"
                  disabled={!canSubmit}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      Create campaign draft
                      <ArrowRight className="w-4 h-4 opacity-80" />
                    </>
                  )}
                </Button>
              </div>
            </footer>
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
