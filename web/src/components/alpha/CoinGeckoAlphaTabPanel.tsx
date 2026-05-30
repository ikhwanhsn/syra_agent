import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowUpRight,
  Brain,
  Clock,
  Loader2,
  Newspaper,
  Sparkles,
  Target,
  TrendingUp,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  COINGECKO_ALPHA_CLIENT_STALE_MS,
  fetchCoingeckoAlphaBrief,
  type CoingeckoAlphaConfidence,
} from "@/lib/coingeckoAlphaApi";
import { userReadableAlphaDataError } from "@/lib/alphaIntelUi";

function formatPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function formatCompactUsd(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (abs >= 10_000) return `$${Math.round(n / 1000)}k`;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(n);
}

function formatTs(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function confidenceBadgeClass(c: CoingeckoAlphaConfidence): string {
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
    <Card
      className={cn(
        "relative overflow-hidden border-border/55 bg-gradient-to-br from-card/95 via-card/85 to-muted/[0.06] shadow-[0_1px_0_0_hsl(var(--border)/0.45)] backdrop-blur-sm",
        className,
      )}
    >
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

function formatNextRefresh(iso: string | null | undefined): string {
  if (!iso) return "about 24 hours";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "about 24 hours";
  }
}

export function CoinGeckoAlphaTabPanel() {
  const briefQ = useQuery({
    queryKey: ["alpha", "coingecko-brief"],
    queryFn: () => fetchCoingeckoAlphaBrief(),
    staleTime: COINGECKO_ALPHA_CLIENT_STALE_MS,
    gcTime: COINGECKO_ALPHA_CLIENT_STALE_MS,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const data = briefQ.data?.data;
  const savedAt = briefQ.data?.savedAt;
  const nextRefreshAt = briefQ.data?.nextRefreshAt;
  const isLoading = briefQ.isLoading;
  const isWarmingUp = briefQ.isError && !data;

  const topDigest = useMemo(() => data?.dailyDigests?.[0], [data]);

  return (
    <div className="space-y-8 pb-10 sm:pb-12 lg:pb-14">
      <Card className="border-border/55 bg-card/60 backdrop-blur-md">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div className="min-w-0 space-y-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/55 bg-background/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5 text-primary" aria-hidden />
              CoinGecko Intelligence
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Daily Gainer Radar</h2>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/90">
              Tracks the highest 24h gainers on CoinGecko, researches pump catalysts from news and X, learns from prior
              days, and surfaces forward-looking watch candidates. The feed updates once per day on the server — not on
              each visit.
            </p>
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground/75">
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {savedAt ? (
                <>
                  Screened {formatTs(savedAt)}
                  <span className="text-muted-foreground/55">· Next screen {formatNextRefresh(nextRefreshAt)}</span>
                </>
              ) : (
                <span>Daily screen runs about once every 24 hours</span>
              )}
              {data?.xApiEnabled === false ? (
                <span className="text-muted-foreground/60">· X research unavailable (no bearer token)</span>
              ) : null}
            </p>
          </div>

          <Badge
            variant="outline"
            className="h-fit shrink-0 rounded-xl border-border/60 bg-background/40 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Daily batch
          </Badge>
        </CardContent>
      </Card>

      {isWarmingUp ? (
        <Card className="border-border/55 bg-card/55">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" aria-hidden />
            <p className="text-sm font-medium text-foreground">Preparing today&apos;s CoinGecko screen</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {userReadableAlphaDataError((briefQ.error as Error | undefined)?.message)}
            </p>
            <p className="text-xs text-muted-foreground/70">
              Syra runs this automatically on a 24h schedule. Reload later — visiting this tab does not trigger a new
              scan.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-2xl" />
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="Top gainer"
            value={data.topGainer ? `${data.topGainer.symbol} ${formatPct(data.topGainer.priceChange24hPct)}` : "—"}
            hint={data.topGainer?.name}
            className="ring-1 ring-primary/10"
          />
          <KpiTile label="Market cap" value={formatCompactUsd(data.topGainer?.marketCapUsd)} hint="Top mover" />
          <KpiTile label="Researched" value={String(data.researchCount)} hint="Tokens with news + social pass" />
          <KpiTile label="Predictions" value={String(data.predictions.length)} hint="Forward watchlist (24–72h)" />
        </div>
      ) : null}

      {briefQ.isError && !isWarmingUp ? (
        <Card className="border-destructive/25 bg-destructive/[0.03]">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium text-foreground">Unable to load CoinGecko alpha</p>
            <p className="text-sm text-muted-foreground">
              {userReadableAlphaDataError((briefQ.error as Error | undefined)?.message)}
            </p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-xl"
              onClick={() => void briefQ.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !isWarmingUp && data ? (
        <>
          <div className="grid gap-6 xl:grid-cols-3">
            <Card className="border-border/55 bg-card/60 backdrop-blur-md xl:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                  {data.meta.narrativeTitle || "Today's narrative"}
                </CardTitle>
                <CardDescription>Cross-token patterns from today's gainers and prior daily history.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="rounded-2xl border border-border/40 bg-muted/[0.08] p-5">
                  <p className="text-sm leading-relaxed text-foreground/95">{data.meta.narrativeSummary}</p>
                </div>
                {data.meta.patternsLearned.length > 0 ? (
                  <div className="space-y-2 rounded-xl border border-border/35 bg-background/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">
                      Patterns learned
                    </p>
                    <ul className="space-y-2">
                      {data.meta.patternsLearned.map((s, i) => (
                        <li key={`${s}-${i}`} className="text-sm text-muted-foreground/95">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/55 bg-card/60 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-4 w-4 text-primary" aria-hidden />
                  Top mover deep dive
                </CardTitle>
                <CardDescription>{topDigest?.symbol ?? data.topGainer.symbol} catalyst read</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {topDigest ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                        {formatPct(topDigest.priceChange24hPct)}
                      </p>
                      <Badge variant="outline" className={cn("rounded-md text-[10px]", confidenceBadgeClass(topDigest.confidence))}>
                        {topDigest.confidence} confidence
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed text-foreground/95">{topDigest.pumpReason}</p>
                    {topDigest.catalysts.length > 0 ? (
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
                        {topDigest.catalysts.map((c) => (
                          <li key={c}>· {c}</li>
                        ))}
                      </ul>
                    ) : null}
                    <a
                      href={`https://www.coingecko.com/en/coins/${encodeURIComponent(topDigest.coinId)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      View on CoinGecko
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    </a>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No digest available.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/55 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-4 w-4 text-primary" aria-hidden />
                Forward predictions
              </CardTitle>
              <CardDescription>
                Tokens that may follow similar catalyst patterns in the next 24–72h — informational only, not advice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.predictions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No predictions in this brief yet. Run a fresh daily scan.</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {data.predictions.map((p) => (
                    <div
                      key={p.coinId}
                      className="rounded-2xl border border-border/40 bg-muted/[0.06] p-4 transition-colors hover:bg-muted/[0.1]"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-foreground">{p.symbol}</span>
                        <Badge variant="outline" className={cn("rounded-md text-[10px]", confidenceBadgeClass(p.confidence))}>
                          {p.confidence}
                        </Badge>
                        <Badge variant="secondary" className="rounded-md text-[10px] font-mono">
                          {p.timeframe}
                        </Badge>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90">{p.thesis}</p>
                      {p.catalystWatch.length > 0 ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Watch: {p.catalystWatch.join(" · ")}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/55 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Why they pumped today</CardTitle>
              <CardDescription>News headlines and X snippets ground each catalyst summary.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.dailyDigests.map((d) => (
                <div key={d.coinId} className="rounded-2xl border border-border/35 bg-background/25 p-4 sm:p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {d.image ? (
                        <img src={d.image} alt="" className="h-8 w-8 rounded-full" width={32} height={32} />
                      ) : null}
                      <div>
                        <p className="font-semibold text-foreground">
                          {d.symbol}{" "}
                          <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                            {formatPct(d.priceChange24hPct)}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground">{d.name}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("rounded-md text-[10px]", confidenceBadgeClass(d.confidence))}>
                      {d.confidence}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/95">{d.pumpReason}</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {d.newsHeadlines.length > 0 ? (
                      <div className="space-y-2 rounded-xl border border-border/30 bg-muted/[0.05] p-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <Newspaper className="h-3.5 w-3.5" aria-hidden />
                          News
                        </p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {d.newsHeadlines.slice(0, 4).map((h) => (
                            <li key={h} className="line-clamp-2">
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                    {d.xSnippets.length > 0 ? (
                      <div className="space-y-2 rounded-xl border border-border/30 bg-muted/[0.05] p-3">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          <Twitter className="h-3.5 w-3.5" aria-hidden />
                          X
                        </p>
                        <ul className="space-y-1 text-xs text-muted-foreground">
                          {d.xSnippets.slice(0, 3).map((s) => (
                            <li key={s} className="line-clamp-2">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/55 bg-card/60 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">24h gainers leaderboard</CardTitle>
              <CardDescription>Filtered universe (min market cap, excludes stables/wrapped).</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="pl-5">Token</TableHead>
                      <TableHead className="text-right">24h</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Mcap</TableHead>
                      <TableHead className="pr-5 text-right" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topGainers.slice(0, 20).map((t) => (
                      <TableRow key={t.id} className="border-border/35">
                        <TableCell className="pl-5 font-medium">
                          <div className="flex items-center gap-2">
                            {t.image ? (
                              <img src={t.image} alt="" className="h-6 w-6 rounded-full" width={24} height={24} />
                            ) : null}
                            <span>
                              {t.symbol}
                              <span className="ml-1.5 text-xs font-normal text-muted-foreground">{t.name}</span>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm tabular-nums text-emerald-600 dark:text-emerald-400">
                          {formatPct(t.priceChange24hPct)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                          {formatCompactUsd(t.priceUsd)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                          {formatCompactUsd(t.marketCapUsd)}
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <a
                            href={`https://www.coingecko.com/en/coins/${encodeURIComponent(t.id)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 text-primary hover:bg-muted/40"
                            aria-label={`Open ${t.symbol} on CoinGecko`}
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                          </a>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {data.history.length > 0 ? (
            <Card className="border-border/55 bg-card/60 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Learning log</CardTitle>
                <CardDescription>Prior daily top gainers used to improve forward predictions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.history.slice(0, 10).map((h) => (
                    <div
                      key={h.date}
                      className="flex flex-col gap-1 rounded-xl border border-border/35 bg-background/25 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-muted-foreground">{h.date}</span>
                        <span className="font-semibold text-foreground">{h.topGainerSymbol}</span>
                        <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
                          {formatPct(h.topGainerChangePct)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground sm:max-w-[55%] sm:text-right">{h.pumpReasonSummary}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {data.meta.riskCaveats.length > 0 ? (
            <Card className="border-amber-500/20 bg-amber-500/[0.04]">
              <CardContent className="flex gap-3 p-5">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {data.meta.riskCaveats.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
