import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bitcoin,
  Clock,
  Crosshair,
  Droplets,
  ExternalLink,
  Pause,
  Play,
  RefreshCw,
  Shield,
  Layers,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { EarnPanelHeader } from "@/components/earn/EarnPanelHeader";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import {
  disableEarnYield,
  enableEarnYield,
  fetchEarnYieldBoard,
  fetchEarnYieldStatus,
  type EarnDenom,
  type EarnYieldProduct,
  type EarnYieldUserStatus,
} from "@/lib/earnYieldApi";
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

function fmtAmount(n: number | null | undefined, denom: EarnDenom = "SOL") {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  if (denom === "USDC") return `${sign}$${n.toFixed(2)}`;
  return `${sign}${n.toFixed(3)} ${denom}`;
}

function fmtUsd(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}$${n.toFixed(2)}`;
}

/** Map API readiness codes → short, user-facing reasons (no snake_case dumps). */
function humanizeReadinessBlocker(code: string): string | null {
  const raw = code.trim();
  if (!raw) return null;

  let m = raw.match(/^insufficient_real_sample_(\d+)_need_(\d+)$/);
  if (m) {
    const have = Number(m[1]);
    const need = Number(m[2]);
    if (have <= 0) return `Needs ${need} real lab trades before deposits open`;
    return `Lab progress: ${have} of ${need} real trades completed`;
  }

  m = raw.match(/^paper_sample_(\d+)_need_(\d+)$/);
  if (m) {
    return `Paper lab progress: ${m[1]} of ${m[2]} trades`;
  }

  m = raw.match(/^error_rate_([\d.]+)pct_above_([\d.]+)pct$/);
  if (m) return "Lab error rate is still above the safety limit";

  m = raw.match(/^solana_settlement_success_([\d.]+)pct_below_([\d.]+)pct$/);
  if (m) return "On-chain settlement reliability needs to improve";

  m = raw.match(/^drawdown_([\d.]+)pct_above_([\d.]+)pct$/);
  if (m) return "Lab drawdown is above the safety limit";

  switch (raw) {
    case "realized_net_pnl_not_positive":
      return "Waiting for a net-positive lab track record";
    case "error_rate_kill_threshold":
      return "Temporarily paused while reliability improves";
    case "paper_expectancy_not_positive":
      return "Paper lab still needs positive results";
    case "paper_graduation_failed":
      return "Paper lab has not graduated yet";
    default:
      // Skip opaque internal codes rather than dumping them to users
      if (/^[a-z0-9_]+$/i.test(raw)) return null;
      return raw;
  }
}

function readinessReasons(blockers: string[] | undefined): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const code of blockers || []) {
    const text = humanizeReadinessBlocker(code);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
  }
  return out;
}

function humanizeAgentNote(lastError: string | null | undefined): string | null {
  if (!lastError) return null;
  if (lastError.startsWith("auto_pause:")) {
    const reasons = readinessReasons(lastError.slice("auto_pause:".length).split(","));
    if (reasons.length === 0) return "Deposits are paused until the lab clears safety checks.";
    return reasons.join(" · ");
  }
  if (/^[a-z0-9_,:.-]+$/i.test(lastError) && lastError.includes("_")) {
    const reasons = readinessReasons(lastError.split(","));
    return reasons.length > 0 ? reasons.join(" · ") : null;
  }
  return lastError;
}

function productIcon(product: EarnYieldProduct) {
  if (product.id === "lp_meteora_dlmm") return Droplets;
  if (product.id === "cbbtc_onchain_signal") return Bitcoin;
  if (product.id === "momentum_rotator") return RefreshCw;
  if (product.id === "lst_loop") return Layers;
  if (product.id === "alpha_sniper") return Crosshair;
  return Shield;
}

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
      staleTime: 30_000,
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
        title="Yield — multi-product"
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
        <div className={cn(overviewCardShell, "h-40 animate-pulse bg-muted/20")} />
      ) : boardQ.isError ? (
        <div className={cn(overviewCardShell, "p-4 text-sm text-destructive")}>
          Failed to load yield board.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="LP win rate"
              value={
                flagshipStats?.winRatePct != null ? `${flagshipStats.winRatePct.toFixed(1)}%` : "—"
              }
              hint={`${flagshipStats?.wins ?? 0}W / ${flagshipStats?.losses ?? 0}L`}
            />
            <StatCard
              label="LP realized PnL"
              value={fmtAmount(
                flagshipStats?.netPnl ?? flagshipStats?.realizedNetPnlSol,
                "SOL",
              )}
              hint={fmtUsd(flagshipStats?.netPnlUsd ?? flagshipStats?.realizedNetPnlUsd)}
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
                  : "—"
              }
              hint={
                flagshipStats?.settlement24h?.meetsLaunchGuardrail
                  ? "Meets ≥95% guardrail"
                  : "Below launch guardrail"
              }
            />
          </div>

          <div className="space-y-4">
            {products.map((product) => {
              const Icon = productIcon(product);
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

              return (
                <div key={product.id} className={cn(overviewCardShell, "space-y-4 p-5")}>
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{product.label}</h3>
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
                    </div>
                    <Button variant="ghost" size="sm" asChild className="shrink-0">
                      <Link to={`/wallet?wallet=${walletQ}`}>
                        Wallet
                        <ExternalLink className="ml-1 h-3.5 w-3.5 opacity-70" />
                      </Link>
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-3">
                    <MiniStat
                      label={stats?.winRatePct != null ? "Win rate" : "Track"}
                      value={
                        stats?.winRatePct != null
                          ? `${stats.winRatePct.toFixed(1)}%`
                          : stats?.returnPct != null
                            ? `${stats.returnPct.toFixed(1)}% ret`
                            : "—"
                      }
                    />
                    <MiniStat
                      label="Net PnL"
                      value={fmtAmount(stats?.netPnl ?? stats?.netPnlUsd, denom)}
                      positive={(stats?.netPnl ?? stats?.netPnlUsd ?? 0) > 0}
                    />
                    <MiniStat
                      label="Open / errors"
                      value={`${stats?.openCount ?? 0} / ${(stats?.errorRatePct ?? 0).toFixed(0)}%`}
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
                      {status.summary && (
                        <span className="text-xs text-muted-foreground">
                          Your PnL{" "}
                          {fmtAmount(
                            status.summary.netPnl ??
                              status.summary.realizedNetPnlSol ??
                              status.summary.netPnlUsd,
                            denom,
                          )}{" "}
                          · Open {status.summary.openCount ?? 0}
                        </span>
                      )}
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
  positive,
}: {
  label: string;
  value: string;
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
    </div>
  );
}
