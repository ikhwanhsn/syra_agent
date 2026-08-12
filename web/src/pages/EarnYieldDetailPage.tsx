import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, ExternalLink, Lock, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EarnYieldDetailSkeleton } from "@/components/earn/EarnSkeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";
import {
  disableEarnYield,
  enableEarnYield,
  fetchEarnYieldBoard,
  fetchEarnYieldStatus,
  updateEarnYieldDeposit,
  type EarnDenom,
} from "@/lib/earnYieldApi";
import {
  earnProductIcon,
  fmtEarnAmount,
  fmtEarnBalance,
  humanizeAgentNote,
  readinessReasons,
  resolveFlatInvestStatus,
  riskLevelLabel,
} from "@/lib/earnYieldUi";
import { DASHBOARD_CONTENT_SHELL } from "@/lib/layoutConstants";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

export default function EarnYieldDetailPage() {
  const { productId: productIdParam } = useParams<{ productId: string }>();
  const productId = productIdParam ? decodeURIComponent(productIdParam).trim() : "";
  const { address, connected } = useWalletContext();
  const { anonymousId } = useAgentWallet();
  const { syraAuthReady, syraAuthenticated, ensureSyraAuth, requestSyraAuth } = useSyraAuth();
  const queryClient = useQueryClient();
  const [depositCap, setDepositCap] = useState<number | null>(null);

  useEffect(() => {
    if (!syraAuthReady || !connected || !address) return;
    void ensureSyraAuth();
  }, [syraAuthReady, connected, address, ensureSyraAuth]);

  const boardQ = useQuery({
    queryKey: ["earn", "yield", "board", address ?? ""],
    queryFn: () => fetchEarnYieldBoard(address),
    staleTime: 60_000,
  });

  const product = boardQ.data?.products.find((p) => p.id === productId);
  const denom = (product?.denom || "SOL") as EarnDenom;
  const minDep = product?.minDeposit ?? 0.25;
  const maxDep = product?.maxDeposit ?? 5;
  const feePct = product?.performanceFeePct ?? 10;
  const defaultDeposit = Math.round(((minDep + maxDep) / 2) * 2) / 2;
  const walletQ = product?.walletQuery || (denom === "SOL" ? "earn" : "invest");

  const statusQ = useQuery({
    queryKey: ["earn", "yield", "status", productId, anonymousId ?? ""],
    queryFn: () => fetchEarnYieldStatus(anonymousId, productId),
    enabled: Boolean(anonymousId && syraAuthenticated && productId && product),
    staleTime: 30_000,
  });

  const status = statusQ.data;
  const board = boardQ.data;
  const paused = product?.readiness?.depositsPaused;
  const pauseReasons = readinessReasons(product?.readiness?.blockers);
  const agentNote = humanizeAgentNote(status?.config?.lastError);
  const wallet = status?.wallet;
  const deployedSol = wallet?.deployedSol ?? 0;
  const waitingSol =
    wallet?.availableSol ?? (wallet?.onChainBalanceSol != null ? wallet.onChainBalanceSol : null);
  const walletTotalSol =
    wallet?.walletTotalSol ??
    (wallet != null ? deployedSol + (wallet.onChainBalanceSol ?? 0) : null);
  const strategyDepositSol =
    wallet?.strategyDepositSol ??
    status?.config?.earnDepositSol ??
    status?.config?.publicMaxDepositSol ??
    null;
  const cap =
    depositCap ??
    (strategyDepositSol != null && strategyDepositSol > 0 ? strategyDepositSol : defaultDeposit);
  const unrealizedPnl = wallet?.unrealizedPnlSol ?? status?.summary?.unrealizedPnlSol ?? 0;
  const realizedPnl =
    status?.summary?.netPnl ??
    status?.summary?.realizedNetPnlSol ??
    status?.summary?.netPnlUsd ??
    0;
  const fundingGap =
    strategyDepositSol != null &&
    walletTotalSol != null &&
    strategyDepositSol > walletTotalSol + 1e-9
      ? strategyDepositSol - walletTotalSol
      : 0;
  const flatInvest = resolveFlatInvestStatus({
    deployedSol,
    waitingSol,
    strategyDepositSol,
    canOpenNewPositions: wallet?.canOpenNewPositions,
    lastError: status?.config?.lastError,
    lossPausedAt: status?.config?.lossPausedAt,
    depositsPaused: status?.config?.depositsPaused,
    stale: Boolean(wallet?.stale),
  });
  const statusNote =
    agentNote ||
    (status?.enabled && wallet?.stale ? "Waiting for the next cycle" : null) ||
    (flatInvest.badge === "needs_funding" || flatInvest.badge === "paused_after_losses"
      ? flatInvest.message
      : null) ||
    (fundingGap > 0 && deployedSol <= 0
      ? `Fund ${fmtEarnBalance(fundingGap, denom)} more to match your deposit`
      : null) ||
    (deployedSol <= 0 && flatInvest.message ? flatInvest.message : null);
  const Icon = product ? earnProductIcon(product) : null;
  const isComingSoon = product?.status === "coming_soon" || product?.status === "lab";

  const enableM = useMutation({
    mutationFn: async (maxDeposit: number) => {
      if (!syraAuthenticated) {
        const session = await requestSyraAuth();
        if (!session) throw new Error("Sign in required");
      }
      return enableEarnYield(maxDeposit, productId);
    },
    onSuccess: (data) => {
      notify.success(
        `${product?.label ?? "Strategy"} started`,
        (data as { nextStep?: string })?.nextStep ?? "Fund your Earn wallet to start.",
      );
      void queryClient.invalidateQueries({ queryKey: ["earn", "yield"] });
    },
    onError: (e: Error) => {
      notify.error("Could not start this strategy", e.message);
    },
  });

  const disableM = useMutation({
    mutationFn: (closeAll: boolean) => disableEarnYield(closeAll, productId),
    onSuccess: () => {
      notify.success(`${product?.label ?? "Strategy"} stopped`);
      void queryClient.invalidateQueries({ queryKey: ["earn", "yield"] });
    },
    onError: (e: Error) => {
      notify.error("Could not stop this strategy", e.message);
    },
  });

  const updateDepositM = useMutation({
    mutationFn: (deposit: number) => updateEarnYieldDeposit(deposit, productId),
    onSuccess: () => {
      notify.success("Deposit updated");
      void queryClient.invalidateQueries({ queryKey: ["earn", "yield"] });
    },
    onError: (e: Error) => {
      notify.error("Could not update deposit", e.message);
    },
  });

  return (
    <div className="relative flex min-h-0 flex-col">
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "relative z-10 space-y-6 py-4 pb-10 sm:py-6 sm:pb-12",
        )}
      >
        <Link
          to="/earn?track=yield"
          className={cn(
            "inline-flex w-fit items-center gap-2 rounded-full px-1 py-1.5 text-[13px] font-medium text-muted-foreground",
            "transition-colors hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </Link>

        {!productId ? (
          <EmptyState title="Missing strategy" body="This link is missing a strategy id." />
        ) : boardQ.isLoading ? (
          <EarnYieldDetailSkeleton />
        ) : boardQ.isError ? (
          <EmptyState
            title="Couldn't load this strategy"
            body="Try again from Earn."
          />
        ) : !product ? (
          <EmptyState
            title="Strategy not found"
            body="This strategy is not listed, or the link is invalid."
          />
        ) : (
          <div className="space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2.5">
                  {Icon ? <Icon className="h-5 w-5 text-primary" aria-hidden /> : null}
                </div>
                <div className="min-w-0 space-y-1">
                  <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    {product.label}
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {status?.enabled ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        <Play className="h-3 w-3" aria-hidden />
                        Active
                      </span>
                    ) : isComingSoon ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                        <Lock className="h-3 w-3" aria-hidden />
                        Coming soon
                      </span>
                    ) : null}
                    <span className="rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {denom}
                    </span>
                    <span className="rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                      {riskLevelLabel(product.riskLevel)}
                    </span>
                    <span className="rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                      Fee {feePct}% on profit
                    </span>
                  </div>
                </div>
              </div>
              {!isComingSoon ? (
                <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5" asChild>
                  <Link to={`/wallet?wallet=${walletQ}`}>
                    Wallet
                    <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                  </Link>
                </Button>
              ) : null}
            </header>

            {isComingSoon ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/45 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
                <Lock className="h-4 w-4 shrink-0" aria-hidden />
                Not open for deposits yet
              </div>
            ) : null}

            {!isComingSoon && (paused || pauseReasons.length > 0) ? (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
                <div className="min-w-0 space-y-1">
                  <p className="font-medium text-foreground">Deposits paused</p>
                  {pauseReasons.length > 0 ? (
                    <p className="text-xs text-muted-foreground">{pauseReasons.join(" · ")}</p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {status?.enabled && status.summary ? (
              <section className="space-y-3">
                <div
                  className={cn(
                    overviewCardShell,
                    "grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:gap-5 sm:p-5",
                  )}
                >
                  <Stat label="Deposit" value={fmtEarnBalance(strategyDepositSol, denom)} />
                  <Stat label="Wallet" value={fmtEarnBalance(walletTotalSol, denom)} />
                  <Stat
                    label="In positions"
                    value={fmtEarnBalance(deployedSol, denom)}
                    positive={deployedSol > 0}
                  />
                  <Stat
                    label="PnL"
                    value={fmtEarnAmount(
                      deployedSol > 0 ? unrealizedPnl : realizedPnl,
                      denom,
                    )}
                    positive={(deployedSol > 0 ? unrealizedPnl : realizedPnl) > 0}
                  />
                </div>

                {statusNote ? (
                  <div className="flex flex-wrap items-center gap-2 px-0.5">
                    {flatInvest.badge && flatInvest.badgeLabel ? (
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                          flatInvest.badge === "paused_after_losses"
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : flatInvest.badge === "needs_funding"
                              ? "border-amber-500/40 bg-amber-500/15 text-amber-900 dark:text-amber-200"
                              : "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
                        )}
                      >
                        <Clock className="h-3 w-3" aria-hidden />
                        {flatInvest.badgeLabel}
                      </span>
                    ) : null}
                    <p className="text-sm text-muted-foreground">{statusNote}</p>
                  </div>
                ) : deployedSol > 0 ? (
                  <p className="px-0.5 text-sm text-muted-foreground">
                    {fmtEarnBalance(deployedSol, denom)} deployed
                    {waitingSol != null && waitingSol > 0
                      ? ` · ${fmtEarnBalance(waitingSol, denom)} waiting`
                      : null}
                  </p>
                ) : null}
              </section>
            ) : null}

            <section className={cn(overviewCardShell, "space-y-4 p-4 sm:p-5")}>
              {isComingSoon ? (
                <p className="text-sm text-muted-foreground">Deposits unlock after safety checks.</p>
              ) : !connected ? (
                <p className="text-sm text-muted-foreground">Connect your wallet to continue.</p>
              ) : !syraAuthReady ? (
                <p className="text-sm text-muted-foreground">Checking session…</p>
              ) : !syraAuthenticated ? (
                <Button className="min-h-11" onClick={() => void requestSyraAuth()}>
                  Sign in
                </Button>
              ) : status?.enabled ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                    <label className="space-y-1.5 text-sm text-muted-foreground">
                      Deposit ({denom})
                      <input
                        type="number"
                        min={minDep}
                        max={maxDep}
                        step={denom === "SOL" ? 0.25 : 5}
                        value={cap}
                        onChange={(e) => setDepositCap(Number(e.target.value))}
                        className="block h-11 w-full rounded-md border border-border/60 bg-background px-3 text-sm text-foreground sm:w-36"
                        aria-label={`Deposit in ${denom}`}
                      />
                    </label>
                    <Button
                      variant="outline"
                      className="min-h-11"
                      disabled={
                        updateDepositM.isPending ||
                        !Number.isFinite(cap) ||
                        cap < minDep ||
                        cap > maxDep ||
                        (strategyDepositSol != null && Math.abs(cap - strategyDepositSol) < 1e-9)
                      }
                      onClick={() => updateDepositM.mutate(cap)}
                    >
                      Update
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      className="min-h-11"
                      disabled={disableM.isPending}
                      onClick={() => disableM.mutate(false)}
                    >
                      <Pause className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      Pause
                    </Button>
                    <Button
                      variant="destructive"
                      className="min-h-11"
                      disabled={disableM.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Stop ${product.label} and close open positions? This may lock in losses.`,
                          )
                        ) {
                          disableM.mutate(true);
                        }
                      }}
                    >
                      Stop & close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <label className="space-y-1.5 text-sm text-muted-foreground">
                    Deposit ({denom})
                    <input
                      type="number"
                      min={minDep}
                      max={maxDep}
                      step={denom === "SOL" ? 0.25 : 5}
                      value={cap}
                      onChange={(e) => setDepositCap(Number(e.target.value))}
                      className="block h-11 w-full rounded-md border border-border/60 bg-background px-3 text-sm text-foreground sm:w-36"
                      disabled={!product.actionable}
                      aria-label={`Deposit in ${denom}`}
                    />
                  </label>
                  <Button
                    className="min-h-11"
                    disabled={
                      enableM.isPending ||
                      !board?.beta.allowed ||
                      !product.actionable ||
                      Boolean(paused)
                    }
                    onClick={() => enableM.mutate(cap)}
                  >
                    Start
                  </Button>
                  {!board?.beta.allowed ? (
                    <span className="text-xs text-muted-foreground">Not open to you yet</span>
                  ) : null}
                  {paused ? (
                    <span className="text-xs text-muted-foreground">Deposits paused</span>
                  ) : null}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-lg font-semibold tabular-nums sm:text-xl",
          positive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-border/40 bg-card/30 px-6 py-20 text-center">
      <p className="text-lg font-semibold tracking-tight">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-6" variant="outline">
        <Link to="/earn?track=yield">Back to earn</Link>
      </Button>
    </div>
  );
}
