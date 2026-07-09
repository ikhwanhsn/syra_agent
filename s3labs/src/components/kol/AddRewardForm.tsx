import { useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Coins,
  Loader2,
  Sparkles,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  confirmCampaignTopUp,
  createCampaignTopUp,
  DEFAULT_KOL_CONFIG,
  type KolCampaign,
  type KolCampaignTopUp,
} from "@/lib/kolApi";
import { formatSol } from "@/lib/kolFormat";
import { sendCampaignDeposit } from "@/lib/solanaKol";
import { cn } from "@/lib/utils";

interface AddRewardFormProps {
  campaign: KolCampaign;
  currentPoolSol: number;
  platformFeeSol?: number;
  minTopUpKolRewardSol?: number;
  onAdded?: () => void;
}

const QUICK_AMOUNTS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2, 5] as const;

function StepPill({ step, label, active, done }: { step: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
          done && "bg-emerald-500 text-emerald-950",
          active && !done && "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40",
          !active && !done && "bg-muted/60 text-muted-foreground",
        )}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : step}
      </span>
      <span
        className={cn(
          "text-xs font-medium truncate",
          active || done ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function AddRewardForm({
  campaign,
  currentPoolSol,
  platformFeeSol = DEFAULT_KOL_CONFIG.platformFeeSol,
  minTopUpKolRewardSol = DEFAULT_KOL_CONFIG.minTopUpKolRewardSol ?? 0.01,
  onAdded,
}: AddRewardFormProps) {
  const wallet = useWallet();
  const [kolRewardSol, setKolRewardSol] = useState(String(minTopUpKolRewardSol));
  const [pendingTopUp, setPendingTopUp] = useState<KolCampaignTopUp | null>(null);
  const [depositInfo, setDepositInfo] = useState<{
    poolWalletAddress: string;
    rewardLamports: number;
  } | null>(null);

  const kolRewardNum = Number(kolRewardSol);
  const totalDepositSol =
    Number.isFinite(kolRewardNum) && kolRewardNum > 0 ? kolRewardNum + platformFeeSol : 0;
  const newPoolSol =
    Number.isFinite(kolRewardNum) && kolRewardNum > 0 ? currentPoolSol + kolRewardNum : currentPoolSol;
  const poolBoostPct =
    currentPoolSol > 0 && Number.isFinite(kolRewardNum) && kolRewardNum > 0
      ? (kolRewardNum / currentPoolSol) * 100
      : null;

  const quickPresets = useMemo(
    () => QUICK_AMOUNTS.filter((amount) => amount >= minTopUpKolRewardSol),
    [minTopUpKolRewardSol],
  );

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.publicKey) throw new Error("Connect your Solana wallet first");
      if (!Number.isFinite(kolRewardNum) || kolRewardNum < minTopUpKolRewardSol) {
        throw new Error(`Minimum top-up is ${minTopUpKolRewardSol} SOL`);
      }

      return createCampaignTopUp(campaign.id, {
        projectWallet: wallet.publicKey.toBase58(),
        kolRewardSol: kolRewardNum,
      });
    },
    onSuccess: (data) => {
      setPendingTopUp(data.topUp);
      setDepositInfo(data.deposit);
      toast.message("Top-up prepared", {
        description: "Approve the SOL deposit in your wallet to boost the reward pool.",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!wallet.publicKey) throw new Error("Connect your Solana wallet first");
      if (!pendingTopUp || !depositInfo) throw new Error("Prepare the top-up first");

      const signature = await sendCampaignDeposit({
        wallet,
        poolWalletAddress: depositInfo.poolWalletAddress,
        lamports: depositInfo.rewardLamports,
      });

      return confirmCampaignTopUp(campaign.id, pendingTopUp.id, {
        txSignature: signature,
        projectWallet: wallet.publicKey.toBase58(),
      });
    },
    onSuccess: () => {
      setPendingTopUp(null);
      setDepositInfo(null);
      setKolRewardSol(String(minTopUpKolRewardSol));
      toast.success("Reward pool increased", {
        description: "KOL projections will update with the new pool size.",
      });
      onAdded?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isBusy = createMutation.isPending || depositMutation.isPending;
  const awaitingDeposit = Boolean(pendingTopUp && depositInfo);
  const rewardValid = Number.isFinite(kolRewardNum) && kolRewardNum >= minTopUpKolRewardSol;
  const isCreator = wallet.publicKey?.toBase58() === campaign.projectWallet;
  const campaignEnded = campaign.endAt ? new Date(campaign.endAt) <= new Date() : false;

  if (!isCreator || campaign.status !== "active" || campaignEnded) {
    return null;
  }

  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-500/25 min-w-0 shadow-[var(--shadow-card)]">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 0% 0%, hsl(160 84% 39% / 0.12), transparent 55%), radial-gradient(ellipse 60% 50% at 100% 100%, hsl(var(--primary) / 0.08), transparent 50%)",
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-[0.04]" aria-hidden />

      <div className="relative p-5 sm:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/25 to-emerald-600/10 border border-emerald-500/30 shadow-[0_0_24px_rgba(52,211,153,0.15)]">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <p className="eyebrow">Creator tools</p>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                  <Sparkles className="h-3 w-3" aria-hidden />
                  Live boost
                </span>
              </div>
              <h3 className="font-semibold text-xl sm:text-2xl tracking-tight">
                Boost the <span className="text-gradient">reward pool</span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed max-w-lg">
                Add SOL while the campaign runs. Every lamport you enter goes straight to KOLs — only a flat{" "}
                {platformFeeSol} SOL platform fee on top.
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 rounded-xl border border-border/50 bg-background/40 backdrop-blur-sm px-4 py-3">
            <StepPill step={1} label="Prepare" active={!awaitingDeposit} done={awaitingDeposit} />
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" aria-hidden />
            <StepPill step={2} label="Confirm" active={awaitingDeposit} done={false} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,17rem)] lg:gap-8">
          {/* Input column */}
          <div className="space-y-5 min-w-0">
            <div className="space-y-3">
              <Label htmlFor="topup-reward" className="text-sm font-medium">
                Additional KOL reward
              </Label>

              {/* Quick presets */}
              <div className="flex flex-wrap gap-2">
                {quickPresets.map((amount) => {
                  const selected = kolRewardSol === String(amount);
                  return (
                    <button
                      key={amount}
                      type="button"
                      disabled={awaitingDeposit || isBusy}
                      onClick={() => setKolRewardSol(String(amount))}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-xs font-semibold tabular-nums transition-all duration-200",
                        selected
                          ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-300 shadow-[0_0_16px_rgba(52,211,153,0.12)]"
                          : "border-border/60 bg-background/50 text-muted-foreground hover:border-emerald-500/30 hover:text-foreground hover:bg-emerald-500/5",
                        (awaitingDeposit || isBusy) && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {amount} SOL
                    </button>
                  );
                })}
              </div>

              {/* Amount input */}
              <div className="relative">
                <Input
                  id="topup-reward"
                  type="number"
                  min={minTopUpKolRewardSol}
                  step="0.01"
                  value={kolRewardSol}
                  onChange={(e) => setKolRewardSol(e.target.value)}
                  disabled={awaitingDeposit || isBusy}
                  className={cn(
                    "h-14 sm:h-16 text-2xl sm:text-3xl font-semibold tabular-nums pl-4 pr-16",
                    "bg-background/70 border-border/60 backdrop-blur-sm",
                    "focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/40",
                  )}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-muted/60 px-2 py-1 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  SOL
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Minimum {minTopUpKolRewardSol} SOL per top-up
              </p>
            </div>

            {/* Fee breakdown */}
            <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border/40 bg-muted/20">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Deposit breakdown
                </p>
              </div>
              <div className="divide-y divide-border/40 text-sm">
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Coins className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden />
                    KOL reward
                  </span>
                  <span className="font-mono font-medium tabular-nums text-foreground">
                    {rewardValid ? kolRewardNum.toFixed(3) : "—"} SOL
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-muted-foreground">Platform fee</span>
                  <span className="font-mono tabular-nums text-muted-foreground">
                    {platformFeeSol.toFixed(2)} SOL
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 px-4 py-3 bg-emerald-500/[0.06]">
                  <span className="font-medium text-foreground">Total deposit</span>
                  <span className="font-mono font-semibold tabular-nums text-emerald-400">
                    {rewardValid ? totalDepositSol.toFixed(3) : "—"} SOL
                  </span>
                </div>
              </div>
            </div>

            {!wallet.publicKey ? (
              <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
                <Wallet className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden />
                <p className="text-muted-foreground">
                  <span className="text-foreground font-medium">Connect your wallet</span> from the
                  navbar to boost this campaign.
                </p>
              </div>
            ) : null}

            {awaitingDeposit ? (
              <div className="rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-500/10 to-transparent p-4 space-y-2">
                <p className="font-semibold text-amber-300 flex items-center gap-2">
                  <Wallet className="h-4 w-4 shrink-0" aria-hidden />
                  Approve in your wallet
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sign the transaction to deposit{" "}
                  <span className="font-mono font-medium text-foreground tabular-nums">
                    {totalDepositSol.toFixed(3)} SOL
                  </span>{" "}
                  and add{" "}
                  <span className="font-mono font-medium text-emerald-400 tabular-nums">
                    {kolRewardNum.toFixed(3)} SOL
                  </span>{" "}
                  to the KOL pool.
                </p>
              </div>
            ) : null}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap pt-1">
              {!awaitingDeposit ? (
                <Button
                  variant="hero"
                  size="lg"
                  className="rounded-full w-full sm:w-auto shadow-[0_0_28px_rgba(52,211,153,0.2)]"
                  disabled={!wallet.publicKey || isBusy || !rewardValid}
                  onClick={() => createMutation.mutate()}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      Preparing top-up…
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" aria-hidden />
                      Boost reward pool
                    </>
                  )}
                </Button>
              ) : (
                <>
                  <Button
                    variant="hero"
                    size="lg"
                    className="rounded-full w-full sm:w-auto"
                    disabled={!wallet.publicKey || isBusy}
                    onClick={() => depositMutation.mutate()}
                  >
                    {depositMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                        Waiting for wallet…
                      </>
                    ) : (
                      <>
                        <Wallet className="w-4 h-4" aria-hidden />
                        Confirm in wallet
                      </>
                    )}
                  </Button>
                  <Button
                    variant="heroOutline"
                    size="lg"
                    className="rounded-full w-full sm:w-auto"
                    disabled={isBusy}
                    onClick={() => {
                      setPendingTopUp(null);
                      setDepositInfo(null);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Pool preview column */}
          <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.08] via-background/40 to-primary/[0.04] p-5 flex flex-col justify-between gap-5 lg:min-h-[16rem]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400/80 mb-4">
                Pool impact
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current pool</p>
                  <p className="text-2xl font-semibold tabular-nums tracking-tight">
                    {formatSol(currentPoolSol)}{" "}
                    <span className="text-sm font-medium text-muted-foreground">SOL</span>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-emerald-400/70">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
                </div>

                <div>
                  <p className="text-xs text-emerald-400/80 mb-1">After top-up</p>
                  <p className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight text-emerald-400">
                    {formatSol(newPoolSol)}
                    <span className="text-base font-semibold text-emerald-400/70 ml-1">SOL</span>
                  </p>
                </div>
              </div>
            </div>

            {poolBoostPct != null && rewardValid ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Pool increase</span>
                  <span className="inline-flex items-center gap-1 text-sm font-bold tabular-nums text-emerald-300">
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden />+{poolBoostPct.toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 rounded-full bg-emerald-950/30 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300 transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, poolBoostPct)}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Enter an amount to see how much the pool grows for KOLs competing on this campaign.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

