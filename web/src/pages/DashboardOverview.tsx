import { useMemo } from "react";
import { Link } from "@/lib/navigation";
import {
  Activity,
  Bot,
  ChevronRight,
  Droplets,
  FlaskConical,
  Lock,
  Plus,
  Scale,
  Telescope,
  TrendingUp,
  UsersRound,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DASHBOARD_CONTENT_SHELL, PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM } from "@/lib/layoutConstants";
import { formatCompactUsd, formatSol } from "@/lib/dashboardOverviewAggregates";
import { fetchGrowthScoutLatest, fetchPartnershipScoutLatest, fetchTrendScoutLatest } from "@/lib/internalTeamAgentsApi";
import { useQueries } from "@tanstack/react-query";
import { OverviewStatCard } from "@/components/dashboard/overview/OverviewStatCard";
import { OverviewGroupLabel } from "@/components/dashboard/overview/OverviewGroupLabel";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { OverviewTreasuryAllocationChart } from "@/components/dashboard/overview/OverviewTreasuryAllocationChart";
import { OverviewTradingAnalyticsPanel } from "@/components/dashboard/overview/OverviewTradingAnalyticsPanel";
import { OverviewLpAnalyticsPanel } from "@/components/dashboard/overview/OverviewLpAnalyticsPanel";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { UserOverviewConnectHero } from "@/components/dashboard/overview/UserOverviewHero";
import { OverviewPortfolioCommandBar } from "@/components/dashboard/overview/OverviewPortfolioCommandBar";
import { TreasurySplitCardGrid } from "@/components/dashboard/overview/TreasurySplitCard";
import { useWalletContext } from "@/contexts/WalletContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { isInternalTeamMonitorWallet } from "@/constants/internalTeamMonitorWallet";
import { INTERNAL_AGENTS } from "@/lib/internalAgentsCatalog";
import { INTERNAL_BASE_PATH, internalAgentPath, internalPartnershipBoardPath } from "@/lib/internalRoutes";
import { useUserDashboardOverview } from "@/hooks/useUserDashboardOverview";
import { useTreasuryBalanceChange } from "@/hooks/useTreasuryBalanceChange";
import { AgentBillingDashboard } from "@/components/wallet/AgentBillingDashboard";

const STALE_MS = 45_000;

export interface DashboardOverviewProps {
  embedded?: boolean;
}

export default function DashboardOverview({ embedded = false }: DashboardOverviewProps) {
  const { address } = useWalletContext();
  const { openConnectModal } = useConnectModal();
  const showInternal = isInternalTeamMonitorWallet(address);
  const overview = useUserDashboardOverview();
  const balanceChanges = useTreasuryBalanceChange(
    overview.address,
    {
      userUsdc: overview.treasury.userUsdc,
      userSol: overview.treasury.userSol,
      chatUsdc: overview.treasury.chatUsdc,
      chatSol: overview.treasury.chatSol,
      lpUsdc: overview.treasury.lpUsdc,
      lpSol: overview.treasury.lpSol,
      totalUsd: overview.treasury.totalUsd,
      totalUsdc: overview.treasury.totalUsdc,
      agentUsdc: overview.treasury.agentUsdc,
      solPriceUsd: overview.treasury.solPriceUsd,
    },
    overview.balancesLoading,
  );

  const internalQueries = useQueries({
    queries: [
      {
        queryKey: ["dashboard-overview", "internal-trend-scout"],
        queryFn: () => fetchTrendScoutLatest(),
        staleTime: STALE_MS,
        enabled: showInternal,
      },
      {
        queryKey: ["dashboard-overview", "internal-partnership-scout"],
        queryFn: () => fetchPartnershipScoutLatest(),
        staleTime: STALE_MS,
        enabled: showInternal,
      },
      {
        queryKey: ["dashboard-overview", "internal-growth-scout"],
        queryFn: () => fetchGrowthScoutLatest(),
        staleTime: STALE_MS,
        enabled: showInternal,
      },
    ],
  });

  const [trendScoutQ, partnershipScoutQ, growthScoutQ] = internalQueries;

  const internalPipelineCount = useMemo(() => {
    if (!showInternal) return 0;
    return [trendScoutQ.data?.data, partnershipScoutQ.data?.data, growthScoutQ.data?.data].filter(Boolean).length;
  }, [showInternal, trendScoutQ.data, partnershipScoutQ.data, growthScoutQ.data]);

  const lpSummary = overview.lpSummaryQ.data;
  const lpState = overview.lpStateQ.data;
  const tradingAgents = overview.tradingStatsQ.data?.agents ?? [];
  const topStrategies = useMemo(
    () => [...tradingAgents].sort((a, b) => (b.wins ?? 0) - (a.wins ?? 0)).slice(0, 5),
    [tradingAgents],
  );

  const walletLabel = overview.shortAddress ?? undefined;
  const showPortfolio = overview.connected;

  return (
    <div className={cn("relative flex flex-col min-h-0", embedded ? "flex-1 min-h-0" : "min-h-screen")}>
      <OverviewPageBackdrop />
      <div
        className={cn(DASHBOARD_CONTENT_SHELL, "relative flex-1 space-y-6", PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM)}
      >
        {!showPortfolio ? (
          <UserOverviewConnectHero onConnect={() => openConnectModal()} />
        ) : (
          <OverviewPortfolioCommandBar
            walletLabel={walletLabel}
            isLoading={overview.balancesLoading}
            refreshing={overview.refreshing}
            onRefresh={() => void overview.refreshAll()}
            liveSignals={
              <>
                <Badge
                  variant="secondary"
                  className="rounded-lg border border-border/50 bg-background/40 px-2.5 py-1 font-medium backdrop-blur-md"
                >
                  <Activity className="mr-1.5 h-3 w-3 opacity-80" aria-hidden />
                  Live
                </Badge>
                {overview.wallets.managedChatWallet ? (
                  <Badge
                    variant="outline"
                    className="rounded-lg border-border/50 bg-background/25 px-2.5 py-1 font-medium backdrop-blur-md"
                  >
                    Trading ready
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="rounded-lg border-amber-500/30 bg-amber-500/5 px-2.5 py-1 font-medium text-amber-700 dark:text-amber-400 backdrop-blur-md"
                  >
                    Set up agent
                  </Badge>
                )}
              </>
            }
          />
        )}

        {showPortfolio ? (
          <>
            <AgentBillingDashboard />
            {/* Charts first — primary bento */}
            <OverviewTreasuryAllocationChart
              loading={overview.balancesLoading}
              totalChange={balanceChanges.total}
              historyPoints={balanceChanges.chartPoints}
              treasury={{
                userUsdc: overview.treasury.userUsdc,
                userSol: overview.treasury.userSol,
                chatUsdc: overview.treasury.chatUsdc,
                chatSol: overview.treasury.chatSol,
                lpUsdc: overview.treasury.lpUsdc,
                lpSol: overview.treasury.lpSol,
                totalUsd: overview.treasury.totalUsd,
                totalUsdc: overview.treasury.totalUsdc,
                totalSol: overview.treasury.totalSol,
                solPriceUsd: overview.treasury.solPriceUsd,
              }}
            />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <OverviewTradingAnalyticsPanel
                className="xl:col-span-7"
                agents={tradingAgents}
                wins={overview.tradingTotals.wins}
                losses={overview.tradingTotals.losses}
                open={overview.tradingTotals.open}
                loading={overview.tradingStatsQ.isLoading}
                error={overview.tradingStatsQ.isError}
              />
              <OverviewLpAnalyticsPanel
                className="xl:col-span-5"
                summary={lpSummary ?? undefined}
                loading={overview.lpSummaryQ.isLoading}
              />
            </div>

            <OverviewGroupLabel icon={Wallet}>Treasury</OverviewGroupLabel>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <OverviewStatCard
                compact
                label="Total assets"
                icon={Wallet}
                accent="marketplace"
                isLoading={overview.balancesLoading}
                change={balanceChanges.total}
                value={
                  overview.treasury.totalUsd != null
                    ? formatCompactUsd(overview.treasury.totalUsd)
                    : overview.treasury.totalUsdc != null
                      ? formatCompactUsd(overview.treasury.totalUsdc)
                      : "—"
                }
                hint={
                  overview.treasury.totalSol != null
                    ? `${formatSol(overview.treasury.totalSol)} SOL total`
                    : "All wallets"
                }
                href="/wallet"
              />
              <OverviewStatCard
                compact
                label="Trading agent"
                icon={Bot}
                accent="experiment"
                isLoading={overview.balancesLoading}
                change={balanceChanges.trading}
                value={
                  overview.treasury.chatUsdc != null
                    ? formatCompactUsd(overview.treasury.chatUsdc)
                    : "—"
                }
                hint={
                  overview.treasury.chatSol != null
                    ? `${formatSol(overview.treasury.chatSol)} SOL`
                    : "Spot treasury"
                }
                href="/wallet?wallet=chat"
              />
              <OverviewStatCard
                compact
                label="LP agent"
                icon={Droplets}
                accent="experiment"
                isLoading={overview.balancesLoading}
                change={balanceChanges.lp}
                value={
                  overview.treasury.lpUsdc != null ? formatCompactUsd(overview.treasury.lpUsdc) : "—"
                }
                hint={
                  overview.treasury.lpSol != null
                    ? `${formatSol(overview.treasury.lpSol)} SOL`
                    : "Meteora DLMM"
                }
                href="/wallet?wallet=lp"
              />
              <OverviewStatCard
                compact
                label="Agent capital"
                icon={TrendingUp}
                accent="neutral"
                isLoading={overview.balancesLoading}
                change={balanceChanges.agent}
                value={
                  overview.treasury.agentUsdc != null
                    ? formatCompactUsd(overview.treasury.agentUsdc)
                    : "—"
                }
                hint="Trading + LP USDC"
                href="/wallet"
              />
            </div>

            <TreasurySplitCardGrid
              loading={overview.balancesLoading}
              connectedWallet={{
                usdc: overview.treasury.userUsdc,
                sol: overview.treasury.userSol,
              }}
              trading={{
                usdc: overview.treasury.chatUsdc,
                sol: overview.treasury.chatSol,
              }}
              lp={{
                usdc: overview.treasury.lpUsdc,
                sol: overview.treasury.lpSol,
              }}
              changes={{
                user: balanceChanges.user,
                trading: balanceChanges.trading,
                lp: balanceChanges.lp,
              }}
            />

            <OverviewGroupLabel icon={FlaskConical}>Performance</OverviewGroupLabel>
            <article className={cn(overviewCardShell, "overflow-hidden")}>
              <div className="relative p-5 sm:p-6">
                <header className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <p className={overviewKickerClass}>Leaderboard</p>
                    <h2 className="mt-1 text-base font-semibold tracking-tight text-foreground">Top strategies</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Ranked by win count</p>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 rounded-lg gap-1" asChild>
                    <Link to="/trading-experiment">
                      <Plus className="h-3.5 w-3.5" />
                      New
                    </Link>
                  </Button>
                </header>
                {overview.tradingStatsQ.isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 animate-pulse rounded-lg bg-muted/30" />
                    ))}
                  </div>
                ) : topStrategies.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-4 py-10 text-center">
                    <p className="text-sm text-muted-foreground">No strategies yet.</p>
                    <Button size="sm" variant="outline" className="mt-3 rounded-xl" asChild>
                      <Link to="/trading-experiment">Create your first strategy</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-[11px] uppercase tracking-wider">Strategy</TableHead>
                          <TableHead className="text-right text-[11px] uppercase tracking-wider">W/L</TableHead>
                          <TableHead className="text-right text-[11px] uppercase tracking-wider">Open</TableHead>
                          <TableHead className="text-right text-[11px] uppercase tracking-wider">Win %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topStrategies.map((a, idx) => (
                          <TableRow key={a.strategyId} className="group">
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted/50 font-mono text-[10px] font-semibold tabular-nums text-muted-foreground">
                                  {idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <span className="font-medium">{a.name}</span>
                                  <p className="text-[11px] text-muted-foreground">{a.token}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs tabular-nums">
                              {a.wins}/{a.losses}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                              {a.openPositions}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs tabular-nums">
                              {a.decided > 0 && a.winRatePct != null ? `${a.winRatePct.toFixed(0)}%` : "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </article>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <OverviewStatCard
                compact
                label="Strategies"
                icon={FlaskConical}
                accent="experiment"
                isLoading={overview.tradingStatsQ.isLoading}
                value={
                  overview.tradingStatsQ.isError
                    ? "—"
                    : String(overview.tradingTotals.agentCount)
                }
                hint={
                  overview.maxTradingAgents > 0
                    ? `${overview.tradingTotals.wins}W / ${overview.tradingTotals.losses}L · ${overview.tradingTotals.open} open · max ${overview.maxTradingAgents}`
                    : `${overview.tradingTotals.wins}W / ${overview.tradingTotals.losses}L · ${overview.tradingTotals.open} open`
                }
                href="/trading-experiment"
                error={overview.tradingStatsQ.isError}
              />
              <OverviewStatCard
                compact
                label="LP performance"
                icon={Droplets}
                accent="experiment"
                isLoading={overview.lpSummaryQ.isLoading}
                value={
                  lpSummary
                    ? `${lpSummary.wins}W / ${lpSummary.losses}L`
                    : overview.wallets.managedLpWallet
                      ? "—"
                      : "Not set up"
                }
                hint={
                  lpSummary
                    ? `${lpSummary.openCount} open · ${formatSol(lpSummary.totalReturnSol)} return`
                    : "Create LP wallet to deploy"
                }
                href="/lp-experiment"
                error={overview.lpSummaryQ.isError}
              />
              <OverviewStatCard
                compact
                label="LP deployed"
                icon={Scale}
                accent="experiment"
                isLoading={overview.lpStateQ.isLoading}
                value={lpState ? formatSol(lpState.deployedSol) : "—"}
                hint={
                  lpState
                    ? `${lpState.openPositionsCount} positions · ${formatSol(lpState.walletEquitySol)} equity`
                    : "On-chain LP capital"
                }
                href="/lp-experiment"
                error={overview.lpStateQ.isError}
              />
              <OverviewStatCard
                compact
                label="Alpha intel"
                icon={Telescope}
                accent="alpha"
                value="Explore"
                hint="Market signals & graduate candidates"
                href="/alpha"
              />
            </div>

            <OverviewGroupLabel icon={Bot}>Quick actions</OverviewGroupLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  { label: "Agent wallets", desc: "Deposit & withdraw", to: "/wallet", icon: Wallet },
                  { label: "Trading lab", desc: "Custom strategies", to: "/trading-experiment", icon: FlaskConical },
                  { label: "LP experiment", desc: "Meteora agents", to: "/lp-experiment", icon: Droplets },
                  { label: "Alpha", desc: "Signals & trends", to: "/alpha", icon: Telescope },
                  { label: "Assets", desc: "Market board", to: "/assets", icon: TrendingUp },
                ] as const
              ).map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    overviewCardShell,
                    "group flex items-center justify-between gap-3 px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-border/75",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/40">
                      <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <OverviewStatCard
              label="Trading agents"
              icon={FlaskConical}
              accent="experiment"
              value="—"
              hint="Connect wallet to deploy custom strategies"
              href="/trading-experiment"
            />
            <OverviewStatCard
              label="LP agents"
              icon={Droplets}
              accent="experiment"
              value="—"
              hint="Connect wallet to fund LP treasury"
              href="/lp-experiment"
            />
          </div>
        )}

        {showInternal ? (
          <>
            <OverviewGroupLabel icon={UsersRound}>Internal agents</OverviewGroupLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <OverviewStatCard
                label="Pipelines with data"
                accent="internal"
                value={`${internalPipelineCount} / ${INTERNAL_AGENTS.length}`}
                hint="Trend · growth · partnership scouts"
                href={INTERNAL_BASE_PATH}
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
                hint="Internal monitor allowlist"
                href={INTERNAL_BASE_PATH}
              />
            </div>

            <Card className={cn(overviewCardShell, "divide-y divide-border/60")}>
              {INTERNAL_AGENTS.map((agent) => {
                const href =
                  agent.slug === "partnership-scout"
                    ? internalPartnershipBoardPath()
                    : internalAgentPath(agent.slug);
                const q =
                  agent.slug === "trend-scout"
                    ? trendScoutQ
                    : agent.slug === "partnership-scout"
                      ? partnershipScoutQ
                      : agent.slug === "growth-scout"
                        ? growthScoutQ
                        : null;
                const hasData = q ? Boolean(q.data?.data) : false;
                const savedAt = q?.data?.savedAt;

                return (
                  <Link
                    key={agent.slug}
                    to={href}
                    className="group flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3.5 transition-colors hover:bg-muted/25"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-foreground">{agent.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {q ? (
                        q.isLoading ? (
                          <Badge variant="secondary">Loading</Badge>
                        ) : q.isError ? (
                          <Badge variant="destructive">Error</Badge>
                        ) : hasData ? (
                          <Badge className="bg-emerald-600/90">Has data</Badge>
                        ) : (
                          <Badge variant="outline">No run yet</Badge>
                        )
                      ) : null}
                      {q && savedAt ? (
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {new Date(savedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      ) : null}
                      <ChevronRight
                        className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
                        aria-hidden
                      />
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
