import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Cpu,
  ExternalLink,
  History,
  Loader2,
  RefreshCw,
  Sparkles,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  fetchPumpfunUtilityScoutBrief,
  PUMPFUN_UTILITY_SCOUT_CLIENT_STALE_MS,
  type EcosystemUtilityPick,
  type PumpfunUtilityPick,
  type UtilityScoutConfidence,
} from "@/lib/pumpfunUtilityScoutApi";
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

function confidenceBadgeClass(c: UtilityScoutConfidence): string {
  if (c === "high") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (c === "medium") return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200";
  return "border-border/60 bg-muted/40 text-muted-foreground";
}

function projectTypeLabel(type: string): string {
  return type.replace(/-/g, " ");
}

function KpiTile({ label, value, hint, className }: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <Card className={cn("border-border/55 bg-gradient-to-br from-card/95 via-card/85 to-muted/[0.06]", className)}>
      <CardContent className="p-4 sm:p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">{label}</p>
        <p className="mt-2 font-mono text-2xl font-semibold tabular-nums">{value}</p>
        {hint ? <p className="mt-1.5 text-[11px] text-muted-foreground/80">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function PumpPickCard({ row }: { row: PumpfunUtilityPick }) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-muted/[0.08] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-mono text-sm font-semibold">{row.symbol}</p>
            <Badge variant="outline" className="rounded-lg text-[10px] capitalize">
              {projectTypeLabel(row.projectType)}
            </Badge>
            <Badge variant="outline" className={cn("rounded-lg text-[10px] uppercase", confidenceBadgeClass(row.confidence))}>
              {row.confidence}
            </Badge>
          </div>
          <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">{row.mint}</p>
        </div>
        <a
          href={`https://pump.fun/coin/${encodeURIComponent(row.mint)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 items-center rounded-xl border border-border/60 px-3 text-xs font-semibold text-primary"
        >
          Open
        </a>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-md border border-border/40 px-2 py-0.5 font-mono">Utility {row.utilityScore}</span>
        <span className="rounded-md border border-border/40 px-2 py-0.5 font-mono">Fit {row.learnedFitScore}</span>
        {row.marketCapUsd != null ? (
          <span className="rounded-md border border-border/40 px-2 py-0.5 font-mono">MC {formatCompactUsd(row.marketCapUsd)}</span>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground/95">{row.utilityThesis}</p>
      {row.website ? (
        <a href={row.website} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary">
          Website <ExternalLink className="h-3 w-3" />
        </a>
      ) : null}
    </div>
  );
}

function EcosystemPickCard({ row }: { row: EcosystemUtilityPick }) {
  return (
    <div className="rounded-xl border border-border/45 bg-muted/[0.06] p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.source} · {projectTypeLabel(row.projectType)}</p>
        </div>
        {row.link ? (
          <a href={row.link} target="_blank" rel="noopener noreferrer" className="text-primary" aria-label={`Open ${row.name}`}>
            <ArrowUpRight className="h-4 w-4" />
          </a>
        ) : null}
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{row.utility}</p>
    </div>
  );
}

export function PumpfunUtilityScoutTabPanel() {
  const briefQ = useQuery({
    queryKey: ["alpha", "pumpfun-utility-scout"],
    queryFn: () => fetchPumpfunUtilityScoutBrief(),
    staleTime: PUMPFUN_UTILITY_SCOUT_CLIENT_STALE_MS,
    refetchOnWindowFocus: false,
  });

  const data = briefQ.data?.data;
  const savedAt = briefQ.data?.savedAt;
  const nextRefreshAt = briefQ.data?.nextRefreshAt;
  const patterns = data?.meta.patternsLearned?.length ? data.meta.patternsLearned : data?.learnedProfile.patternsLearned ?? [];

  return (
    <div className="space-y-8 pb-10">
      <Card className="rounded-3xl border border-emerald-500/20">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-200">
                <Wrench className="h-3.5 w-3.5" aria-hidden />
                Separate agent
              </div>
              <h2 className="text-xl font-semibold sm:text-2xl">Utility Scout</h2>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Finds tech and utility projects — product language, links, and infra narratives — not pure meme tickers.
              </p>
              <p className="text-xs text-muted-foreground/75">
                Updated {savedAt ? formatTs(Date.parse(savedAt)) : "—"}
                {nextRefreshAt ? ` · next scan ~${formatTs(Date.parse(nextRefreshAt))}` : null}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="h-9 gap-2 rounded-xl" onClick={() => void briefQ.refetch()} disabled={briefQ.isFetching}>
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
          <KpiTile label="Utility picks" value={String(data.pumpfunUtilityPicks.length)} hint="Pump.fun tokens with product signals" className="ring-1 ring-emerald-500/15" />
          <KpiTile label="Ecosystem" value={String(data.ecosystemUtilityPicks.length)} hint="Registry / API / agent projects" />
          <KpiTile label="Memory" value={String(data.learnedProfile.sampleSize)} hint="Past utility flags learned" />
          <KpiTile label="Top type" value={data.learnedProfile.topProjectTypes[0]?.type ? projectTypeLabel(data.learnedProfile.topProjectTypes[0].type) : "—"} hint="Most common project category" />
        </div>
      ) : null}

      {briefQ.isError && !data ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium">Utility Scout is warming up</p>
            <p className="text-sm text-muted-foreground">{userReadableAlphaDataError((briefQ.error as Error | undefined)?.message)}</p>
          </CardContent>
        </Card>
      ) : null}

      {data ? (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-4 w-4 text-emerald-500" aria-hidden />
                {data.meta.scoutTitle}
              </CardTitle>
              <CardDescription>{data.meta.scoutSummary}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border/35 bg-background/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Utility patterns learned</p>
                <ul className="mt-2 space-y-2">
                  {patterns.length ? patterns.map((s, i) => <li key={`${s}-${i}`} className="text-sm text-muted-foreground">{s}</li>) : (
                    <li className="text-sm text-muted-foreground">Collecting utility history — patterns appear after validated tech picks.</li>
                  )}
                </ul>
              </div>
              <div className="rounded-xl border border-border/35 bg-background/30 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Caveats</p>
                <ul className="mt-2 space-y-2">
                  {data.meta.riskCaveats.map((s, i) => (
                    <li key={`${s}-${i}`} className="text-sm text-muted-foreground">{s}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-emerald-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Cpu className="h-4 w-4 text-emerald-500" aria-hidden />
                  Pump.fun utility picks
                </CardTitle>
                <CardDescription>Tokens with tech/product metadata — filtered away from pure meme plays.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.pumpfunUtilityPicks.length ? data.pumpfunUtilityPicks.map((p) => <PumpPickCard key={p.mint} row={p} />) : (
                  <p className="text-sm text-muted-foreground">No utility-grade pump.fun tokens in this scan.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Ecosystem utility radar</CardTitle>
                <CardDescription>Agents, APIs, and infra from on-chain registries and provider feeds.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.ecosystemUtilityPicks.length ? data.ecosystemUtilityPicks.map((p) => <EcosystemPickCard key={p.id} row={p} />) : (
                  <p className="text-sm text-muted-foreground">No ecosystem utility candidates this scan.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-4 w-4 opacity-70" aria-hidden />
                Utility memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.pastUtilityHistory.length ? (
                <ul className="divide-y divide-border/40 rounded-xl border border-border/40">
                  {data.pastUtilityHistory.slice(0, 10).map((h) => (
                    <li key={`${h.mint}-${h.flaggedAtMs}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-semibold">{h.symbol}</p>
                        <p className="text-xs text-muted-foreground">
                          {projectTypeLabel(h.projectType)} · score {h.utilityScore}
                          {h.marketCapUsd != null ? ` · MC ${formatCompactUsd(h.marketCapUsd)}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatTs(h.flaggedAtMs)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No utility history yet.</p>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
