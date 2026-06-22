"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Coins,
  Gauge,
  Loader2,
  RefreshCw,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchX402Analytics, type DailyCount } from "@/lib/internalAnalyticsApi";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
  overviewMetricValueClass,
} from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import { buildAllX402ShareBundles } from "@/components/info/metricsShare/buildX402SharePayloads";
import {
  MetricsSectionShareButton,
  MetricsShareModal,
} from "@/components/info/metricsShare/MetricsShareModal";
import type { MetricShareSectionBundle } from "@/components/info/metricsShare/types";

function formatNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString();
}

function formatUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toFixed(2)}`;
}

function formatPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${n.toFixed(1)}%`;
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

function formatNetwork(network: string | null): string {
  if (!network) return "—";
  if (network.startsWith("solana:")) return network.includes("5eykt") ? "Solana mainnet" : "Solana";
  if (network.startsWith("eip155:8453")) return "Base";
  if (network.startsWith("eip155:56")) return "BSC";
  if (network.includes("algorand")) return "Algorand";
  return network.length > 24 ? `${network.slice(0, 22)}…` : network;
}

function MetricTile({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: typeof Zap;
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
      <p className={cn(overviewMetricValueClass, "mt-2 text-xl sm:text-2xl")}>{value}</p>
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={overviewKickerClass}>{title}</p>
            {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
          </div>
          {onShare ? <MetricsSectionShareButton onClick={onShare} /> : null}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

export function X402AnalyticsDashboard() {
  const q = useQuery({
    queryKey: ["x402-analytics"],
    queryFn: fetchX402Analytics,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });
  const [shareBundle, setShareBundle] = useState<MetricShareSectionBundle | null>(null);
  const shareBundles = useMemo(
    () => (q.data ? buildAllX402ShareBundles(q.data) : null),
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
        <span className="text-sm text-muted-foreground">Loading x402 telemetry…</span>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className={cn(overviewCardShell, "rounded-2xl px-6 py-10 text-center")}>
        <AlertTriangle className="mx-auto mb-3 h-5 w-5 text-muted-foreground" aria-hidden />
        <p className="text-sm font-medium text-foreground">x402 analytics unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Could not reach the analytics API. Data will appear once x402 calls are recorded.
        </p>
        <Button type="button" variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => void q.refetch()}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          Retry
        </Button>
      </div>
    );
  }

  const { summary, funnel, topEndpoints, byNetwork, byFacilitator, errors, needsImprovement, daily } =
    q.data;

  const dailyUsdChart: DailyCount[] = daily.map((d) => ({ date: d.date, count: d.usdVolume }));
  const dailyCallsChart: DailyCount[] = daily.map((d) => ({ date: d.date, count: d.calls }));

  return (
    <div className="space-y-6">
      <MetricsShareModal bundle={shareBundle} onClose={() => setShareBundle(null)} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary">
            <Activity className="h-3 w-3" aria-hidden />
            x402 per-call telemetry
          </div>
          <p className="text-sm text-muted-foreground">
            Updated {formatUpdatedAt(q.data.updatedAt)} · refreshes every 60s
          </p>
        </div>
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

      <div className="flex items-center justify-between gap-3">
        <p className={overviewKickerClass}>Headline KPIs</p>
        <MetricsSectionShareButton onClick={() => openShare("x402-headline")} />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-6">
        <MetricTile
          label="USD volume (30d)"
          value={formatUsd(summary.usdVolumeLast30d)}
          hint={`${formatUsd(summary.totalUsdVolume)} all-time`}
          icon={Coins}
        />
        <MetricTile
          label="Success rate"
          value={formatPct(summary.successRate)}
          hint={`${formatNum(summary.paidCalls)} paid / ${formatNum(summary.totalCalls)} total`}
          icon={Gauge}
        />
        <MetricTile
          label="Unique payers"
          value={formatNum(summary.uniquePayers)}
          hint="Inbound settled payments"
          icon={TrendingUp}
        />
        <MetricTile
          label="Failures (7d)"
          value={formatNum(summary.failuresLast7d)}
          hint={`${formatNum(summary.failuresLast30d)} last 30d`}
          icon={AlertTriangle}
        />
        <MetricTile
          label="Inbound / Outbound"
          value={`${formatNum(summary.inboundCalls)} / ${formatNum(summary.outboundCalls)}`}
          hint="Merchant vs agent payer"
          icon={ArrowDownLeft}
        />
        <MetricTile
          label="402 → paid conversion"
          value={formatPct(summary.conversionRate)}
          hint={`${summary.growthPct >= 0 ? "+" : ""}${formatPct(summary.growthPct)} paid growth 30d`}
          icon={Zap}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Daily USD volume"
          subtitle="Paid x402 revenue — last 14 days"
          onShare={() => openShare("x402-volume")}
        >
          <DailyBarChart
            data={dailyUsdChart}
            label="USD settled per day"
            accentClass="from-emerald-500/90 to-emerald-400/50"
          />
        </Panel>
        <Panel title="Daily call volume" subtitle="All x402 events — last 14 days">
          <DailyBarChart data={dailyCallsChart} label="Total x402 events per day" />
        </Panel>
      </div>

      <Panel
        title="Payment funnel (inbound)"
        subtitle="402 issued → verify → settle → paid (last 30 days)"
        onShare={() => openShare("x402-funnel")}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "402 issued", value: funnel.paymentRequired },
            { label: "Verify failed", value: funnel.verifyFailed },
            { label: "Settle failed", value: funnel.settleFailed },
            { label: "Paid", value: funnel.paid },
          ].map((step) => (
            <div
              key={step.label}
              className="rounded-xl border border-border/50 bg-background/40 px-4 py-3 text-center"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {step.label}
              </p>
              <p className={cn(overviewMetricValueClass, "mt-1 text-lg")}>{formatNum(step.value)}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Recent errors" subtitle="What API errored — last 7 days">
          <DataTable
            columns={[
              { key: "endpoint", label: "Endpoint", mono: true },
              { key: "outcome", label: "Outcome" },
              { key: "reason", label: "Reason" },
              { key: "time", label: "Time", align: "right" },
            ]}
            rows={errors.recent.map((e) => ({
              endpoint: e.host ? `${e.host}${e.path}` : e.path,
              outcome: e.outcome,
              reason: (e.errorReason || "—").slice(0, 60),
              time: formatUpdatedAt(e.createdAt),
            }))}
            emptyLabel="No errors recorded yet"
          />
        </Panel>

        <Panel title="Top failure reasons" subtitle="Grouped error messages — last 30 days">
          <DataTable
            columns={[
              { key: "reason", label: "Reason" },
              { key: "count", label: "Count", align: "right" },
            ]}
            rows={errors.byReason.map((r) => ({
              reason: r.reason.slice(0, 80),
              count: r.count,
            }))}
            emptyLabel="No failure reasons yet"
          />
        </Panel>
      </div>

      <Panel
        title="Most used endpoints"
        subtitle="By call volume and USD revenue — last 30 days"
        onShare={() => openShare("x402-endpoints")}
      >
        <DataTable
          columns={[
            { key: "path", label: "Path", mono: true },
            { key: "direction", label: "Dir" },
            { key: "calls", label: "Calls", align: "right" },
            { key: "usd", label: "USD", align: "right" },
            { key: "errors", label: "Errors", align: "right" },
            { key: "errorRate", label: "Err %", align: "right" },
            { key: "latency", label: "Avg ms", align: "right" },
          ]}
          rows={topEndpoints.map((e) => ({
            path: e.path,
            direction: e.direction,
            calls: e.calls,
            usd: formatUsd(e.successUsd),
            errors: e.errors,
            errorRate: formatPct(e.errorRate),
            latency: e.avgLatencyMs,
          }))}
          emptyLabel="No endpoint data yet"
        />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="By network"
          subtitle="Chain distribution and reliability"
          onShare={() => openShare("x402-reliability")}
        >
          <DataTable
            columns={[
              { key: "network", label: "Network" },
              { key: "calls", label: "Calls", align: "right" },
              { key: "paid", label: "Paid", align: "right" },
              { key: "successRate", label: "Success %", align: "right" },
              { key: "usd", label: "USD", align: "right" },
            ]}
            rows={byNetwork.map((n) => ({
              network: formatNetwork(n.network),
              calls: n.calls,
              paid: n.paidCalls,
              successRate: formatPct(n.successRate),
              usd: formatUsd(n.successUsd),
            }))}
            emptyLabel="No network data yet"
          />
        </Panel>

        <Panel title="By facilitator" subtitle="PayAI, Corbits, B402, upstream reliability">
          <DataTable
            columns={[
              { key: "facilitator", label: "Facilitator" },
              { key: "calls", label: "Calls", align: "right" },
              { key: "paid", label: "Paid", align: "right" },
              { key: "successRate", label: "Success %", align: "right" },
              { key: "usd", label: "USD", align: "right" },
            ]}
            rows={byFacilitator.map((f) => ({
              facilitator: f.facilitator,
              calls: f.calls,
              paid: f.paidCalls,
              successRate: formatPct(f.successRate),
              usd: formatUsd(f.successUsd),
            }))}
            emptyLabel="No facilitator data yet"
          />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Needs improvement — error rate"
          subtitle="Endpoints with highest failure rate (min 3 calls)"
        >
          <DataTable
            columns={[
              { key: "path", label: "Path", mono: true },
              { key: "total", label: "Total", align: "right" },
              { key: "errors", label: "Errors", align: "right" },
              { key: "errorRate", label: "Err %", align: "right" },
            ]}
            rows={needsImprovement.highestErrorRate.map((e) => ({
              path: e.path,
              total: e.total,
              errors: e.errors,
              errorRate: formatPct(e.errorRate),
            }))}
            emptyLabel="No problematic endpoints yet"
          />
        </Panel>

        <Panel title="Needs improvement — latency" subtitle="Slowest endpoints by avg response time">
          <DataTable
            columns={[
              { key: "path", label: "Path", mono: true },
              { key: "avg", label: "Avg ms", align: "right" },
              { key: "max", label: "Max ms", align: "right" },
              { key: "count", label: "Calls", align: "right" },
            ]}
            rows={needsImprovement.slowestEndpoints.map((e) => ({
              path: e.path,
              avg: e.avgLatencyMs,
              max: e.maxLatencyMs,
              count: e.count,
            }))}
            emptyLabel="No latency data yet"
          />
        </Panel>
      </div>

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <ArrowUpRight className="h-3 w-3" aria-hidden />
        Data retained 90 days · inbound = Syra merchant · outbound = agent tool payments
      </p>
    </div>
  );
}
