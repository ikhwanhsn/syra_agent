import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Twitter,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { fetchXProjectsAnalyze, type XProjectsBatchItem } from "@/lib/xProjectsAnalyzeApi";
import { formatFollowers, gradeBadgeClass } from "@/lib/alphaIntelUi";
import { fetchPumpfunAlphaTrend, type PumpfunAlphaPeriod } from "@/lib/pumpfunAlphaTrendApi";

const STALE_MS = 55_000;

function sortBatchItemsByScoreDesc(items: XProjectsBatchItem[]): XProjectsBatchItem[] {
  return [...items].sort((a, b) => {
    const sa = a.ok ? a.analysis.score : Number.NEGATIVE_INFINITY;
    const sb = b.ok ? b.analysis.score : Number.NEGATIVE_INFINITY;
    if (sb !== sa) return sb - sa;
    return a.username.localeCompare(b.username, undefined, { sensitivity: "base" });
  });
}

function KpiTile({
  label,
  value,
  hint,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border/55 bg-gradient-to-br from-card/95 via-card/85 to-muted/[0.06] shadow-[0_1px_0_0_hsl(var(--border)/0.45)] backdrop-blur-sm",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          background:
            "radial-gradient(720px 220px at 15% -20%, hsl(var(--primary)/0.06), transparent 55%), radial-gradient(520px 180px at 100% 120%, hsl(var(--muted-foreground)/0.05), transparent 50%)",
        }}
      />
      <CardContent className="relative p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{label}</p>
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[1.65rem]">
          {value}
        </p>
        {hint ? <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground/80">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function AlphaXTabPanel() {
  const navigate = useNavigate();
  const batchQ = useQuery({
    queryKey: ["alpha", "x-batch", "x402"],
    queryFn: () => fetchXProjectsAnalyze({ type: "x402", max_results: 20, includeAiSummary: false }),
    staleTime: STALE_MS,
  });

  const data = batchQ.data;
  const sortedItems = useMemo(() => (data ? sortBatchItemsByScoreDesc(data.items) : []), [data]);

  return (
    <div className="space-y-8 pb-10 sm:pb-12 lg:pb-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-[13px] font-medium text-muted-foreground">
            {data?.label ?? "x402 ecosystem"}
            {data?.updatedAt ? (
              <span className="text-muted-foreground/55">
                {" "}
                · Updated {new Date(data.updatedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
              </span>
            ) : null}
          </p>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/90">
            Deterministic profile and tweet sample scoring — same engine as Syra&apos;s X analyzer. Click a row for deep
            intel, recent posts, and model-assisted synthesis. Sorted by score, highest first.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-2 rounded-xl border-border/70"
          onClick={() => void batchQ.refetch()}
          disabled={batchQ.isFetching}
        >
          {batchQ.isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <RefreshCw className="h-4 w-4" aria-hidden />
          )}
          Refresh
        </Button>
      </div>

      {batchQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[118px] rounded-2xl" />
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Average score"
            value={data.summary.averageScore != null ? String(data.summary.averageScore) : "—"}
            hint="Across accounts that returned successfully."
          />
          <KpiTile label="Accounts" value={String(data.summary.total)} hint="In this intelligence batch." />
          <KpiTile label="Live rows" value={String(data.summary.succeeded)} hint="Profiles scored end-to-end." />
          <KpiTile label="Needs attention" value={String(data.summary.failed)} hint="Upstream gaps or missing handles." />
        </div>
      ) : null}

      {batchQ.isError ? (
        <Card className="border-destructive/25 bg-destructive/[0.03]">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium text-foreground">Unable to load batch analysis</p>
            <p className="text-sm text-muted-foreground">
              {(batchQ.error as Error)?.message || "Request failed. Confirm the gateway can reach /x-projects-analyze."}
            </p>
            <Button type="button" variant="secondary" size="sm" className="rounded-xl" onClick={() => void batchQ.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {batchQ.isLoading ? (
        <Card className="overflow-hidden border-border/55 bg-card/40 backdrop-blur-sm">
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </Card>
      ) : data ? (
        <Card className="overflow-hidden border-border/55 bg-card/50 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.85)] backdrop-blur-md">
          <div className="border-b border-border/50 bg-muted/[0.15] px-4 py-3 sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold tracking-tight text-foreground">Watchlist</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/75">
                {sortedItems.length} accounts
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="w-12 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    #
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Account
                  </TableHead>
                  <TableHead className="hidden text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">
                    Followers
                  </TableHead>
                  <TableHead className="text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Grade
                  </TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Score
                  </TableHead>
                  <TableHead className="w-10 pr-4 sm:w-14" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item, index) => {
                  const rank = index + 1;
                  if (!item.ok) {
                    return (
                      <TableRow key={item.username} className="border-border/40 bg-destructive/[0.04]">
                        <TableCell className="font-mono text-xs text-muted-foreground">{rank}</TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground">@{item.username}</p>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
                              {item.error}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-right sm:table-cell">—</TableCell>
                        <TableCell className="text-center">—</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell />
                      </TableRow>
                    );
                  }

                  const a = item.analysis;
                  const followers = a.user?.public_metrics?.followers_count;
                  const displayName = a.user?.name?.trim() || a.username;

                  return (
                    <TableRow
                      key={item.username}
                      className={cn(
                        "group cursor-pointer border-border/40 transition-colors",
                        "hover:bg-muted/30 data-[state=selected]:bg-muted/40",
                      )}
                      onClick={() =>
                        navigate(`/dashboard/alpha/x/${encodeURIComponent(item.username)}`)
                      }
                      tabIndex={0}
                      role="link"
                      aria-label={`Open intelligence for @${item.username}`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          navigate(`/dashboard/alpha/x/${encodeURIComponent(item.username)}`);
                        }
                      }}
                    >
                      <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">{rank}</TableCell>
                      <TableCell className="max-w-[200px] sm:max-w-none">
                        <div className="min-w-0">
                          <p className="truncate font-semibold tracking-tight text-foreground group-hover:text-primary">
                            {displayName}
                          </p>
                          <p className="truncate font-mono text-xs text-muted-foreground">@{a.username}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-right font-mono text-sm tabular-nums text-muted-foreground sm:table-cell">
                        {formatFollowers(followers)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-7 min-w-[2rem] justify-center px-2 font-mono text-xs font-bold",
                            gradeBadgeClass(a.grade),
                          )}
                        >
                          {a.grade}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                        {a.score}
                      </TableCell>
                      <TableCell className="pr-4 text-muted-foreground">
                        <ChevronRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function formatCompactUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 10_000) return `$${Math.round(n / 1000)}k`;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatTs(tsMs: number | null | undefined): string {
  if (tsMs == null || !Number.isFinite(tsMs)) return "—";
  try {
    return new Date(tsMs).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function PumpfunAlphaTabPanel() {
  const [period, setPeriod] = useState<PumpfunAlphaPeriod>("today");

  const batchQ = useQuery({
    queryKey: ["alpha", "pumpfun-trend", period],
    queryFn: () => fetchPumpfunAlphaTrend(period),
    staleTime: STALE_MS,
  });

  return (
    <div className="space-y-8 pb-10 sm:pb-12 lg:pb-14">
      <Card className="relative overflow-hidden rounded-3xl border border-border/55 bg-gradient-to-br from-card/95 via-card/80 to-muted/[0.05] shadow-[0_24px_70px_-46px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--border) / 0.2) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--border) / 0.2) 1px, transparent 1px)
            `,
            backgroundSize: "46px 46px",
          }}
        />
        <CardContent className="relative space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/55 bg-background/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden />
                Pumpfun Intelligence
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">New Graduates Radar</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/90">
                Recently graduated pump.fun tokens, ranked by live market context and summarized into a readable meta trend.
              </p>
              <p className="text-xs text-muted-foreground/75">Updated {batchQ.data?.nowMs ? formatTs(batchQ.data.nowMs) : "—"}</p>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex rounded-2xl border border-border/55 bg-background/35 p-1">
                {(
                  [
                    ["today", "Today"],
                    ["week", "Week"],
                    ["month", "Month"],
                  ] as const
                ).map(([id, label]) => (
                  <Button
                    key={id}
                    type="button"
                    size="sm"
                    variant={period === id ? "secondary" : "ghost"}
                    className={cn(
                      "h-9 min-w-14 rounded-xl px-4 font-semibold transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    )}
                    onClick={() => setPeriod(id)}
                    disabled={batchQ.isFetching}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 shrink-0 gap-2 rounded-xl border-border/70 px-3 font-semibold focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => void batchQ.refetch()}
                disabled={batchQ.isFetching}
              >
                {batchQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RefreshCw className="h-4 w-4" aria-hidden />}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {batchQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
      ) : batchQ.data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Matched"
            value={String(batchQ.data.matchedCount)}
            hint={`Complete pump.fun tokens in the ${period} lens`}
            className="ring-1 ring-primary/10"
          />
          <KpiTile
            label="Top market cap"
            value={batchQ.data.tokens[0]?.marketCapUsd != null ? formatCompactUsd(batchQ.data.tokens[0]?.marketCapUsd) : "—"}
            hint="Current market cap leader"
          />
          <KpiTile
            label="Top ATH"
            value={batchQ.data.tokens[0]?.athMarketCapUsd != null ? formatCompactUsd(batchQ.data.tokens[0]?.athMarketCapUsd) : "—"}
            hint="Highest ATH among matched set"
          />
          <KpiTile
            label="Anchor time"
            value={batchQ.data.tokens[0]?.anchorTsMs != null ? formatTs(batchQ.data.tokens[0]?.anchorTsMs) : "—"}
            hint="Primary recency anchor"
          />
        </div>
      ) : null}

      {batchQ.isError ? (
        <Card className="border-destructive/25 bg-destructive/[0.03]">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium text-foreground">Unable to load Pump.fun trend</p>
            <p className="text-sm text-muted-foreground">
              {(batchQ.error as Error)?.message || "Request failed. Confirm the gateway can reach the market endpoints."}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => void batchQ.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {batchQ.isLoading ? null : batchQ.data ? (
        batchQ.data.tokens.length === 0 ? (
          <Card className="border-border/55 bg-card/55">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground/70" aria-hidden />
              <p className="text-sm font-medium text-foreground">No matched graduates in this window yet</p>
              <p className="max-w-lg text-sm text-muted-foreground">
                Switch to another time lens or refresh to pull the latest graduated tokens.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => void batchQ.refetch()}
              >
                Refresh feed
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-3">
              <Card className="border-border/55 bg-card/60 backdrop-blur-md xl:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
                    {batchQ.data.analysis.trendTitle || "Trend"}
                  </CardTitle>
                  <CardDescription>OpenRouter synthesis grounded in the matched graduates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="rounded-2xl border border-border/40 bg-muted/[0.08] p-5">
                    <p className="text-sm leading-relaxed text-foreground/95">{batchQ.data.analysis.metaSummary}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2 rounded-xl border border-border/35 bg-background/30 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Signals</p>
                      <ul className="space-y-2">
                        {batchQ.data.analysis.signals.map((s, i) => (
                          <li key={`${s}-${i}`} className="text-sm text-muted-foreground/95">
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/35 bg-background/30 p-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Caveats</p>
                      <ul className="space-y-2">
                        {batchQ.data.analysis.riskCaveats.length ? (
                          batchQ.data.analysis.riskCaveats.map((s, i) => (
                            <li key={`${s}-${i}`} className="text-sm text-muted-foreground/95">
                              {s}
                            </li>
                          ))
                        ) : (
                          <li className="text-sm text-muted-foreground/95">No caveats provided.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/55 bg-card/60 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Watchlist</CardTitle>
                  <CardDescription>Prioritized tokens with concrete reasons.</CardDescription>
                </CardHeader>
                <CardContent>
                  {batchQ.data.analysis.watchlist.length ? (
                    <div className="space-y-3">
                      {batchQ.data.analysis.watchlist.map((w) => (
                        <div key={w.mint} className="rounded-xl border border-border/45 bg-muted/[0.08] p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-mono text-sm font-semibold text-foreground">{w.symbol}</p>
                              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{w.mint}</p>
                            </div>
                            <a
                              href={`https://pump.fun/coin/${encodeURIComponent(w.mint)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-9 items-center rounded-xl border border-border/60 bg-background/30 px-3 text-xs font-semibold text-primary transition-colors hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                              Open
                            </a>
                          </div>
                          <p className="mt-3 text-sm leading-relaxed text-muted-foreground/95">{w.reason}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No watchlist generated.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/55 bg-card/55 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Matched tokens</CardTitle>
                <CardDescription>
                  Complete pump.fun graduates. Values update from current metadata snapshots.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="w-12 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">#</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Token</TableHead>
                        <TableHead className="hidden text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:table-cell">
                          Market cap
                        </TableHead>
                        <TableHead className="hidden text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">
                          ATH
                        </TableHead>
                        <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <span className="inline-flex items-center justify-end gap-2">
                            <Clock className="h-3.5 w-3.5 opacity-70" aria-hidden />
                            Anchor
                          </span>
                        </TableHead>
                        <TableHead className="w-14 pr-4 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Link
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchQ.data.tokens.map((t, i) => (
                        <TableRow key={t.mint} className="group border-border/40 transition-colors hover:bg-muted/20">
                          <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="truncate font-semibold tracking-tight text-foreground">{t.symbol}</p>
                              <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{t.mint}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden text-right font-mono text-sm tabular-nums text-foreground sm:table-cell">
                            {t.marketCapUsd != null ? formatCompactUsd(t.marketCapUsd) : "—"}
                          </TableCell>
                          <TableCell className="hidden text-right font-mono text-sm tabular-nums text-foreground lg:table-cell">
                            {t.athMarketCapUsd != null ? formatCompactUsd(t.athMarketCapUsd) : "—"}
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">{formatTs(t.anchorTsMs)}</TableCell>
                          <TableCell className="pr-4 text-right text-muted-foreground">
                            <a
                              href={`https://pump.fun/coin/${encodeURIComponent(t.mint)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border/60 bg-background/30 text-primary transition-colors hover:bg-background/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                              aria-label={`Open ${t.symbol} on pump.fun`}
                            >
                              <ArrowUpRight className="h-3.5 w-3.5 opacity-85 transition-transform group-hover:translate-x-[1px] group-hover:-translate-y-[1px]" aria-hidden />
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )
      ) : null}
    </div>
  );
}

export default function Alpha() {
  return (
    <TooltipProvider delayDuration={250}>
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM,
          "flex flex-col min-h-0",
        )}
      >
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/55 bg-gradient-to-br from-card/90 via-card/70 to-muted/[0.04] px-5 py-8 shadow-[0_24px_80px_-48px_rgba(0,0,0,0.85)] sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.65]"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border) / 0.22) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border) / 0.22) 1px, transparent 1px)
              `,
              backgroundSize: "56px 56px",
            }}
          />
          <div
            className="pointer-events-none absolute -right-24 -top-28 h-[340px] w-[340px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.14), transparent 62%)" }}
          />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/35 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
                Intelligence
              </div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Alpha</h1>
              <p className="max-w-xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Early product-grade feeds curated by Syra — structured signals you can scan in seconds, built for teams
                shipping at full velocity.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-end">
              <Button variant="secondary" size="sm" className="rounded-xl gap-2 border border-border/60 bg-background/50" asChild>
                <a href="https://docs.syraa.fun" target="_blank" rel="noopener noreferrer">
                  API docs
                  <ArrowUpRight className="h-4 w-4 opacity-70" aria-hidden />
                </a>
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="x" className="min-h-0 flex-1 space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-auto w-full justify-start gap-1 rounded-2xl border border-border/55 bg-muted/35 p-1.5 shadow-inner backdrop-blur-md sm:w-auto">
              <TabsTrigger
                value="x"
                className="rounded-xl px-5 py-2.5 text-[13px] font-semibold tracking-tight data-[state=active]:bg-background data-[state=active]:shadow-md"
              >
                <Twitter className="mr-2 h-4 w-4 opacity-80" aria-hidden />
                X
              </TabsTrigger>
              <TabsTrigger
                value="pumpfun"
                className="rounded-xl px-5 py-2.5 text-[13px] font-semibold tracking-tight data-[state=active]:bg-background data-[state=active]:shadow-md"
              >
                <TrendingUp className="mr-2 h-4 w-4 opacity-80" aria-hidden />
                Pumpfun
              </TabsTrigger>
            </TabsList>
            <p className="text-[12px] font-medium text-muted-foreground/75 sm:text-right">
              More institutional feeds are queued — this workspace grows with your roadmap.
            </p>
          </div>

          <TabsContent value="x" className="mt-0 outline-none focus-visible:outline-none">
            <AlphaXTabPanel />
          </TabsContent>
          <TabsContent value="pumpfun" className="mt-0 outline-none focus-visible:outline-none">
            <PumpfunAlphaTabPanel />
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}
