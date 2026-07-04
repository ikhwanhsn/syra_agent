import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  Receipt,
  Shield,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Link } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { OverviewStatCard } from "@/components/dashboard/overview/OverviewStatCard";
import {
  overviewAccentBackground,
  overviewCardGlow,
  overviewCardShell,
  overviewChartPanelShell,
  overviewChartTopShine,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import { TreasurySpendSkeleton } from "@/components/treasury/TreasurySkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAgentBillingSummary, type BillingSpendWindow } from "@/lib/agentBillingApi";
import { ensureAccessToken } from "@/lib/agentAuthApi";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useMinimumSkeleton } from "@/hooks/useMinimumSkeleton";
import { formatCompactUsd } from "@/lib/dashboardOverviewAggregates";

type AgentBillingDashboardProps = {
  className?: string;
  compact?: boolean;
};

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(5, 10);
  return d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 3);
}

function SpendDailyBars({
  daily,
  fill = false,
}: {
  daily: BillingSpendWindow["daily"];
  /** Stretch bars to fill available height (compact side panel). */
  fill?: boolean;
}) {
  const bars = useMemo(() => daily.slice(-7), [daily]);
  const max = useMemo(
    () => Math.max(...bars.map((d) => d.totalUsd), 0.01),
    [bars],
  );

  if (bars.length === 0) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">No daily spend yet</p>
    );
  }

  return (
    <div
      className={cn(
        "flex items-end gap-1.5 sm:gap-2",
        fill ? "h-full min-h-[4.5rem]" : "h-[4.5rem]",
      )}
    >
      {bars.map((day) => {
        const pct = Math.max(4, (day.totalUsd / max) * 100);
        return (
          <div
            key={day.date}
            className="group flex h-full min-w-0 flex-1 flex-col items-center gap-1"
          >
            <div className="relative flex min-h-0 w-full flex-1 items-end justify-center">
              <div
                className={cn(
                  "w-full max-w-[2rem] rounded-md bg-gradient-to-t from-primary/90 to-primary/50 transition-all duration-300",
                  "group-hover:from-primary group-hover:to-primary/70 group-hover:shadow-[0_0_16px_-4px_hsl(var(--primary)/0.45)]",
                  day.totalUsd <= 0 && "from-muted/50 to-muted/30 group-hover:from-muted/60 group-hover:to-muted/40",
                )}
                style={{ height: `${pct}%` }}
                title={`${formatCompactUsd(day.totalUsd)} · ${day.count} calls`}
              />
            </div>
            <span className="truncate text-[10px] font-medium tabular-nums text-muted-foreground/80">
              {formatDayLabel(day.date)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CapUsageMeter({
  usedUsd,
  dailyCapUsd,
  hourlyCapUsd,
  perTxCapUsd,
}: {
  usedUsd: number;
  dailyCapUsd: number;
  hourlyCapUsd: number;
  perTxCapUsd: number;
}) {
  const pct = Math.min(100, (usedUsd / Math.max(dailyCapUsd, 1)) * 100);
  const tone =
    pct >= 90 ? "danger" : pct >= 70 ? "warn" : "ok";

  const barClass =
    tone === "danger"
      ? "from-red-500/90 to-red-400/70"
      : tone === "warn"
        ? "from-amber-500/90 to-amber-400/70"
        : "from-primary/90 to-primary/60";

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Daily cap usage
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums text-foreground">
              {pct.toFixed(0)}%
            </p>
          </div>
          <p className="text-right text-xs text-muted-foreground">
            <span className="font-mono tabular-nums text-foreground/90">
              {formatCompactUsd(usedUsd)}
            </span>
            <span className="mx-1 opacity-50">/</span>
            <span className="font-mono tabular-nums">{formatCompactUsd(dailyCapUsd)}</span>
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted/50 ring-1 ring-border/40">
          <div
            className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-500", barClass)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Per tx", value: formatCompactUsd(perTxCapUsd) },
          { label: "Hourly", value: formatCompactUsd(hourlyCapUsd) },
          { label: "Daily", value: formatCompactUsd(dailyCapUsd) },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border/45 bg-background/30 px-2.5 py-2 text-center backdrop-blur-sm"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-0.5 font-mono text-xs font-semibold tabular-nums text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TopToolsBreakdown({
  rows,
}: {
  rows: BillingSpendWindow["byTool"];
}) {
  const top = rows.slice(0, 6);
  const maxUsd = Math.max(...top.map((r) => r.totalUsd), 0.01);

  return (
    <ul className="space-y-2.5">
      {top.map((row) => {
        const pct = (row.totalUsd / maxUsd) * 100;
        return (
          <li key={row.toolId} className="group relative">
            <div
              className="absolute inset-y-0 left-0 rounded-lg bg-primary/[0.06] transition-all duration-300 group-hover:bg-primary/[0.1]"
              style={{ width: `${pct}%` }}
              aria-hidden
            />
            <div className="relative flex items-center justify-between gap-3 rounded-lg px-3 py-2">
              <span className="min-w-0 truncate font-mono text-xs text-foreground/90">
                {row.toolId}
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-muted-foreground">
                {formatCompactUsd(row.totalUsd)}
                <span className="mx-1 opacity-40">·</span>
                {row.count}×
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function BillingSkeleton({ compact, className }: { compact?: boolean; className?: string }) {
  if (compact) {
    return <TreasurySpendSkeleton className={className} />;
  }

  return (
    <div
      className={cn(overviewCardShell, "overflow-hidden")}
      aria-busy="true"
      aria-label="Loading spend"
    >
      <div
        className={overviewCardGlow}
        style={{ background: overviewAccentBackground("internal") }}
        aria-hidden
      />
      <div className="relative z-[1] space-y-4 p-5 sm:p-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-5">
          <Skeleton className="h-36 rounded-xl lg:col-span-3" />
          <Skeleton className="h-36 rounded-xl lg:col-span-2" />
        </div>
      </div>
    </div>
  );
}

function BillingEmptyState({ className }: { className?: string }) {
  return (
    <div className={cn(overviewCardShell, "overflow-hidden", className)}>
      <div
        className={overviewCardGlow}
        style={{ background: overviewAccentBackground("internal") }}
        aria-hidden
      />
      <div className="relative z-[1] flex flex-col items-center px-6 py-10 text-center sm:py-12">
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-background/50 text-muted-foreground">
          <Wallet className="h-5 w-5" aria-hidden />
        </span>
        <p className="text-sm font-medium text-foreground">Spend tracking unavailable</p>
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Fund your agent wallet to see x402 spend, policy caps, and tool breakdown on the Syra rail.
        </p>
        <Link
          to="/wallet"
          className="mt-5 inline-flex items-center gap-1 rounded-xl border border-border/60 bg-background/60 px-4 py-2 text-xs font-medium text-foreground transition-colors hover:border-border hover:bg-background"
        >
          Open wallets
          <ArrowUpRight className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </Link>
      </div>
    </div>
  );
}

export function AgentBillingDashboard({ className, compact = false }: AgentBillingDashboardProps) {
  const { syraAuthenticated, syraAuthReady } = useSyraAuth();

  const q = useQuery({
    queryKey: ["agent-billing-summary"],
    queryFn: async () => {
      const token = await ensureAccessToken();
      return fetchAgentBillingSummary(token);
    },
    enabled: syraAuthReady && syraAuthenticated,
    staleTime: 30_000,
    retry: 1,
  });

  const showSkeleton = useMinimumSkeleton(
    Boolean(syraAuthReady && syraAuthenticated && q.isLoading),
  );

  if (!syraAuthReady || !syraAuthenticated) {
    return null;
  }

  if (showSkeleton) {
    return compact ? (
      <BillingSkeleton compact className={className} />
    ) : (
      <section className={className}>
        <BillingSkeleton />
      </section>
    );
  }

  if (q.isError || !q.data) {
    if (compact) return null;
    return (
      <section className={className}>
        <BillingEmptyState />
      </section>
    );
  }

  const data = q.data;
  const policy = data.policy;
  const spend7 = data.spend.last7d;
  const spend30 = data.spend.last30d;

  if (compact) {
    const dailyAvg = spend7.totalUsd / 7;
    const capPct = policy
      ? Math.min(100, (dailyAvg / Math.max(policy.dailySpendCapUsd, 1)) * 100)
      : null;

    const capTone =
      capPct == null
        ? "ok"
        : capPct >= 90
          ? "danger"
          : capPct >= 70
            ? "warn"
            : "ok";
    const capBarClass =
      capTone === "danger"
        ? "bg-red-500/85"
        : capTone === "warn"
          ? "bg-amber-500/85"
          : "bg-emerald-500/80";

    return (
      <section className={cn("flex h-full min-h-0 flex-col", className)}>
        <div
          className={cn(
            overviewCardShell,
            "relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl sm:rounded-3xl",
          )}
        >
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(360px 160px at 100% 0%, hsl(var(--primary) / 0.08), transparent 55%), radial-gradient(280px 140px at 0% 100%, hsl(160 55% 42% / 0.08), transparent 50%)",
            }}
            aria-hidden
          />
          <div className="relative z-[1] flex h-full min-h-0 flex-1 flex-col gap-4 p-4 sm:gap-5 sm:p-6 lg:p-7">
            <div className="flex shrink-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground/80 sm:text-[13px] sm:normal-case sm:tracking-normal sm:text-muted-foreground">
                  Spend
                </p>
                <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-3xl">
                  <AnimatedMetric value={spend7.totalUsd} format={formatCompactUsd} />
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Last 7 days
                  {spend7.callCount > 0 ? (
                    <span className="text-muted-foreground/70">
                      {" "}
                      · {spend7.callCount.toLocaleString()} calls
                    </span>
                  ) : null}
                </p>
              </div>
              <Link
                to="/wallet"
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border/45 bg-background/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-border hover:text-foreground"
              >
                Details
                <ArrowUpRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>

            <div className="flex min-h-[4.5rem] flex-1 flex-col justify-end">
              <SpendDailyBars daily={spend7.daily} fill />
            </div>

            {policy && capPct != null ? (
              <div className="shrink-0 space-y-2 border-t border-border/40 pt-3 sm:pt-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium text-muted-foreground">Daily cap</p>
                  <p className="font-mono text-xs tabular-nums text-foreground">
                    {formatCompactUsd(dailyAvg)}
                    <span className="mx-1 text-muted-foreground/50">/</span>
                    {formatCompactUsd(policy.dailySpendCapUsd)}
                    <span className="ml-1.5 text-muted-foreground">({capPct.toFixed(0)}%)</span>
                  </p>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/35 ring-1 ring-border/25">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", capBarClass)}
                    style={{ width: `${Math.min(100, Math.max(capPct, 0))}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="shrink-0 border-t border-border/40 pt-3 sm:pt-4">
                <p className="text-[11px] text-muted-foreground">
                  Avg {formatCompactUsd(dailyAvg)} / day
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={overviewKickerClass}>Rail usage</p>
          <h2 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
            Billing & spend
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Auditable x402 spend across your agent — caps, volume, and top tools on the Syra rail.
          </p>
        </div>
        {data.takeRateNote ? (
          <p className="max-w-xs rounded-xl border border-border/45 bg-muted/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground backdrop-blur-sm">
            {data.takeRateNote}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <OverviewStatCard
          accent="internal"
          icon={TrendingUp}
          label="7-day spend"
          value={<AnimatedMetric value={spend7.totalUsd} format={formatCompactUsd} />}
          hint={`${spend7.callCount.toLocaleString()} paid x402 calls`}
        />
        <OverviewStatCard
          accent="neutral"
          icon={Receipt}
          label="30-day volume"
          value={<AnimatedMetric value={spend30.totalUsd} format={formatCompactUsd} />}
          hint={`${data.lifetime.totalToolCalls.toLocaleString()} lifetime tool calls`}
        />
        <OverviewStatCard
          accent="marketplace"
          icon={Shield}
          label="Policy engine"
          value={
            policy ? (
              <span className="text-lg sm:text-xl">{policy.status}</span>
            ) : (
              "Not configured"
            )
          }
          hint={
            policy
              ? `${policy.allowedToolsCount} allowed tools · caps enforced`
              : "Create an agent wallet to enable caps"
          }
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-5">
        <div className={cn(overviewCardShell, "overflow-hidden lg:col-span-3")}>
          <div
            className={overviewCardGlow}
            style={{ background: overviewAccentBackground("internal") }}
            aria-hidden
          />
          <div className="relative z-[1] p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className={overviewKickerClass}>Activity</p>
                <h3 className="text-sm font-semibold text-foreground">Daily spend (7d)</h3>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full border border-border/50 bg-background/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                <Activity className="h-3 w-3" aria-hidden />
                Live
              </span>
            </div>
            <SpendDailyBars daily={spend7.daily} />
          </div>
        </div>

        <div className={cn(overviewCardShell, "overflow-hidden lg:col-span-2")}>
          <div
            className={overviewCardGlow}
            style={{ background: overviewAccentBackground("marketplace") }}
            aria-hidden
          />
          <div className="relative z-[1] p-5 sm:p-6">
            <p className={overviewKickerClass}>Guardrails</p>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Spend caps</h3>
            {policy ? (
              <CapUsageMeter
                usedUsd={spend7.totalUsd / 7}
                dailyCapUsd={policy.dailySpendCapUsd}
                hourlyCapUsd={policy.hourlySpendCapUsd}
                perTxCapUsd={policy.perTxCapUsd}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No agent wallet yet — caps apply once funded.</p>
            )}
          </div>
        </div>
      </div>

      {spend30.byTool.length > 0 ? (
        <div className={cn(overviewChartPanelShell, "p-5 sm:p-6")}>
          <div className={overviewChartTopShine} aria-hidden />
          <div className="relative z-[1]">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className={overviewKickerClass}>Breakdown</p>
                <h3 className="text-sm font-semibold text-foreground">Top tools (30d)</h3>
              </div>
              <p className="font-mono text-xs tabular-nums text-muted-foreground">
                {formatCompactUsd(spend30.totalUsd)} total
              </p>
            </div>
            <TopToolsBreakdown rows={spend30.byTool} />
          </div>
        </div>
      ) : null}
    </section>
  );
}
