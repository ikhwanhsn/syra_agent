import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock, ExternalLink, Pause, Play } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { EarnTokenDetailSkeleton } from "@/components/RouteFallback";
import { InfoHint } from "@/components/earn/InfoHint";
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
  type EarnDenom,
} from "@/lib/earnYieldApi";
import {
  EARN_GLOSSARY,
  denomHelp,
  earnProductIcon,
  formatEvidenceEntries,
  fmtEarnAmount,
  humanizeAgentNote,
  readinessReasons,
  riskLevelLabel,
  summarizeTrackRecord,
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
  const minDep = product?.minDeposit ?? 1;
  const maxDep = product?.maxDeposit ?? 5;
  const feePct = product?.performanceFeePct ?? 10;
  const cap = depositCap ?? maxDep;
  const walletQ = product?.walletQuery || (denom === "SOL" ? "lp" : "invest");

  const statusQ = useQuery({
    queryKey: ["earn", "yield", "status", productId, anonymousId ?? ""],
    queryFn: () => fetchEarnYieldStatus(anonymousId, productId),
    enabled: Boolean(anonymousId && syraAuthenticated && productId && product),
    staleTime: 30_000,
  });

  const status = statusQ.data;
  const board = boardQ.data;
  const stats = product?.stats;
  const paused = product?.readiness?.depositsPaused;
  const pauseReasons = readinessReasons(product?.readiness?.blockers);
  const agentNote = humanizeAgentNote(status?.config?.lastError);
  const wallet = status?.wallet;
  const deployedSol = wallet?.deployedSol ?? 0;
  const unrealizedPnl = wallet?.unrealizedPnlSol ?? status?.summary?.unrealizedPnlSol ?? 0;
  const availableSol = wallet?.availableSol ?? wallet?.onChainBalanceSol;
  const staleNote =
    status?.enabled && wallet?.stale ? "Waiting for the next automated cycle" : null;
  const statusNote = agentNote || staleNote;
  const evidenceLines = formatEvidenceEntries(product?.evidence);
  const howItWorks = product?.howItWorks ?? [];
  const rails = product?.rails ?? [];
  const Icon = product ? earnProductIcon(product) : null;
  const trackSummary = summarizeTrackRecord(stats, denom);
  const statusLabel =
    product?.status === "coming_soon"
      ? "Coming soon"
      : product?.status === "beta"
        ? "Open"
        : product?.status?.replace("_", " ") ?? "";

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
        (data as { nextStep?: string })?.nextStep ?? "Fund your agent wallet to start.",
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

  return (
    <div className="relative flex min-h-0 flex-col">
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          "relative z-10 space-y-8 py-4 pb-10 sm:py-6 sm:pb-12",
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
          Back to earn
        </Link>

        {!productId ? (
          <EmptyState
            title="Missing strategy"
            body="This link is missing a strategy id."
          />
        ) : boardQ.isLoading ? (
          <EarnTokenDetailSkeleton />
        ) : boardQ.isError ? (
          <EmptyState
            title="Couldn't load this strategy"
            body="Something went wrong loading yield strategies. Try again from Earn."
          />
        ) : !product ? (
          <EmptyState
            title="Strategy not found"
            body="This strategy is not listed, or the link is invalid."
          />
        ) : (
          <div className="space-y-10">
            <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-10">
              <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                <div className="rounded-full bg-primary/10 p-3">
                  {Icon ? <Icon className="h-6 w-6 text-primary" aria-hidden /> : null}
                </div>
                <div className="min-w-0 space-y-2 pt-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[2.15rem]">
                      {product.label}
                    </h1>
                    <span className="rounded-full border border-border/60 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {statusLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                      {denom}
                      <InfoHint
                        label={`What is ${denom}?`}
                        text={denomHelp(denom)}
                        className="h-4 w-4"
                      />
                    </span>
                    <span className="rounded-full border border-border/40 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                      {riskLevelLabel(product.riskLevel)}
                    </span>
                  </div>
                  <p className="max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
                    {product.summary || product.description}
                  </p>
                </div>
              </div>

              <Button variant="outline" className="h-11 shrink-0 gap-2 rounded-full px-5" asChild>
                <Link to={`/wallet?wallet=${walletQ}`}>
                  Fund your wallet
                  <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                </Link>
              </Button>
            </header>

            <section className="space-y-3">
              <SectionTitle>How it works</SectionTitle>
              {howItWorks.length === 0 ? (
                <p className="text-sm text-muted-foreground">{product.description}</p>
              ) : (
                <ol className="space-y-3">
                  {howItWorks.map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border/50 text-[11px] font-semibold tabular-nums text-foreground">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <section className="space-y-3">
              <SectionTitle>The basics</SectionTitle>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Your deposit"
                  value={`${minDep}-${maxDep} ${denom}`}
                  hint="Range you can put in"
                />
                <MetricCard
                  label="Fee on profit"
                  infoLabel="How does the fee work?"
                  infoText={EARN_GLOSSARY.performanceFee}
                  value={`${feePct}%`}
                  hint="Charged only when you make a profit"
                />
                <MetricCard
                  label="Network"
                  value={product.chain || "Solana"}
                  hint={rails.length > 0 ? rails.join(", ") : "Runs on-chain"}
                />
                <MetricCard
                  label="Status"
                  value={statusLabel}
                  hint={product.actionable ? "Ready to start" : "Not open yet"}
                />
              </div>
              {rails.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {rails.map((rail) => (
                    <span
                      key={rail}
                      className="rounded-full border border-border/45 px-2.5 py-1 text-[11px] text-muted-foreground"
                    >
                      {rail}
                    </span>
                  ))}
                </div>
              ) : null}
            </section>

            {status?.enabled && status.summary ? (
              <section className="space-y-3">
                <SectionTitle>Your wallet</SectionTitle>
                <p className="text-xs text-muted-foreground">
                  Live capital on your agent wallet, plus locked-in results since you started.
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard
                    label="Currently invested"
                    value={fmtEarnAmount(deployedSol, denom)}
                    hint="In open positions"
                    positive={deployedSol > 0}
                  />
                  <MetricCard
                    label="Open profit / loss"
                    infoLabel="What is open profit or loss?"
                    infoText={EARN_GLOSSARY.unrealized}
                    value={fmtEarnAmount(unrealizedPnl, denom)}
                    hint="Can still change"
                    positive={unrealizedPnl > 0}
                  />
                  <MetricCard
                    label="Open positions"
                    value={String(status.summary.openCount ?? 0)}
                    hint="Active on your agent"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <MetricCard
                    label="Your win rate"
                    infoLabel="What is your win rate?"
                    infoText={EARN_GLOSSARY.winRate}
                    value={
                      status.summary.winRatePct != null
                        ? `${status.summary.winRatePct.toFixed(1)}%`
                        : `${status.summary.wins ?? 0} wins / ${status.summary.losses ?? 0} losses`
                    }
                    hint={`${status.summary.wins ?? 0} wins / ${status.summary.losses ?? 0} losses this session`}
                  />
                  <MetricCard
                    label="Your profit / loss"
                    infoLabel="What is your profit or loss?"
                    infoText={EARN_GLOSSARY.realized}
                    value={fmtEarnAmount(
                      status.summary.netPnl ??
                        status.summary.realizedNetPnlSol ??
                        status.summary.netPnlUsd,
                      denom,
                    )}
                    hint="Locked in from closed trades"
                    positive={
                      (status.summary.netPnl ??
                        status.summary.realizedNetPnlSol ??
                        status.summary.netPnlUsd ??
                        0) > 0
                    }
                  />
                  <MetricCard
                    label="Available in wallet"
                    value={availableSol != null ? fmtEarnAmount(availableSol, denom) : "-"}
                    hint="Ready to invest or withdraw"
                  />
                </div>
              </section>
            ) : null}

            <section className="space-y-3">
              <div className="flex items-center gap-1.5">
                <SectionTitle>Track record (all Syra users)</SectionTitle>
                <InfoHint
                  label="What does this track record mean?"
                  text={EARN_GLOSSARY.trackRecord}
                />
              </div>
              <p className="text-sm leading-relaxed text-foreground">{trackSummary}</p>
              <p className="text-xs text-muted-foreground">
                These numbers cover everyone using this strategy on Syra, not your personal deposit.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard
                  label={stats?.winRatePct != null ? "Win rate" : "Return"}
                  infoLabel="What does win rate mean?"
                  infoText={EARN_GLOSSARY.winRate}
                  value={
                    stats?.winRatePct != null
                      ? `${stats.winRatePct.toFixed(1)}%`
                      : stats?.returnPct != null
                        ? `${stats.returnPct.toFixed(1)}%`
                        : "-"
                  }
                  hint={
                    stats?.wins != null || stats?.losses != null
                      ? `${stats?.wins ?? 0} wins / ${stats?.losses ?? 0} losses · all Syra users`
                      : stats?.paperVsRealNote
                  }
                />
                <MetricCard
                  label="Net profit / loss"
                  infoLabel="What is net profit or loss?"
                  infoText={EARN_GLOSSARY.profitLoss}
                  value={fmtEarnAmount(stats?.netPnl ?? stats?.netPnlUsd, denom)}
                  hint="Across all Syra users"
                  positive={(stats?.netPnl ?? stats?.netPnlUsd ?? 0) > 0}
                />
                <MetricCard
                  label="Open / errors"
                  value={`${stats?.openCount ?? 0} / ${(stats?.errorRatePct ?? 0).toFixed(0)}%`}
                  hint="Platform aggregate"
                />
              </div>
              {evidenceLines.length > 0 ? (
                <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-muted-foreground">
                  {evidenceLines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : null}
            </section>

            {(paused || pauseReasons.length > 0) && (
              <section className="space-y-3">
                <SectionTitle>Why deposits may be closed</SectionTitle>
                <div className="rounded-lg border border-border/45 bg-muted/15 px-3.5 py-3">
                  <div className="flex items-start gap-2.5">
                    <Clock
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-sm font-medium text-foreground">
                        {product.status === "coming_soon"
                          ? "Not open for deposits yet"
                          : "Deposits are paused for now"}
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {product.status === "coming_soon"
                          ? "This strategy is still proving itself. Funding unlocks after it clears the safety checks below."
                          : "New deposits are on hold until the strategy clears the safety checks below."}
                      </p>
                      {pauseReasons.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Still being proven before it opens.
                        </p>
                      ) : (
                        <ul className="list-disc space-y-0.5 pl-4 text-xs leading-relaxed text-muted-foreground">
                          {pauseReasons.map((reason) => (
                            <li key={reason}>{reason}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {product.disclosures && product.disclosures.length > 0 ? (
              <section className="space-y-3">
                <SectionTitle>Risks & disclosures</SectionTitle>
                <div className="rounded-lg border border-border/40 bg-muted/10 p-4">
                  <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-muted-foreground">
                    {product.disclosures.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : null}

            <section className={cn(overviewCardShell, "space-y-4 p-5")}>
              <SectionTitle>Start earning</SectionTitle>
              <p className="text-xs text-muted-foreground">
                You deposit: {minDep} to {maxDep} {denom}. Fee: {feePct}%, only on profit.
              </p>
              {!connected ? (
                <p className="text-sm text-muted-foreground">Connect your wallet to get started.</p>
              ) : !syraAuthReady ? (
                <p className="text-sm text-muted-foreground">Checking your session…</p>
              ) : !syraAuthenticated ? (
                <Button size="sm" className="min-h-10" onClick={() => void requestSyraAuth()}>
                  Sign in to continue
                </Button>
              ) : status?.enabled ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                    <Play className="h-3.5 w-3.5" aria-hidden /> Active
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-10"
                    disabled={disableM.isPending}
                    onClick={() => disableM.mutate(false)}
                  >
                    <Pause className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                    Pause
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="min-h-10"
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
              ) : (
                <div className="flex flex-wrap items-end gap-3">
                  <label className="space-y-1 text-xs text-muted-foreground">
                    How much to deposit (max, {denom})
                    <input
                      type="number"
                      min={minDep}
                      max={maxDep}
                      step={denom === "SOL" ? 0.5 : 5}
                      value={cap}
                      onChange={(e) => setDepositCap(Number(e.target.value))}
                      className="block h-10 w-32 rounded-md border border-border/60 bg-background px-2 text-sm text-foreground"
                      disabled={!product.actionable}
                      aria-label={`Maximum deposit in ${denom}`}
                    />
                  </label>
                  <Button
                    size="sm"
                    className="min-h-10"
                    disabled={
                      enableM.isPending ||
                      !board?.beta.allowed ||
                      !product.actionable ||
                      Boolean(paused)
                    }
                    onClick={() => enableM.mutate(cap)}
                  >
                    Start earning
                  </Button>
                  {!board?.beta.allowed && (
                    <span className="text-xs text-muted-foreground">Not open to you yet.</span>
                  )}
                  {product.status !== "beta" && !paused && (
                    <span className="text-xs text-muted-foreground">
                      Still being proven before it opens.
                    </span>
                  )}
                </div>
              )}
              {statusNote && !paused ? (
                <p className="text-xs text-muted-foreground">Note: {statusNote}</p>
              ) : null}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {children}
    </h2>
  );
}

function MetricCard({
  label,
  value,
  hint,
  positive,
  infoLabel,
  infoText,
}: {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
  infoLabel?: string;
  infoText?: string;
}) {
  return (
    <div className={cn(overviewCardShell, "p-4")}>
      <div className="flex items-center gap-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {infoLabel && infoText ? <InfoHint label={infoLabel} text={infoText} /> : null}
      </div>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums capitalize",
          positive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[1.35rem] border border-border/40 bg-card/30 px-6 py-20 text-center">
      <p className="font-display text-lg font-semibold tracking-tight">{title}</p>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      <Button asChild className="mt-6 rounded-full" variant="outline">
        <Link to="/earn?track=yield">Back to earn</Link>
      </Button>
    </div>
  );
}
