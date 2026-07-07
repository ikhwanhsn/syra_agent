"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@/lib/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  Coins,
  Gauge,
  Loader2,
  MessageSquare,
  RefreshCw,
  Share2,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchInternalAnalyticsBundle,
  type DailyCount,
} from "@/lib/internalAnalyticsApi";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewChartPanelShell,
  overviewChartTopShine,
  overviewKickerClass,
  overviewMetricValueClass,
} from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { buildAllMetricShareBundles } from "@/components/info/metricsShare/buildMetricSharePayloads";
import {
  MetricsSectionShareButton,
  MetricsShareModal,
} from "@/components/info/metricsShare/MetricsShareModal";
import type { MetricShareSectionBundle } from "@/components/info/metricsShare/types";

function formatNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString();
}

function formatPct(n: number | null | undefined, signed = false): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = signed && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function TrendBadge({ value }: { value: number }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums",
        up
          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          : "bg-red-500/10 text-red-700 dark:text-red-400",
      )}
    >
      {up ? <TrendingUp className="h-3 w-3" aria-hidden /> : <TrendingDown className="h-3 w-3" aria-hidden />}
      {formatPct(value, true)}
    </span>
  );
}

function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: typeof Zap;
  trend?: number;
}) {
  return (
    <div className={cn(overviewCardShell, "rounded-2xl px-4 py-4 sm:px-5 sm:py-5")}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
          {label}
        </p>
        {Icon ? (
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/50 bg-background/40 text-muted-foreground">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap items-end gap-2">
        <p className={cn(overviewMetricValueClass, "text-xl sm:text-2xl")}>{value}</p>
        {trend != null ? <TrendBadge value={trend} /> : null}
      </div>
      {hint ? <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function DailyBarChart({
  data,
  label,
  accentClass = "from-primary/90 to-primary/50",
}: {
  data: DailyCount[];
  label: string;
  accentClass?: string;
}) {
  const bars = useMemo(() => data.slice(-14), [data]);
  const max = useMemo(() => Math.max(...bars.map((d) => d.count), 1), [bars]);

  if (bars.length === 0) {
    return <p className="py-8 text-center text-xs text-muted-foreground">No data yet</p>;
  }

  return (
    <div>
      <p className="mb-3 text-xs text-muted-foreground">{label}</p>
      <div className="flex h-[5.5rem] items-end gap-1 sm:gap-1.5">
        {bars.map((day) => {
          const pct = Math.max(4, (day.count / max) * 100);
          return (
            <div key={day.date} className="group flex min-w-0 flex-1 flex-col items-center gap-1">
              <div className="relative flex h-16 w-full items-end justify-center">
                <div
                  title={`${day.date}: ${day.count.toLocaleString()}`}
                  className={cn(
                    "w-full max-w-[1.75rem] rounded-md bg-gradient-to-t transition-all",
                    accentClass,
                    day.count <= 0 && "from-muted/40 to-muted/25",
                  )}
                  style={{ height: `${pct}%` }}
                />
              </div>
              <span className="truncate text-[9px] tabular-nums text-muted-foreground/75">
                {day.date.slice(5)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DataTable({
  columns,
  rows,
  emptyLabel = "No data",
}: {
  columns: { key: string; label: string; align?: "left" | "right"; mono?: boolean }[];
  rows: Record<string, string | number>[];
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-4 text-center text-xs text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[280px] text-sm">
        <thead>
          <tr className="border-b border-border/50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground",
                  col.align === "right" ? "text-right" : "text-left",
                )}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/30 last:border-0">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "py-2 text-[13px] text-foreground/90",
                    col.align === "right" ? "text-right tabular-nums" : "text-left",
                    col.mono && "font-mono text-xs",
                  )}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  onShare,
}: {
  title: string;
  subtitle?: string;
  onShare?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className={overviewKickerClass}>{title}</p>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {onShare ? <MetricsSectionShareButton onClick={onShare} /> : null}
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
  accent = "neutral" as const,
  onShare,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: "neutral" | "internal" | "marketplace";
  onShare?: () => void;
}) {
  return (
    <div className={cn(overviewCardShell, "relative overflow-hidden rounded-2xl")}>
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{ background: overviewAccentBackground(accent) }}
        aria-hidden
      />
      <div className="relative z-[1] p-5 sm:p-6">
        <SectionHeader title={title} subtitle={subtitle} onShare={onShare} />
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function InfoLiveMetricsDashboard() {
  const q = useQuery({
    queryKey: ["info-live-analytics"],
    queryFn: fetchInternalAnalyticsBundle,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
  const [shareBundle, setShareBundle] = useState<MetricShareSectionBundle | null>(null);
  const shareBundles = useMemo(
    () => (q.data ? buildAllMetricShareBundles(q.data.kpi, q.data.extended) : null),
    [q.data],
  );
  const openShare = (sectionId: string) => {
    if (!shareBundles) return;
    setShareBundle(shareBundles[sectionId] ?? null);
  };

  if (q.isLoading) {
    return (
      <div className={cn(overviewCardShell, "flex items-center justify-center gap-2 rounded-2xl px-6 py-16")}>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden />
        <span className="text-sm text-muted-foreground">Loading live product metrics…</span>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className={cn(overviewCardShell, "rounded-2xl px-6 py-10 text-center")}>
        <AlertTriangle className="mx-auto mb-3 h-5 w-5 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">Live metrics unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Could not reach the analytics API. Check API connectivity or try again.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => void q.refetch()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Retry
        </Button>
      </div>
    );
  }

  const { kpi, extended } = q.data;
  const paidProgress = Math.min(100, (kpi.totalPaidApiCalls / kpi.kpiTargets.paidApiCalls) * 100);
  const agentProgress = Math.min(100, (kpi.chatsWithPaidToolUse / kpi.kpiTargets.agentSessions) * 100);
  const errorRate7d =
    kpi.insights.totalRequestsLast7d > 0
      ? (kpi.insights.errorCountLast7d / kpi.insights.totalRequestsLast7d) * 100
      : 0;

  return (
    <div className="space-y-6">
      <MetricsShareModal bundle={shareBundle} onClose={() => setShareBundle(null)} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
            <Activity className="h-3 w-3" aria-hidden />
            Live from production
          </div>
          <p className="text-sm text-muted-foreground">
            Updated {formatUpdatedAt(kpi.updatedAt)} · refreshes every 60s
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-xl text-xs"
            onClick={() => void q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCw className={cn("mr-1.5 h-3.5 w-3.5", q.isFetching && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="flex items-center justify-between gap-3">
        <p className={overviewKickerClass}>Headline KPIs</p>
        <MetricsSectionShareButton onClick={() => openShare("headline")} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <MetricTile
          label="Total paid calls"
          value={formatNum(kpi.totalPaidApiCalls)}
          hint={`${formatNum(kpi.paidApiCallsLast7Days)} last 7d`}
          icon={Zap}
        />
        <MetricTile
          label="30d paid growth"
          value={formatPct(extended.revenue.growthPct, true)}
          hint={`${formatNum(extended.revenue.paidCurr30d)} vs ${formatNum(extended.revenue.paidPrev30d)} prior`}
          icon={TrendingUp}
        />
        <MetricTile
          label="Unique users"
          value={formatNum(extended.users.uniqueUsersTotal)}
          hint={`${formatNum(extended.users.uniqueUsersLast7d)} active 7d`}
          icon={Users}
        />
        <MetricTile
          label="Total chats"
          value={formatNum(extended.users.totalChats)}
          hint={`${formatNum(extended.users.chatsLast30d)} new 30d`}
          icon={MessageSquare}
        />
        <MetricTile
          label="Paid conversion"
          value={formatPct(extended.conversion.conversionRate)}
          hint={`${formatNum(extended.conversion.paidRequests30d)} / ${formatNum(extended.conversion.totalRequests30d)} reqs`}
          icon={Target}
        />
        <MetricTile
          label="Playground shares"
          value={formatNum(extended.playground.totalShares)}
          hint={`${formatNum(extended.playground.sharesLast7d)} last 7d`}
          icon={Share2}
        />
      </div>

      {/* Monetization & conversion */}
      <div className="flex items-center justify-between gap-3">
        <p className={overviewKickerClass}>Monetization & conversion</p>
        <MetricsSectionShareButton onClick={() => openShare("monetization")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className={cn(overviewCardShell, "rounded-2xl px-5 py-5 sm:col-span-1")}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
            Paid conversion (30d)
          </p>
          <p className={cn(overviewMetricValueClass, "mt-2 text-3xl sm:text-4xl")}>
            {formatPct(extended.conversion.conversionRate)}
          </p>
          <p className="mt-2 text-xs tabular-nums text-muted-foreground">
            {formatNum(extended.conversion.paidRequests30d)} paid / {formatNum(extended.conversion.totalRequests30d)} total requests
          </p>
        </div>
        <MetricTile
          label="Paid calls (30d)"
          value={formatNum(kpi.paidApiCallsLast30Days)}
          hint={`${formatNum(kpi.paidApiCallsLast7Days)} last 7d`}
          icon={Zap}
        />
        <MetricTile
          label="30d paid growth"
          value={formatPct(extended.revenue.growthPct, true)}
          hint={`${formatNum(extended.revenue.paidCurr30d)} vs ${formatNum(extended.revenue.paidPrev30d)} prior`}
          icon={TrendingUp}
        />
        <MetricTile
          label="Completed tool calls"
          value={formatNum(kpi.completedPaidToolCalls)}
          hint="All-time successful paid tools"
          icon={Coins}
        />
        <MetricTile
          label="Chats w/ paid tools"
          value={formatNum(kpi.chatsWithPaidToolUse)}
          hint="Sessions that triggered x402"
          icon={MessageSquare}
        />
        <MetricTile
          label="Paid requests (30d)"
          value={formatNum(extended.conversion.paidRequests30d)}
          hint="Monetized API requests"
          icon={Target}
        />
      </div>

      {/* Charts row */}
      <div className="flex items-center justify-between gap-3">
        <p className={overviewKickerClass}>Growth trends</p>
        <MetricsSectionShareButton onClick={() => openShare("charts")} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <div className={cn(overviewChartPanelShell, "p-5 sm:p-6")}>
          <div className={overviewChartTopShine} aria-hidden />
          <div className="relative z-[1]">
            <p className="text-sm font-semibold text-foreground">Paid x402 calls</p>
            <DailyBarChart data={kpi.dailyPaidCalls} label="Daily paid API calls — last 14 days" />
          </div>
        </div>
        <div className={cn(overviewChartPanelShell, "p-5 sm:p-6")}>
          <div className={overviewChartTopShine} aria-hidden />
          <div className="relative z-[1]">
            <p className="text-sm font-semibold text-foreground">Daily active users</p>
            <DailyBarChart
              data={extended.users.dailyActiveUsers}
              label="Unique users with chat activity — last 14 days"
              accentClass="from-violet-500/85 to-violet-400/50"
            />
          </div>
        </div>
      </div>

      {/* Revenue & traffic */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel
          title="Revenue rail"
          subtitle="Paid calls by source and top paths (30d)"
          onShare={() => openShare("revenue")}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {extended.revenue.bySource.map((s) => (
              <span
                key={s.source}
                className="rounded-full border border-border/50 bg-background/40 px-2.5 py-1 text-xs font-medium tabular-nums"
              >
                {s.source}: {formatNum(s.count)}
              </span>
            ))}
          </div>
          <DataTable
            columns={[
              { key: "path", label: "Endpoint", mono: true },
              { key: "source", label: "Source" },
              { key: "count", label: "Paid", align: "right" },
            ]}
            rows={extended.revenue.byPathAndSource.slice(0, 12).map((r) => ({
              path: r.path,
              source: r.source,
              count: formatNum(r.count),
            }))}
            emptyLabel="No paid path breakdown yet"
          />
        </Panel>

        <Panel
          title="API traffic"
          subtitle="Request volume and error rate (7d / 30d)"
          accent="internal"
          onShare={() => openShare("traffic")}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { label: "Requests 24h", value: kpi.insights.totalRequestsLast24h },
              { label: "Requests 7d", value: kpi.insights.totalRequestsLast7d },
              { label: "Requests 30d", value: kpi.insights.totalRequestsLast30d },
              { label: "Errors 7d", value: kpi.insights.errorCountLast7d },
              { label: "Errors 30d", value: kpi.insights.errorCountLast30d },
              { label: "Error rate 7d", value: errorRate7d, pct: true },
            ].map(({ label, value, pct }) => (
              <div
                key={label}
                className="rounded-xl border border-border/45 bg-background/25 px-3 py-2.5 text-center"
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
                  {pct ? formatPct(value as number) : formatNum(value as number)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Top paths by volume (30d)</p>
            <DataTable
              columns={[
                { key: "path", label: "Path", mono: true },
                { key: "count", label: "Requests", align: "right" },
                { key: "avg", label: "Avg ms", align: "right" },
              ]}
              rows={kpi.insights.requestsByPath.slice(0, 10).map((r) => ({
                path: r.path,
                count: formatNum(r.count),
                avg: formatNum(r.avgDurationMs),
              }))}
            />
          </div>
        </Panel>
      </div>

      {/* Users & agents */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel
          title="Engagement"
          subtitle="Chat depth and new session velocity"
          onShare={() => openShare("engagement")}
        >
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Avg msgs / chat", value: extended.users.avgMessagesPerChat },
              { label: "Total messages", value: extended.users.totalMessages },
              { label: "Max in one chat", value: extended.users.maxMessagesInChat },
              { label: "Paid tool calls", value: kpi.completedPaidToolCalls },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border/45 px-3 py-2.5">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{formatNum(value)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <DailyBarChart
              data={extended.users.dailyNewChats}
              label="New chats per day — last 14 days"
              accentClass="from-sky-500/85 to-sky-400/50"
            />
          </div>
        </Panel>

        <Panel
          title="Agent & tool usage"
          subtitle="Which agents and tools drive paid activity"
          accent="marketplace"
          onShare={() => openShare("agents")}
        >
          <p className="mb-2 text-xs font-medium text-muted-foreground">Top agents by chat count</p>
          <DataTable
            columns={[
              { key: "agent", label: "Agent ID", mono: true },
              { key: "count", label: "Chats", align: "right" },
            ]}
            rows={extended.users.topAgents.slice(0, 8).map((a) => ({
              agent: a.agentId,
              count: formatNum(a.count),
            }))}
            emptyLabel="No agent breakdown yet"
          />
          <p className="mb-2 mt-5 text-xs font-medium text-muted-foreground">Tool usage (all time)</p>
          <DataTable
            columns={[
              { key: "name", label: "Tool", mono: true },
              { key: "total", label: "Total", align: "right" },
              { key: "completed", label: "OK", align: "right" },
              { key: "rate", label: "Success", align: "right" },
            ]}
            rows={extended.users.toolUsage.slice(0, 10).map((t) => ({
              name: t.name,
              total: formatNum(t.total),
              completed: formatNum(t.completed),
              rate: formatPct(t.successRate),
            }))}
          />
        </Panel>
      </div>

      {/* Playground & health */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel
          title="Marketplace"
          subtitle="Shared request links — developer adoption signal"
          onShare={() => openShare("playground")}
        >
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Total shares", value: extended.playground.totalShares },
              { label: "7d shares", value: extended.playground.sharesLast7d },
              { label: "30d shares", value: extended.playground.sharesLast30d },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-border/45 px-3 py-2.5 text-center">
                <p className="text-[10px] text-muted-foreground">{label}</p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{formatNum(value)}</p>
              </div>
            ))}
          </div>
          {extended.playground.byChain.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {extended.playground.byChain.map((c) => (
                <span
                  key={c.chain}
                  className="rounded-full border border-border/50 px-2.5 py-1 text-xs tabular-nums"
                >
                  {c.chain}: {formatNum(c.count)}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-4">
            <DailyBarChart
              data={extended.playground.dailyShares}
              label="Playground shares per day — last 14 days"
              accentClass="from-amber-500/85 to-amber-400/50"
            />
          </div>
        </Panel>

        <Panel
          title="System health"
          subtitle="Latency percentiles and reliability (7d)"
          accent="internal"
          onShare={() => openShare("health")}
        >
          <div className="mb-4 flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" aria-hidden />
            <div className="flex flex-wrap gap-3 font-mono text-sm tabular-nums">
              <span>avg {formatNum(extended.health.avgLatency)}ms</span>
              <span>p95 {formatNum(extended.health.p95Latency)}ms</span>
              <span>p99 {formatNum(extended.health.p99Latency)}ms</span>
            </div>
          </div>
          {extended.health.statusCodeDistribution.length > 0 ? (
            <div className="mb-4 flex flex-wrap gap-2">
              {extended.health.statusCodeDistribution.map((s) => (
                <span key={s.status} className="rounded-lg border border-border/45 px-2 py-1 text-xs tabular-nums">
                  {s.status}: {formatNum(s.count)}
                </span>
              ))}
            </div>
          ) : null}
          <p className="mb-2 text-xs font-medium text-muted-foreground">Endpoints with errors</p>
          <DataTable
            columns={[
              { key: "path", label: "Path", mono: true },
              { key: "errors", label: "Errors", align: "right" },
              { key: "rate", label: "Rate", align: "right" },
            ]}
            rows={extended.health.errorRateByEndpoint.slice(0, 8).map((e) => ({
              path: e.path,
              errors: formatNum(e.errors),
              rate: formatPct(e.errorRate),
            }))}
            emptyLabel="No elevated error endpoints"
          />
          <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">Slowest endpoints (avg latency)</p>
          <DataTable
            columns={[
              { key: "path", label: "Path", mono: true },
              { key: "avg", label: "Avg ms", align: "right" },
              { key: "max", label: "Max ms", align: "right" },
            ]}
            rows={extended.health.slowestEndpoints.slice(0, 6).map((e) => ({
              path: e.path,
              avg: formatNum(e.avgDuration),
              max: formatNum(e.maxDuration),
            }))}
          />
        </Panel>
      </div>

      {/* All-time top paid endpoints */}
      <Panel
        title="Top paid endpoints"
        subtitle="All-time x402 volume by API path"
        onShare={() => openShare("endpoints")}
      >
        <DataTable
          columns={[
            { key: "path", label: "Path", mono: true },
            { key: "count", label: "Paid calls", align: "right" },
          ]}
          rows={kpi.byPath.slice(0, 20).map((r) => ({
            path: r.path,
            count: formatNum(r.count),
          }))}
        />
      </Panel>
    </div>
  );
}
