import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowUpRight,
  Loader2,
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
import { fetchAgentBillingSummary, type BillingSpendWindow } from "@/lib/agentBillingApi";
import { ensureAccessToken } from "@/lib/agentAuthApi";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
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

function SpendDailyBars({ daily }: { daily: BillingSpendWindow["daily"] }) {
  const bars = useMemo(() => daily.slice(-7), [daily]);
  const max = useMemo(
    () => Math.max(...bars.map((d) => d.totalUsd), 0.01),
    [bars],
  );

  if (bars.length === 0) {
    return (
      <p className="py-6 text-center text-xs text-muted-foreground">No daily spend yet</p>
    );
  }

  return (
    <div className="flex h-[4.5rem] items-end gap-1.5 sm:gap-2">
      {bars.map((day) => {
        const pct = Math.max(4, (day.totalUsd / max) * 100);
        return (
          <div key={day.date} className="group flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <div className="relative flex h-14 w-full items-end justify-center">
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

function BillingSkeleton({ compact }: { compact?: boolean }) {
  return (
    <div className={cn(overviewCardShell, "overflow-hidden")}>
      <div
        className={overviewCardGlow}
        style={{ background: overviewAccentBackground("internal") }}
        aria-hidden
      />
      <div className={cn("relative z-[1] space-y-4", compact ? "p-4" : "p-5 sm:p-6")}>
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
          <span className="text-sm text-muted-foreground">Loading spend…</span>
        </div>
        <div className={cn("grid gap-3", compact ? "grid-cols-2" : "sm:grid-cols-3")}>
          {Array.from({ length: compact ? 2 : 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/40" />
          ))}
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

  if (!syraAuthReady || !syraAuthenticated) {
    return null;
  }

  if (q.isLoading) {
    return (
      <section className={className}>
        <BillingSkeleton compact={compact} />
      </section>
    );
  }

  if (q.isError || !q.data) {
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

    return (
      <section className={cn(className)}>
        <div className={cn(overviewCardShell, "overflow-hidden")}>
          <div
            className={overviewCardGlow}
            style={{ background: overviewAccentBackground("internal") }}
            aria-hidden
          />
          <div className="relative z-[1] flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  7d spend
                </p>
                <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-foreground">
                  <AnimatedMetric value={spend7.totalUsd} format={formatCompactUsd} />
                </p>
              </div>
              {policy && capPct != null ? (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    Daily cap
                  </p>
                  <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums text-foreground">
                    {capPct.toFixed(0)}%
                  </p>
                </div>
              ) : null}
            </div>
            <Link
              to="/overview"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Details
              <ArrowUpRight className="h-3 w-3" aria-hidden />
            </Link>
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
