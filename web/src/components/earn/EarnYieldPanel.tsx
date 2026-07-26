import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, ExternalLink, Pause, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { EarnPanelHeader } from "@/components/earn/EarnPanelHeader";
import { EarnYieldPanelSkeleton } from "@/components/earn/EarnSkeleton";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import {
  disableEarnYield,
  enableEarnYield,
  fetchEarnYieldBoard,
  fetchEarnYieldStatus,
  type EarnDenom,
  type EarnYieldUserStatus,
} from "@/lib/earnYieldApi";
import {
  earnProductIcon,
  fmtEarnAmount,
  fmtEarnUsd,
  humanizeAgentNote,
  readinessReasons,
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
      const label = products.find((p) => p.id === vars.productId)?.label ?? "Yield";
      notify.success(`${label} enabled`, (data as { nextStep?: string })?.nextStep ?? "Fund your agent wallet to start.");
      void queryClient.invalidateQueries({ queryKey: ["earn", "yield"] });
    },
    onError: (e: Error) => {
      notify.error("Could not enable yield product", e.message);
    },
  });

  const disableM = useMutation({
    mutationFn: ({ productId, closeAll }: { productId: string; closeAll: boolean }) =>
      disableEarnYield(closeAll, productId),
    onSuccess: (_data, vars) => {
      const label = products.find((p) => p.id === vars.productId)?.label ?? "Yield";
      notify.success(`${label} stopped`);
      void queryClient.invalidateQueries({ queryKey: ["earn", "yield"] });
    },
    onError: (e: Error) => {
      notify.error("Could not stop yield product", e.message);
    },
  });

  const board = boardQ.data;
  const flagship = products.find((p) => p.id === "lp_meteora_dlmm");
  const flagshipStats = flagship?.stats ?? board?.platformStats;

  return (
    <div className="space-y-6">
      <EarnPanelHeader
        title="Yield: multi-product"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link to="/wallet?wallet=lp">
              Agent wallets
              <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-70" />
            </Link>
          </Button>
        }
      />

      <p className="max-w-2xl text-sm text-muted-foreground">
        Deposit into the matching agent wallet. Syra runs the strategy non-custodially. Products
        graduate from lab → beta only after real track record passes readiness guards. Past results
        are not a guarantee.
      </p>

      {boardQ.isLoading ? (
        <EarnYieldPanelSkeleton includeHeader={false} />
      ) : boardQ.isError ? (
        <div className={cn(overviewCardShell, "p-4 text-sm text-destructive")}>
          Failed to load yield board.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Lab track record · not your wallet
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Lab win rate"
                value={
                  flagshipStats?.winRatePct != null
                    ? `${flagshipStats.winRatePct.toFixed(1)}%`
                    : "-"
                }
                hint={`${flagshipStats?.wins ?? 0}W / ${flagshipStats?.losses ?? 0}L · all Syra LP`}
              />
              <StatCard
                label="Lab realized PnL"
                value={fmtEarnAmount(
                  flagshipStats?.netPnl ?? flagshipStats?.realizedNetPnlSol,
                  "SOL",
                )}
                hint={fmtEarnUsd(flagshipStats?.netPnlUsd ?? flagshipStats?.realizedNetPnlUsd)}
                positive={(flagshipStats?.netPnl ?? flagshipStats?.realizedNetPnlSol ?? 0) > 0}
              />
              <StatCard
                label="Products listed"
                value={String(products.length)}
                hint={`${products.filter((p) => p.status === "beta").length} beta · ${products.filter((p) => p.status !== "beta").length} gated`}
              />
              <StatCard
                label="Settlement (24h)"
                value={
                  flagshipStats?.settlement24h
                    ? `${(flagshipStats.settlement24h.settleSuccessRate * 100).toFixed(0)}%`
                    : "-"
                }
                hint={
                  flagshipStats?.settlement24h?.meetsLaunchGuardrail
                    ? "Meets ≥95% guardrail"
                    : "Below launch guardrail"
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
                          {product.status.replace("_", " ")}
                        </span>
                        <span className="rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                          {denom}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Cap {minDep}–{maxDep} {denom} · Fee {product.performanceFeePct ?? 10}% of
                        net-positive PnL
                      </p>
                      <Link
                        to={detailTo}
                        className="mt-2 inline-flex text-xs font-medium text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        How it works
                      </Link>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="shrink-0">
                      <Link to={`/wallet?wallet=${walletQ}`}>
                        Wallet
                        <ExternalLink className="ml-1 h-3.5 w-3.5 opacity-70" />
                      </Link>
                    </Button>
                  </div>

                  {status?.enabled && status.summary ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Your wallet · since Earn enable
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <MiniStat
                          label="Your win rate"
                          value={
                            status.summary.winRatePct != null
                              ? `${status.summary.winRatePct.toFixed(1)}%`
                              : `${status.summary.wins ?? 0}W / ${status.summary.losses ?? 0}L`
                          }
                          hint={`${status.summary.wins ?? 0}W / ${status.summary.losses ?? 0}L closed this session`}
                        />
                        <MiniStat
                          label="Your PnL"
                          value={fmtEarnAmount(yourPnl, denom)}
                          hint="Session only: not lab history"
                          positive={(yourPnl ?? 0) > 0}
                        />
                        <MiniStat
                          label="Your open"
                          value={String(status.summary.openCount ?? 0)}
                          hint="Active on your agent"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Lab (all Syra, not you):{" "}
                        {stats?.winRatePct != null ? `${stats.winRatePct.toFixed(1)}% win` : "-"} ·{" "}
                        {fmtEarnAmount(stats?.netPnl ?? stats?.netPnlUsd, denom)} ·{" "}
                        {stats?.openCount ?? 0} open / {(stats?.errorRatePct ?? 0).toFixed(0)}% err
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        Lab track record · not your wallet
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <MiniStat
                          label={stats?.winRatePct != null ? "Lab win rate" : "Lab track"}
                          value={
                            stats?.winRatePct != null
                              ? `${stats.winRatePct.toFixed(1)}%`
                              : stats?.returnPct != null
                                ? `${stats.returnPct.toFixed(1)}% ret`
                                : "-"
                          }
                          hint={`${stats?.wins ?? 0}W / ${stats?.losses ?? 0}L`}
                        />
                        <MiniStat
                          label="Lab net PnL"
                          value={fmtEarnAmount(stats?.netPnl ?? stats?.netPnlUsd, denom)}
                          hint="All Syra LP agents"
                          positive={(stats?.netPnl ?? stats?.netPnlUsd ?? 0) > 0}
                        />
                        <MiniStat
                          label="Lab open / errors"
                          value={`${stats?.openCount ?? 0} / ${(stats?.errorRatePct ?? 0).toFixed(0)}%`}
                          hint="Platform aggregate"
                        />
                      </div>
                    </div>
                  )}

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
                              ? "This strategy is still proving itself in the lab. Funding unlocks after it clears the readiness checks below."
                              : "New deposits are on hold until the strategy clears the safety checks below."}
                          </p>
                          {pauseReasons.length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              Waiting on lab graduation.
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
                    <p className="text-sm text-muted-foreground">Connect wallet to enable.</p>
                  ) : !syraAuthReady ? (
                    <p className="text-sm text-muted-foreground">Checking session…</p>
                  ) : !syraAuthenticated ? (
                    <Button size="sm" onClick={onSignIn}>
                      Sign in to continue
                    </Button>
                  ) : status?.enabled ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                        <Play className="h-3.5 w-3.5" /> Active
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={disableM.isPending}
                        onClick={() => disableM.mutate({ productId: product.id, closeAll: false })}
                      >
                        <Pause className="mr-1.5 h-3.5 w-3.5" />
                        Pause
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={disableM.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Stop ${product.label} and request close of open exposure? This may realize losses.`,
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
                        Max deposit ({denom})
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
                          className="block h-9 w-28 rounded-md border border-border/60 bg-background px-2 text-sm text-foreground"
                          disabled={!product.actionable}
                        />
                      </label>
                      <Button
                        size="sm"
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
                        Enable {product.label.split(" ")[0]}
                      </Button>
                      {!board?.beta.allowed && (
                        <span className="text-xs text-muted-foreground">Not on beta allowlist.</span>
                      )}
                      {product.status !== "beta" && !paused && (
                        <span className="text-xs text-muted-foreground">
                          Waiting for lab graduation.
                        </span>
                      )}
                    </div>
                  )}

                  {agentNote && !paused ? (
                    <p className="text-xs text-muted-foreground">Note: {agentNote}</p>
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

function StatCard({
  label,
  value,
  hint,
  positive,
}: {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
}) {
  return (
    <div className={cn(overviewCardShell, "p-4")}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
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
}: {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/10 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
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
