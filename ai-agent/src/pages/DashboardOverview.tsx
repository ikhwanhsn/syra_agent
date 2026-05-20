import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  Crosshair,
  Droplets,
  FlaskConical,
  Lock,
  Activity,
  ChevronRight,
  Telescope,
  Rocket,
  Scale,
  Twitter,
  UsersRound,
  Wifi,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";
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
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { fetchTradingExperimentStats } from "@/lib/tradingExperimentApi";
import { fetchArbitrageSnapshot, fetchCmcTop } from "@/lib/arbitrageExperimentApi";
import { fetchLpStats } from "@/lib/lpAgentExperimentApi";
import { fetchXProjectsAnalyze } from "@/lib/xProjectsAnalyzeApi";
import { fetchPumpfunAlphaTrend } from "@/lib/pumpfunAlphaTrendApi";
import { fetchRiseAlphaMarketsBundle } from "@/lib/riseMarketsApi";
import {
  fetchAgentTeamLatest,
  fetchGrowthSectorNarrativeLatest,
  fetchGrowthSyraMarketLatest,
  fetchGrowthSyraSocialLatest,
  fetchHrCoachLatest,
  fetchX402XTrendsLatest,
} from "@/lib/internalTeamAgentsApi";
import {
  aggregateLpAgents,
  aggregatePumpfunExperiment,
  aggregateRiseExperiment,
  aggregateTradingAgents,
  formatCompactUsd,
  formatPct,
  formatSol,
  sortXBatchByScore,
} from "@/lib/dashboardOverviewAggregates";
import { fetchPumpfunExperimentLedger } from "@/lib/pumpfunExperimentApi";
import { fetchRiseExperimentLedger } from "@/lib/riseExperimentApi";
import { gradeBadgeClass, formatFollowers, userReadableAlphaDataError } from "@/lib/alphaIntelUi";
import { Skeleton } from "@/components/ui/skeleton";
import { CoingeckoBatchImageProvider } from "@/contexts/CoingeckoBatchImageContext";
import { CoinLogo } from "@/components/crypto/CoinLogo";
import { OverviewStatCard } from "@/components/dashboard/overview/OverviewStatCard";
import { OverviewHero } from "@/components/dashboard/overview/OverviewHero";
import { OverviewGroupLabel } from "@/components/dashboard/overview/OverviewGroupLabel";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { useWalletContext } from "@/contexts/WalletContext";
import { isInternalTeamMonitorWallet } from "@/constants/internalTeamMonitorWallet";
import { INTERNAL_AGENTS } from "@/lib/internalAgentsCatalog";

const STALE_MS = 60_000;
/** Alpha X batch is DB-backed; server agent refreshes ~every 24h. */
const ALPHA_STALE_MS = 24 * 60 * 60 * 1000;

const wlChartConfig = {
  wins: { label: "Wins", color: "hsl(var(--foreground))" },
  losses: { label: "Losses", color: "hsl(var(--muted-foreground))" },
} satisfies ChartConfig;

const venueChartConfig = {
  ok: { label: "Live", color: "hsl(var(--foreground))" },
  err: { label: "Unavailable", color: "hsl(var(--destructive))" },
} satisfies ChartConfig;

function formatAlphaXBatchUpdatedAt(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return null;
  }
}

export interface DashboardOverviewProps {
  embedded?: boolean;
}

export default function DashboardOverview({ embedded = false }: DashboardOverviewProps) {
  const { address } = useWalletContext();
  const showInternal = isInternalTeamMonitorWallet(address);

  const queries = useQueries({
    queries: [
      {
        queryKey: ["dashboard-overview", "trading-stats"],
        queryFn: () => fetchTradingExperimentStats("primary"),
        staleTime: STALE_MS,
      },
      {
        queryKey: ["dashboard-overview", "arbitrage"],
        queryFn: () => fetchArbitrageSnapshot({}),
        staleTime: 30_000,
      },
      {
        queryKey: ["dashboard-overview", "cmc-top"],
        queryFn: () => fetchCmcTop({ limit: 12 }),
        staleTime: 120_000,
      },
      {
        queryKey: ["dashboard-overview", "alpha-x"],
        queryFn: () => fetchXProjectsAnalyze({ type: "x402", max_results: 20, includeAiSummary: false }),
        staleTime: ALPHA_STALE_MS,
      },
      {
        queryKey: ["dashboard-overview", "pumpfun-trend"],
        queryFn: () => fetchPumpfunAlphaTrend("today"),
        staleTime: 120_000,
      },
      {
        queryKey: ["dashboard-overview", "rise-markets"],
        queryFn: () => fetchRiseAlphaMarketsBundle(),
        staleTime: STALE_MS,
      },
      {
        queryKey: ["dashboard-overview", "lp-stats"],
        queryFn: () => fetchLpStats(),
        staleTime: STALE_MS,
      },
      {
        queryKey: ["dashboard-overview", "pumpfun-ledger"],
        queryFn: () => fetchPumpfunExperimentLedger(),
        staleTime: STALE_MS,
      },
      {
        queryKey: ["dashboard-overview", "rise-ledger"],
        queryFn: () => fetchRiseExperimentLedger(),
        staleTime: STALE_MS,
      },
      {
        queryKey: ["dashboard-overview", "internal-agent-team"],
        queryFn: () => fetchAgentTeamLatest(),
        staleTime: 45_000,
        enabled: showInternal,
      },
      {
        queryKey: ["dashboard-overview", "internal-x402"],
        queryFn: () => fetchX402XTrendsLatest(),
        staleTime: 45_000,
        enabled: showInternal,
      },
      {
        queryKey: ["dashboard-overview", "internal-growth-market"],
        queryFn: () => fetchGrowthSyraMarketLatest(),
        staleTime: 45_000,
        enabled: showInternal,
      },
      {
        queryKey: ["dashboard-overview", "internal-growth-social"],
        queryFn: () => fetchGrowthSyraSocialLatest(),
        staleTime: 45_000,
        enabled: showInternal,
      },
      {
        queryKey: ["dashboard-overview", "internal-growth-sector"],
        queryFn: () => fetchGrowthSectorNarrativeLatest(),
        staleTime: 45_000,
        enabled: showInternal,
      },
      {
        queryKey: ["dashboard-overview", "internal-hr-coach"],
        queryFn: () => fetchHrCoachLatest(),
        staleTime: 45_000,
        enabled: showInternal,
      },
    ],
  });

  const [
    tradeQ,
    arbQ,
    cmcQ,
    alphaXQ,
    pumpfunTrendQ,
    riseMarketsQ,
    lpStatsQ,
    pumpfunLedgerQ,
    riseLedgerQ,
    agentTeamQ,
    x402InternalQ,
    growthMarketQ,
    growthSocialQ,
    growthSectorQ,
    hrCoachQ,
  ] = queries;

  const tradingAgents = tradeQ.data?.agents ?? [];
  const tradingStrategies = tradeQ.data?.strategies ?? [];
  const tradingTotals = useMemo(() => aggregateTradingAgents(tradingAgents), [tradingAgents]);

  const venueStats = useMemo(() => {
    const venues = arbQ.data?.venues ?? [];
    let ok = 0;
    let err = 0;
    for (const v of venues) {
      if (v.ok) ok += 1;
      else err += 1;
    }
    return { ok, err, token: arbQ.data?.token ?? "—", spread: arbQ.data?.strategy?.grossSpreadPct };
  }, [arbQ.data]);

  const cmcBarData = useMemo(
    () =>
      (cmcQ.data?.assets ?? []).map((a) => ({
        symbol: a.symbol,
        rank: a.cmcRank,
        score: Math.max(1, 51 - Math.min(50, a.cmcRank)),
      })),
    [cmcQ.data?.assets],
  );

  const sortedXItems = useMemo(
    () => sortXBatchByScore(alphaXQ.data?.items ?? []).slice(0, 6),
    [alphaXQ.data?.items],
  );

  const alphaXUpdatedLabel = useMemo(
    () => formatAlphaXBatchUpdatedAt(alphaXQ.data?.updatedAt),
    [alphaXQ.data?.updatedAt],
  );

  const alphaXBatchHint = useMemo(() => {
    if (!alphaXQ.data) return "x402 watchlist · refreshes ~every 24h";
    const scored = `${alphaXQ.data.summary.succeeded}/${alphaXQ.data.summary.total} scored · ${alphaXQ.data.summary.failed} failed`;
    return alphaXUpdatedLabel ? `${scored} · updated ${alphaXUpdatedLabel}` : scored;
  }, [alphaXQ.data, alphaXUpdatedLabel]);

  const topPumpTokens = useMemo(
    () =>
      [...(pumpfunTrendQ.data?.tokens ?? [])]
        .sort((a, b) => (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0))
        .slice(0, 6),
    [pumpfunTrendQ.data?.tokens],
  );

  const topRiseMarkets = useMemo(
    () =>
      [...(riseMarketsQ.data?.markets ?? [])]
        .sort((a, b) => (b.marketCapUsd ?? 0) - (a.marketCapUsd ?? 0))
        .slice(0, 6),
    [riseMarketsQ.data?.markets],
  );

  const pumpfunPaper = useMemo(
    () => (pumpfunLedgerQ.data ? aggregatePumpfunExperiment(pumpfunLedgerQ.data) : null),
    [pumpfunLedgerQ.data],
  );
  const risePaper = useMemo(
    () => (riseLedgerQ.data ? aggregateRiseExperiment(riseLedgerQ.data) : null),
    [riseLedgerQ.data],
  );
  const lpTotals = useMemo(() => aggregateLpAgents(lpStatsQ.data?.agents ?? []), [lpStatsQ.data?.agents]);

  const internalPipelineCount = useMemo(() => {
    if (!showInternal) return 0;
    return [
      agentTeamQ.data?.data,
      x402InternalQ.data?.data,
      growthMarketQ.data?.data,
      growthSocialQ.data?.data,
      growthSectorQ.data?.data,
      hrCoachQ.data?.data,
    ].filter(Boolean).length;
  }, [
    showInternal,
    agentTeamQ.data,
    x402InternalQ.data,
    growthMarketQ.data,
    growthSocialQ.data,
    growthSectorQ.data,
    hrCoachQ.data,
  ]);

  return (
    <div className={cn("relative flex flex-col min-h-0", embedded ? "flex-1 min-h-0" : "min-h-screen")}>
      <OverviewPageBackdrop />
      <div
        className={cn(DASHBOARD_CONTENT_SHELL, "relative flex-1 space-y-8", PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM)}
      >
        <OverviewHero
          liveSignals={
            <>
              <Badge variant="secondary" className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-1 font-medium backdrop-blur-md">
                <Activity className="mr-1.5 h-3 w-3 opacity-80" aria-hidden />
                {queries.filter((q) => q.isSuccess).length} feeds live
              </Badge>
              {queries.some((q) => q.isLoading) ? (
                <Badge variant="outline" className="rounded-lg border-border/50 bg-background/25 px-2.5 py-1 font-medium backdrop-blur-md">
                  Syncing {queries.filter((q) => q.isLoading).length}
                </Badge>
              ) : null}
            </>
          }
        />
        <OverviewGroupLabel icon={Telescope}>Alpha intelligence</OverviewGroupLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <OverviewStatCard
              label="X · x402 batch"
              icon={Twitter}
              accent="alpha"
              isLoading={alphaXQ.isLoading}
              value={alphaXQ.isError ? "—" : alphaXQ.data?.summary.averageScore ?? "—"}
              hint={alphaXBatchHint}
              href="/dashboard/alpha?tab=x"
              error={alphaXQ.isError}
            />
            <OverviewStatCard
              label="Pump.fun trend"
              icon={Rocket}
              accent="alpha"
              isLoading={pumpfunTrendQ.isLoading}
              value={pumpfunTrendQ.isError ? "—" : String(pumpfunTrendQ.data?.matchedCount ?? "—")}
              hint={
                pumpfunTrendQ.data
                  ? `${pumpfunTrendQ.data.tokens.length} tokens · ${pumpfunTrendQ.data.analysis.watchlist.length} watchlist`
                  : "Graduate candidates (today)"
              }
              href="/dashboard/alpha"
              error={pumpfunTrendQ.isError}
            />
            <OverviewStatCard
              label="Rise markets"
              icon={Crosshair}
              accent="alpha"
              isLoading={riseMarketsQ.isLoading}
              value={riseMarketsQ.isError ? "—" : String(riseMarketsQ.data?.markets.length ?? "—")}
              hint="Listed Rise alpha markets (deduped)"
              href="/dashboard/alpha"
              error={riseMarketsQ.isError}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className={cn(overviewCardShell, 'overflow-hidden')}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-[13px] font-semibold tracking-tight">Top X accounts</CardTitle>
                    <CardDescription>
                      {alphaXUpdatedLabel
                        ? `By intelligence score · updated ${alphaXUpdatedLabel} · ~24h refresh`
                        : "By intelligence score · curated x402 watchlist (~24h refresh)"}
                    </CardDescription>
                  </div>
                  <Link
                    to="/dashboard/alpha?tab=x"
                    className="shrink-0 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    View all
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {alphaXQ.isLoading ? (
                  <div className="space-y-0 divide-y divide-border/40 px-4 pb-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0 flex-1 space-y-2">
                          <Skeleton className="h-4 w-28" />
                          <Skeleton className="h-3 w-36" />
                        </div>
                        <Skeleton className="h-5 w-10" />
                      </div>
                    ))}
                  </div>
                ) : alphaXQ.isError ? (
                  <p className="px-4 pb-4 text-sm text-muted-foreground">
                    {userReadableAlphaDataError((alphaXQ.error as Error)?.message) ||
                      "Could not load the x402 watchlist."}
                  </p>
                ) : sortedXItems.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-muted-foreground">
                    Watchlist is warming up — scores update about once every 24 hours.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedXItems.map((item) =>
                        item.ok ? (
                          <TableRow key={item.username}>
                            <TableCell>
                              <Link
                                to={`/dashboard/alpha/x/${encodeURIComponent(item.username)}`}
                                className="font-medium hover:underline"
                              >
                                @{item.username}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className={cn("text-[10px] px-1.5", gradeBadgeClass(item.analysis.grade))}>
                                  {item.analysis.grade}
                                </Badge>
                                <span className="text-[11px] text-muted-foreground">
                                  {formatFollowers(item.analysis.user?.public_metrics?.followers_count)} followers
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono tabular-nums">{item.analysis.score}</TableCell>
                          </TableRow>
                        ) : (
                          <TableRow key={item.username}>
                            <TableCell className="text-muted-foreground">@{item.username}</TableCell>
                            <TableCell className="text-right text-destructive text-xs">Failed</TableCell>
                          </TableRow>
                        ),
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className={cn(overviewCardShell, 'overflow-hidden')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-semibold tracking-tight">Top pump.fun tokens</CardTitle>
                <CardDescription>By market cap (today)</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {topPumpTokens.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-muted-foreground">No tokens in trend feed.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Token</TableHead>
                        <TableHead className="text-right">MCap</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPumpTokens.map((t) => (
                        <TableRow key={t.mint}>
                          <TableCell>
                            <span className="font-medium">{t.symbol}</span>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[140px]">{t.name}</p>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs tabular-nums">
                            {formatCompactUsd(t.marketCapUsd)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className={cn(overviewCardShell, 'overflow-hidden')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-[13px] font-semibold tracking-tight">Top Rise markets</CardTitle>
                <CardDescription>By market cap</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {riseMarketsQ.isError ? (
                  <p className="px-4 pb-4 text-sm text-destructive">Could not load Rise markets.</p>
                ) : topRiseMarkets.length === 0 ? (
                  <p className="px-4 pb-4 text-sm text-muted-foreground">No markets returned.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Market</TableHead>
                        <TableHead className="text-right">MCap</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topRiseMarkets.map((m) => (
                        <TableRow key={m.mint}>
                          <TableCell>
                            <span className="font-medium">{m.symbol ?? m.name ?? "—"}</span>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs tabular-nums">
                            {formatCompactUsd(m.marketCapUsd)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

        <OverviewGroupLabel icon={FlaskConical}>Experiments</OverviewGroupLabel>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3">
            <OverviewStatCard
              label="Trading lab"
              icon={FlaskConical}
              accent="experiment"
              isLoading={tradeQ.isLoading}
              value={tradeQ.isError ? "—" : tradingTotals.agentCount.toLocaleString()}
              hint={`${tradingStrategies.length} strategies · ${tradingTotals.wins}W / ${tradingTotals.losses}L · ${tradingTotals.open} open`}
              href="/dashboard/trading-experiment"
              error={tradeQ.isError}
            />
            <OverviewStatCard
              label="Arbitrage"
              icon={Scale}
              accent="experiment"
              isLoading={arbQ.isLoading}
              value={
                arbQ.isError
                  ? "—"
                  : venueStats.spread != null
                    ? `${venueStats.spread >= 0 ? "+" : ""}${venueStats.spread.toFixed(2)}%`
                    : "—"
              }
              hint={`${venueStats.ok} live / ${venueStats.err} down · ${venueStats.token}`}
              href="/dashboard/arbitrage-experiment"
              error={arbQ.isError}
            />
            <OverviewStatCard
              label="LP agent lab"
              icon={Droplets}
              accent="experiment"
              isLoading={lpStatsQ.isLoading}
              value={lpStatsQ.isError ? "—" : String(lpTotals.agentCount)}
              hint={`${lpTotals.wins}W / ${lpTotals.losses}L · ${lpTotals.open} open · ${lpTotals.expired} expired`}
              href="/dashboard/lp-experiment"
              error={lpStatsQ.isError}
            />
            <OverviewStatCard
              label="Pumpfun desk"
              icon={Rocket}
              accent="experiment"
              isLoading={pumpfunLedgerQ.isLoading}
              value={pumpfunPaper ? formatSol(pumpfunPaper.totalEquity) : "—"}
              hint={
                pumpfunPaper
                  ? `${pumpfunPaper.activeCells} desks · ${pumpfunPaper.openPositions} open · avg ${formatPct(pumpfunPaper.avgReturnPct)}`
                  : "Paper sim ledger"
              }
              href="/dashboard/pumpfun-experiment"
              error={pumpfunLedgerQ.isError}
            />
            <OverviewStatCard
              label="Rise desk"
              icon={Crosshair}
              accent="experiment"
              isLoading={riseLedgerQ.isLoading}
              value={risePaper ? formatSol(risePaper.totalEquity) : "—"}
              hint={
                risePaper
                  ? `${risePaper.openPositions} open across 2 agents · ${risePaper.discoveries} discoveries`
                  : "Paper sim ledger"
              }
              href="/dashboard/rise-experiment"
              error={riseLedgerQ.isError}
            />
            <OverviewStatCard
              label="CMC top assets"
              icon={Wifi}
              accent="experiment"
              isLoading={cmcQ.isLoading}
              value={cmcQ.isError ? "—" : String(cmcBarData.length)}
              hint={cmcQ.data?.source === "coinmarketcap" ? "Live CoinMarketCap ranks" : "Cached fallback list"}
              href="/dashboard/arbitrage-experiment"
              error={cmcQ.isError}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className={overviewCardShell}>
              <CardHeader>
                <CardTitle className="text-base">Trading desk — resolved outcomes</CardTitle>
                <CardDescription>Primary suite wins vs losses</CardDescription>
              </CardHeader>
              <CardContent className="h-[240px]">
                {tradeQ.isError ? (
                  <p className="text-sm text-destructive">Could not load trading stats.</p>
                ) : tradingTotals.wins + tradingTotals.losses === 0 ? (
                  <p className="text-sm text-muted-foreground">No resolved wins/losses yet.</p>
                ) : (
                  <ChartContainer config={wlChartConfig} className="h-full w-full aspect-auto">
                    <BarChart
                      data={[{ label: "All agents", wins: tradingTotals.wins, losses: tradingTotals.losses }]}
                      margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} width={48} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="wins" stackId="a" fill="var(--color-wins)" />
                      <Bar dataKey="losses" stackId="a" fill="var(--color-losses)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className={overviewCardShell}>
              <CardHeader>
                <CardTitle className="text-base">Arbitrage — venue health</CardTitle>
                <CardDescription>
                  Price feeds for <span className="font-medium text-foreground">{venueStats.token}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[240px]">
                {arbQ.isError ? (
                  <p className="text-sm text-destructive">Could not load arbitrage snapshot.</p>
                ) : venueStats.ok + venueStats.err === 0 ? (
                  <p className="text-sm text-muted-foreground">No venue rows returned.</p>
                ) : (
                  <ChartContainer config={venueChartConfig} className="h-full w-full aspect-auto">
                    <BarChart
                      data={[{ label: "Venues", ok: venueStats.ok, err: venueStats.err }]}
                      margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="ok" stackId="v" fill="var(--color-ok)" />
                      <Bar dataKey="err" stackId="v" fill="var(--color-err)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card className={cn(overviewCardShell, 'lg:col-span-2')}>
              <CardHeader>
                <CardTitle className="text-base">Market cap rank (top assets)</CardTitle>
                <CardDescription>Lower bar = higher CMC rank</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                {cmcBarData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No assets returned.</p>
                ) : (
                  <CoingeckoBatchImageProvider symbols={cmcBarData.map((d) => d.symbol)}>
                    <ChartContainer
                      config={{ score: { label: "Rank score", color: "hsl(var(--accent))" } }}
                      className="h-full w-full aspect-auto"
                    >
                      <BarChart data={cmcBarData} margin={{ left: 8, right: 8, top: 8, bottom: 48 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="symbol" tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={52} />
                        <YAxis tickLine={false} axisLine={false} width={32} />
                        <Tooltip
                          cursor={{ fill: "hsl(var(--muted) / 0.2)" }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.[0]) return null;
                            const row = payload[0].payload as { symbol: string; rank: number };
                            return (
                              <div className="rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs shadow-md">
                                <div className="flex items-center gap-2">
                                  <CoinLogo symbol={row.symbol} size="xs" />
                                  <div>
                                    <p className="font-medium">{row.symbol}</p>
                                    <p className="text-muted-foreground">CMC rank #{row.rank}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          }}
                        />
                        <Bar dataKey="score" fill="var(--color-score)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </CoingeckoBatchImageProvider>
                )}
              </CardContent>
            </Card>
          </div>
        {showInternal ? (
          <>
            <OverviewGroupLabel icon={UsersRound}>Internal agents</OverviewGroupLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <OverviewStatCard
                label="Pipelines with data"
                accent="internal"
                value={`${internalPipelineCount} / ${INTERNAL_AGENTS.length}`}
                hint="Latest saved runs across internal growth agents"
                href="/dashboard/internal-team-agents"
              />
              <OverviewStatCard
                label="Access"
                accent="internal"
                icon={Lock}
                value={
                  <span className="flex items-center gap-1.5 text-base">
                    <Lock className="w-4 h-4" /> Authorized
                  </span>
                }
                hint="Your wallet is on the internal monitor allowlist"
                href="/dashboard/internal-team-agents"
              />
            </div>

            <Card className={cn(overviewCardShell, 'divide-y divide-border/60')}>
              {INTERNAL_AGENTS.map((agent) => {
                const qMap = {
                  "agent-team": agentTeamQ,
                  "x402-pulse": x402InternalQ,
                  "growth-syra-market": growthMarketQ,
                  "growth-syra-social": growthSocialQ,
                  "growth-sector-narrative": growthSectorQ,
                  "hr-coach": hrCoachQ,
                } as const;
                const q = qMap[agent.slug];
                const hasData = Boolean(q.data?.data);
                const savedAt = q.data?.savedAt;

                return (
                  <Link
                    key={agent.slug}
                    to={`/dashboard/internal-team-agents/${agent.slug}`}
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3.5 transition-colors hover:bg-muted/25"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {q.isLoading ? (
                        <Badge variant="secondary">Loading</Badge>
                      ) : q.isError ? (
                        <Badge variant="destructive">Error</Badge>
                      ) : hasData ? (
                        <Badge className="bg-emerald-600/90">Has data</Badge>
                      ) : (
                        <Badge variant="outline">No run yet</Badge>
                      )}
                      {savedAt ? (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {new Date(savedAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      ) : null}
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                    </div>
                  </Link>
                );
              })}
            </Card>
          </>
        ) : null}
      </div>
    </div>
  );
}
