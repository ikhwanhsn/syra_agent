import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Clock, ExternalLink, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { EarnPanelHeader } from "@/components/earn/EarnPanelHeader";
import { EarnYieldPanelSkeleton } from "@/components/earn/EarnSkeleton";
import { InfoHint } from "@/components/earn/InfoHint";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  disableEarnYield,
  enableEarnYield,
  fetchEarnYieldBoard,
  fetchEarnYieldStatus,
  type EarnDenom,
  type EarnYieldUserStatus,
} from "@/lib/earnYieldApi";
import {
  EARN_GLOSSARY,
  denomHelp,
  earnProductIcon,
  fmtEarnAmount,
  fmtEarnUsd,
  humanizeAgentNote,
  readinessReasons,
  riskLevelLabel,
  summarizeTrackRecord,
} from "@/lib/earnYieldUi";
import { notify } from "@/lib/notify";
import { cn } from "@/lib/utils";

type EarnYieldPanelProps = {
  anonymousId: string | null | undefined;
  walletAddress: string | null | undefined;
  connected: boolean;
  syraAuthenticated: boolean;
  syraAuthReady: boolean;
  onSignIn: () => void;
  onRequestAuth: () => Promise<boolean>;
};

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: "Choose a strategy",
    body: "Pick one that matches how much risk you are comfortable with.",
  },
  {
    step: 2,
    title: "Deposit into your wallet",
    body: "You fund your own agent wallet. Syra never holds your keys.",
  },
  {
    step: 3,
    title: "Syra invests for you",
    body: "The strategy runs automatically. You can pause or stop anytime.",
  },
] as const;

export function EarnYieldPanel({
  anonymousId,
  walletAddress,
  connected,
  syraAuthenticated,
  syraAuthReady,
  onSignIn,
  onRequestAuth,
}: EarnYieldPanelProps) {
  const queryClient = useQueryClient();
  const [depositCaps, setDepositCaps] = useState<Record<string, number>>({});
  const [detailsOpen, setDetailsOpen] = useState<Record<string, boolean>>({});

  const boardQ = useQuery({
    queryKey: ["earn", "yield", "board", walletAddress ?? ""],
    queryFn: () => fetchEarnYieldBoard(walletAddress),
    staleTime: 60_000,
  });

  const products = boardQ.data?.products ?? [];

  const statusQueries = useQueries({
    queries: products.map((p) => ({
      queryKey: ["earn", "yield", "status", p.id, anonymousId ?? ""],
      queryFn: () => fetchEarnYieldStatus(anonymousId, p.id),
      enabled: Boolean(anonymousId && syraAuthenticated && p.id),
      staleTime: 15_000,
    })),
  });

  const statusByProduct = useMemo(() => {
    const map = new Map<string, EarnYieldUserStatus>();
    products.forEach((p, i) => {
      const data = statusQueries[i]?.data;
      if (data) map.set(p.id, data);
    });
    return map;
  }, [products, statusQueries]);

  const enableM = useMutation({
    mutationFn: async ({ productId, maxDeposit }: { productId: string; maxDeposit: number }) => {
      if (!syraAuthenticated) {
        const ok = await onRequestAuth();
        if (!ok) throw new Error("Sign in required");
      }
      return enableEarnYield(maxDeposit, productId);
    },
    onSuccess: (data, vars) => {
      const label = products.find((p) => p.id === vars.productId)?.label ?? "Strategy";
      notify.success(
        `${label} started`,
        (data as { nextStep?: string })?.nextStep ?? "Fund your agent wallet to start.",
      );
      void queryClient.invalidateQueries({ queryKey: ["earn", "yield"] });
    },
    onError: (e: Error) => {
      notify.error("Could not start this strategy", e.message);
    },
  });

  const disableM = useMutation({
    mutationFn: ({ productId, closeAll }: { productId: string; closeAll: boolean }) =>
      disableEarnYield(closeAll, productId),
    onSuccess: (_data, vars) => {
      const label = products.find((p) => p.id === vars.productId)?.label ?? "Strategy";
      notify.success(`${label} stopped`);
      void queryClient.invalidateQueries({ queryKey: ["earn", "yield"] });
    },
    onError: (e: Error) => {
      notify.error("Could not stop this strategy", e.message);
    },
  });

  const board = boardQ.data;
  const flagship = products.find((p) => p.id === "lp_meteora_dlmm");
  const flagshipStats = flagship?.stats ?? board?.platformStats;

  return (
    <div className="space-y-6">
      <EarnPanelHeader
        title="Earn on your crypto"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/wallet?wallet=lp">
              Your wallets
              <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-70" />
            </Link>
          </Button>
        }
      />

      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Pick a strategy, deposit into your own wallet, and Syra runs it for you. You stay in
        control and can stop anytime. Past results are not a guarantee.
      </p>

      <HowItWorksStrip />

      {boardQ.isLoading ? (
        <EarnYieldPanelSkeleton includeHeader={false} />
      ) : boardQ.isError ? (
        <div className={cn(overviewCardShell, "space-y-2 p-4")}>
          <p className="text-sm font-medium text-destructive">Couldn&apos;t load yield strategies.</p>
          <p className="text-xs text-muted-foreground">Try refreshing the page in a moment.</p>
        </div>
      ) : products.length === 0 ? (
        <div className={cn(overviewCardShell, "space-y-2 p-5 text-center")}>
          <p className="text-sm font-medium text-foreground">No strategies listed yet</p>
          <p className="text-xs text-muted-foreground">
            Check back soon. New strategies appear here once they are ready.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Snapshot across all Syra users
              </p>
              <InfoHint
                label="What is this snapshot?"
                text={EARN_GLOSSARY.trackRecord}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Track record (all users)"
                infoLabel="What does track record mean?"
                infoText={EARN_GLOSSARY.winRate}
                value={
                  flagshipStats?.winRatePct != null
                    ? `${flagshipStats.winRatePct.toFixed(1)}%`
                    : "-"
                }
                hint={
                  flagshipStats?.wins != null || flagshipStats?.losses != null
                    ? `${flagshipStats?.wins ?? 0} wins / ${flagshipStats?.losses ?? 0} losses`
                    : "Share of trades that made money"
                }
              />
              <StatCard
                label="Total profit so far"
                infoLabel="What does total profit mean?"
                infoText={EARN_GLOSSARY.profitLoss}
                value={fmtEarnAmount(
                  flagshipStats?.netPnl ?? flagshipStats?.realizedNetPnlSol,
                  "SOL",
                )}
                hint={fmtEarnUsd(flagshipStats?.netPnlUsd ?? flagshipStats?.realizedNetPnlUsd)}
                positive={(flagshipStats?.netPnl ?? flagshipStats?.realizedNetPnlSol ?? 0) > 0}
              />
              <StatCard
                label="Strategies available"
                value={String(products.length)}
                hint={`${products.filter((p) => p.status === "beta").length} open · ${products.filter((p) => p.status !== "beta").length} not open yet`}
              />
              <StatCard
                label="On-chain reliability (24h)"
                infoLabel="What does on-chain reliability mean?"
                infoText={EARN_GLOSSARY.reliability}
                value={
                  flagshipStats?.settlement24h
                    ? `${(flagshipStats.settlement24h.settleSuccessRate * 100).toFixed(0)}%`
                    : "-"
                }
                hint={
                  flagshipStats?.settlement24h?.meetsLaunchGuardrail
                    ? "Meets safety target (≥95%)"
                    : "Below safety target"
                }
              />
            </div>
          </div>

          <div className="space-y-4">
            {products.map((product) => {
              const Icon = earnProductIcon(product);
              const status = statusByProduct.get(product.id);
              const denom = (product.denom || "SOL") as EarnDenom;
              const minDep = product.minDeposit ?? 1;
              const maxDep = product.maxDeposit ?? 5;
              const feePct = product.performanceFeePct ?? 10;
              const cap = depositCaps[product.id] ?? maxDep;
              const stats = product.stats;
              const paused = product.readiness?.depositsPaused;
              const walletQ = product.walletQuery || (denom === "SOL" ? "lp" : "invest");
              const pauseReasons = readinessReasons(product.readiness?.blockers);
              const agentNote = humanizeAgentNote(status?.config?.lastError);
              const detailTo = `/earn/yield/${encodeURIComponent(product.id)}`;
              const yourPnl =
                status?.summary?.netPnl ??
                status?.summary?.realizedNetPnlSol ??
                status?.summary?.netPnlUsd;
              const wallet = status?.wallet;
              const deployedSol = wallet?.deployedSol ?? 0;
              const unrealizedPnl =
                wallet?.unrealizedPnlSol ?? status?.summary?.unrealizedPnlSol ?? 0;
              const availableSol = wallet?.availableSol ?? wallet?.onChainBalanceSol;
              const staleNote =
                status?.enabled && wallet?.stale
                  ? "Waiting for the next automated cycle"
                  : null;
              const statusNote = agentNote || staleNote;
              const trackSummary = summarizeTrackRecord(stats, denom);
              const isDetailsOpen = Boolean(detailsOpen[product.id]);
              const statusLabel =
                product.status === "coming_soon"
                  ? "Coming soon"
                  : product.status === "beta"
                    ? "Open"
                    : product.status.replace("_", " ");

              return (
                <div key={product.id} className={cn(overviewCardShell, "space-y-4 p-5")}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          <Link
                            to={detailTo}
                            className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          >
                            {product.label}
                          </Link>
                        </h3>
                        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {statusLabel}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                          {denom}
                          <InfoHint
                            label={`What is ${denom}?`}
                            text={denomHelp(denom)}
                            className="h-4 w-4"
                          />
                        </span>
                        {product.riskLevel ? (
                          <span className="rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                            {riskLevelLabel(product.riskLevel)}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {product.description}
                      </p>
                      <Link
                        to={detailTo}
                        className="mt-2 inline-flex min-h-10 items-center text-xs font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        How it works
                      </Link>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="h-10 shrink-0">
                      <Link to={`/wallet?wallet=${walletQ}`}>
                        Wallet
                        <ExternalLink className="ml-1 h-3.5 w-3.5 opacity-70" />
                      </Link>
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-start gap-1.5 rounded-md border border-border/40 bg-muted/10 px-3 py-2.5">
                    <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">
                      {trackSummary}
                    </p>
                    <InfoHint
                      label="What does this track record mean?"
                      text={EARN_GLOSSARY.trackRecord}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <span>
                      You deposit: {minDep} to {maxDep} {denom}. Fee: {feePct}%, only on profit.
                    </span>
                    <InfoHint
                      label="How does the fee work?"
                      text={`${EARN_GLOSSARY.performanceFee} ${EARN_GLOSSARY.nonCustodial}`}
                    />
                  </div>

                  {paused && (
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
                  )}

                  {!connected ? (
                    <p className="text-sm text-muted-foreground">
                      Connect your wallet to get started.
                    </p>
                  ) : !syraAuthReady ? (
                    <p className="text-sm text-muted-foreground">Checking your session…</p>
                  ) : !syraAuthenticated ? (
                    <Button size="sm" className="min-h-10" onClick={onSignIn}>
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
                        onClick={() => disableM.mutate({ productId: product.id, closeAll: false })}
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
                            disableM.mutate({ productId: product.id, closeAll: true });
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
                          onChange={(e) =>
                            setDepositCaps((prev) => ({
                              ...prev,
                              [product.id]: Number(e.target.value),
                            }))
                          }
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
                        onClick={() =>
                          enableM.mutate({ productId: product.id, maxDeposit: cap })
                        }
                      >
                        Start earning
                      </Button>
                      {!board?.beta.allowed && (
                        <span className="text-xs text-muted-foreground">
                          Not open to you yet.
                        </span>
                      )}
                      {product.status !== "beta" && !paused && (
                        <span className="text-xs text-muted-foreground">
                          Still being proven before it opens.
                        </span>
                      )}
                    </div>
                  )}

                  <Collapsible
                    open={isDetailsOpen}
                    onOpenChange={(open) =>
                      setDetailsOpen((prev) => ({ ...prev, [product.id]: open }))
                    }
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-10 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                        aria-expanded={isDetailsOpen}
                      >
                        {isDetailsOpen ? "Hide details" : "Show details"}
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 transition-transform duration-200",
                            isDetailsOpen && "rotate-180",
                          )}
                          aria-hidden
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-3 overflow-hidden pt-2 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                      {status?.enabled && status.summary ? (
                        <div className="space-y-2">
                          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            Your wallet · since you started
                          </p>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <MiniStat
                              label="Currently invested"
                              infoLabel="What is currently invested?"
                              infoText="Amount currently put to work by this strategy in open positions."
                              value={fmtEarnAmount(deployedSol, denom)}
                              hint="In open positions"
                              positive={deployedSol > 0}
                            />
                            <MiniStat
                              label="Open profit / loss"
                              infoLabel="What is open profit or loss?"
                              infoText={EARN_GLOSSARY.unrealized}
                              value={fmtEarnAmount(unrealizedPnl, denom)}
                              hint="Can still change"
                              positive={unrealizedPnl > 0}
                            />
                            <MiniStat
                              label="Open positions"
                              value={String(status.summary.openCount ?? 0)}
                              hint="Active on your agent"
                            />
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <MiniStat
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
                            <MiniStat
                              label="Your profit / loss"
                              infoLabel="What is your profit or loss?"
                              infoText={EARN_GLOSSARY.realized}
                              value={fmtEarnAmount(yourPnl, denom)}
                              hint="Locked in from closed trades"
                              positive={(yourPnl ?? 0) > 0}
                            />
                            <MiniStat
                              label="Available in wallet"
                              value={
                                availableSol != null
                                  ? fmtEarnAmount(availableSol, denom)
                                  : "-"
                              }
                              hint="Ready to invest or withdraw"
                            />
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            All Syra users (not just you):{" "}
                            {stats?.winRatePct != null
                              ? `${stats.winRatePct.toFixed(1)}% win rate`
                              : "-"}{" "}
                            · {fmtEarnAmount(stats?.netPnl ?? stats?.netPnlUsd, denom)} ·{" "}
                            {stats?.openCount ?? 0} open /{" "}
                            {(stats?.errorRatePct ?? 0).toFixed(0)}% errors
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                              Track record · all Syra users
                            </p>
                            <InfoHint
                              label="What is this track record?"
                              text={EARN_GLOSSARY.trackRecord}
                            />
                          </div>
                          <div className="grid gap-2 sm:grid-cols-3">
                            <MiniStat
                              label={
                                stats?.winRatePct != null ? "Win rate" : "Track record"
                              }
                              infoLabel="What does win rate mean?"
                              infoText={EARN_GLOSSARY.winRate}
                              value={
                                stats?.winRatePct != null
                                  ? `${stats.winRatePct.toFixed(1)}%`
                                  : stats?.returnPct != null
                                    ? `${stats.returnPct.toFixed(1)}% return`
                                    : "-"
                              }
                              hint={`${stats?.wins ?? 0} wins / ${stats?.losses ?? 0} losses`}
                            />
                            <MiniStat
                              label="Net profit / loss"
                              infoLabel="What is net profit or loss?"
                              infoText={EARN_GLOSSARY.profitLoss}
                              value={fmtEarnAmount(stats?.netPnl ?? stats?.netPnlUsd, denom)}
                              hint="Across all Syra users"
                              positive={(stats?.netPnl ?? stats?.netPnlUsd ?? 0) > 0}
                            />
                            <MiniStat
                              label="Open / errors"
                              value={`${stats?.openCount ?? 0} / ${(stats?.errorRatePct ?? 0).toFixed(0)}%`}
                              hint="Platform aggregate"
                            />
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  {statusNote && !paused ? (
                    <p className="text-xs text-muted-foreground">Note: {statusNote}</p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {board?.disclosures && board.disclosures.length > 0 && (
            <div className="space-y-1.5 rounded-lg border border-border/40 bg-muted/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Disclosures
              </p>
              <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                {board.disclosures.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function HowItWorksStrip() {
  return (
    <div
      className={cn(
        overviewCardShell,
        "grid gap-4 p-4 sm:grid-cols-3 sm:gap-3 sm:p-5",
      )}
      aria-label="How earning works"
    >
      {HOW_IT_WORKS_STEPS.map((item) => (
        <div key={item.step} className="flex gap-3 sm:flex-col sm:gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border/50 text-[11px] font-semibold tabular-nums text-foreground">
            {item.step}
          </span>
          <div className="min-w-0 space-y-0.5">
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            <p className="text-xs leading-relaxed text-muted-foreground">{item.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({
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
          "mt-1 text-lg font-semibold tabular-nums",
          positive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function MiniStat({
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
    <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
      <div className="flex items-center gap-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
        {infoLabel && infoText ? (
          <InfoHint label={infoLabel} text={infoText} className="h-4 w-4" />
        ) : null}
      </div>
      <p
        className={cn(
          "mt-0.5 text-sm font-medium tabular-nums",
          positive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
