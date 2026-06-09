import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Brain,
  Clock,
  Flame,
  History,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  fetchPumpfunAlphaScoutBrief,
  PUMPFUN_ALPHA_SCOUT_CLIENT_STALE_MS,
  type PumpfunScoutConfidence,
  type PumpfunScoutPrediction,
} from "@/lib/pumpfunAlphaScoutApi";
import { userReadableAlphaDataError } from "@/lib/alphaIntelUi";

function formatCompactUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
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

function confidenceBadgeClass(c: PumpfunScoutConfidence): string {
  if (c === "high") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (c === "medium") return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  return "border-border/60 bg-muted/40 text-muted-foreground";
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
    <Card className={cn("relative overflow-hidden border-border/55 bg-gradient-to-br from-card/95 via-card/85 to-muted/[0.06]", className)}>
      <CardContent className="relative p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{label}</p>
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[1.65rem]">{value}</p>
        {hint ? <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground/80">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function PredictionCard({ row }: { row: PumpfunScoutPrediction }) {
  return (
    <div className="rounded-xl border border-violet-500/20 bg-muted/[0.08] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-mono text-sm font-semibold text-foreground">{row.symbol}</p>
            <Badge variant="outline" className={cn("rounded-lg text-[10px] font-semibold uppercase", confidenceBadgeClass(row.confidence))}>
              {row.confidence}
            </Badge>
          </div>
          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{row.mint}</p>
        </div>
        <a
          href={`https://pump.fun/coin/${encodeURIComponent(row.mint)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 shrink-0 items-center rounded-xl border border-border/60 bg-background/30 px-3 text-xs font-semibold text-primary hover:bg-background/60"
        >
          Open
        </a>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-md border border-border/40 bg-background/30 px-2 py-0.5 font-mono tabular-nums">Fit {row.learnedFitScore}</span>
        <span className="rounded-md border border-border/40 bg-background/30 px-2 py-0.5 font-mono tabular-nums">Pump {row.pumpScore}</span>
        {row.marketCapUsd != null ? (
          <span className="rounded-md border border-border/40 bg-background/30 px-2 py-0.5 font-mono tabular-nums">MC {formatCompactUsd(row.marketCapUsd)}</span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground/95">{row.thesis}</p>
      {row.matchedPatterns.length ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {row.matchedPatterns.map((p) => (
            <Badge key={p} variant="secondary" className="rounded-md text-[10px] font-medium">
              {p}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PumpfunAlphaScoutTabPanel() {
  const briefQ = useQuery({
    queryKey: ["alpha", "pumpfun-scout"],
    queryFn: () => fetchPumpfunAlphaScoutBrief(),
    staleTime: PUMPFUN_ALPHA_SCOUT_CLIENT_STALE_MS,
    refetchOnWindowFocus: false,
  });

  const data = briefQ.data?.data;
  const savedAt = briefQ.data?.savedAt;
  const isWarmingUp = briefQ.isError && !data;
  const patterns = data?.meta.patternsLearned?.length ? data.meta.patternsLearned : data?.learnedProfile.patternsLearned ?? [];

  return (
    <div className="space-y-8 pb-10 sm:pb-12 lg:pb-14">
      <Card className="relative overflow-hidden rounded-3xl border border-violet-500/20 bg-gradient-to-br from-card/95 via-card/80 to-muted/[0.05]">
        <CardContent className="relative space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-700 dark:text-violet-300">
                <Brain className="h-3.5 w-3.5" aria-hidden />
                Separate agent
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Alpha Scout</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/90">
                Remembers past alpha runners, learns narrative and MC patterns, then scans for new tokens that fit the same playbook.
              </p>
              <p className="text-xs text-muted-foreground/75">
                Updated {savedAt ? formatTs(Date.parse(savedAt)) : "—"}
                {briefQ.data?.nextRefreshAt ? ` · next scan ~${formatTs(Date.parse(briefQ.data.nextRefreshAt))}` : null}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="h-9 shrink-0 gap-2 rounded-xl" onClick={() => void briefQ.refetch()} disabled={briefQ.isFetching}>
              {briefQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {briefQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile label="Past alphas learned" value={String(data.learnedProfile.sampleSize)} hint="Historical flags in scout memory" className="ring-1 ring-violet-500/15" />
          <KpiTile label="New predictions" value={String(data.predictedAlphas.length)} hint="Tokens matching learned patterns" />
          <KpiTile label="Top keyword" value={data.learnedProfile.topKeywords[0]?.keyword ?? "—"} hint={data.learnedProfile.topKeywords[0] ? `${data.learnedProfile.topKeywords[0].count} past alpha hits` : "Building memory…"} />
          <KpiTile label="MC band (learned)" value={data.learnedProfile.mcBandUsd.median != null ? formatCompactUsd(data.learnedProfile.mcBandUsd.median) : "—"} hint="Median MC when past alphas were flagged" />
        </div>
      ) : null}

      {isWarmingUp ? (
        <Card className="border-border/55 bg-card/55">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium text-foreground">Alpha Scout is warming up</p>
            <p className="text-sm text-muted-foreground">{userReadableAlphaDataError((briefQ.error as Error | undefined)?.message)}</p>
            <Button type="button" variant="secondary" size="sm" className="rounded-xl" onClick={() => void briefQ.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {data ? (
        <>
          <Card className="border-border/55 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-4 w-4 text-violet-500" aria-hidden />
                {data.meta.scoutTitle}
              </CardTitle>
              <CardDescription>{data.meta.scoutSummary}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-border/35 bg-background/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Patterns learned from past alpha</p>
                <ul className="space-y-2">
                  {patterns.length ? patterns.map((s, i) => <li key={`${s}-${i}`} className="text-sm text-muted-foreground/95">{s}</li>) : (
                    <li className="text-sm text-muted-foreground/95">Scout is still collecting alpha history — predictions improve after a few hot runners are stored.</li>
                  )}
                </ul>
              </div>
              <div className="space-y-2 rounded-xl border border-border/35 bg-background/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Caveats</p>
                <ul className="space-y-2">
                  {data.meta.riskCaveats.map((s, i) => (
                    <li key={`${s}-${i}`} className="text-sm text-muted-foreground/95">{s}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-amber-500/20 bg-card/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Flame className="h-4 w-4 text-amber-500" aria-hidden />
                  Live alpha (training data)
                </CardTitle>
                <CardDescription>Runners flagged this scan — fed into scout memory.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.currentAlphaRunners.length ? data.currentAlphaRunners.map((a) => (
                  <div key={a.mint} className="rounded-xl border border-border/45 bg-muted/[0.08] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-sm font-semibold">{a.symbol}</p>
                      <a href={`https://pump.fun/coin/${encodeURIComponent(a.mint)}`} target="_blank" rel="noopener noreferrer" className="text-primary" aria-label={`Open ${a.symbol}`}>
                        <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{a.reason}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No live alpha on this scan.</p>}
              </CardContent>
            </Card>

            <Card className="border-violet-500/25 bg-card/60">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-4 w-4 text-violet-500" aria-hidden />
                  Predicted new alpha
                </CardTitle>
                <CardDescription>Tokens that match what past alphas looked like before they ran.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.predictedAlphas.length ? data.predictedAlphas.map((p) => <PredictionCard key={p.mint} row={p} />) : (
                  <p className="text-sm text-muted-foreground">No predictions yet — scout needs more past alpha samples or stronger fit scores.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/55 bg-card/55">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-4 w-4 text-muted-foreground" aria-hidden />
                Past alpha memory
              </CardTitle>
              <CardDescription>Recent tokens the scout learned from (newest first).</CardDescription>
            </CardHeader>
            <CardContent>
              {data.pastAlphaHistory.length ? (
                <ul className="divide-y divide-border/40 rounded-xl border border-border/40">
                  {data.pastAlphaHistory.slice(0, 12).map((h) => (
                    <li key={`${h.mint}-${h.flaggedAtMs}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground">{h.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          Pump {h.pumpScore}
                          {h.marketCapUsd != null ? ` · MC ${formatCompactUsd(h.marketCapUsd)}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {formatTs(h.flaggedAtMs)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Memory empty — first alpha flags will appear here.</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
