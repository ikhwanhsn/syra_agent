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
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { formatCompactUsd, formatSol } from "@/lib/dashboardOverviewAggregates";
import { fetchPartnershipScoutLatest, fetchTrendScoutLatest } from "@/lib/internalTeamAgentsApi";
import { useQueries } from "@tanstack/react-query";
import { OverviewStatCard } from "@/components/dashboard/overview/OverviewStatCard";
import { OverviewGroupLabel } from "@/components/dashboard/overview/OverviewGroupLabel";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { UserOverviewConnectHero, UserOverviewHero } from "@/components/dashboard/overview/UserOverviewHero";
import { TreasurySplitCardGrid } from "@/components/dashboard/overview/TreasurySplitCard";
import { useWalletContext } from "@/contexts/WalletContext";
import { useConnectModal } from "@/contexts/ConnectModalContext";
import { isInternalTeamMonitorWallet } from "@/constants/internalTeamMonitorWallet";
import { INTERNAL_AGENTS } from "@/lib/internalAgentsCatalog";
import { useUserDashboardOverview } from "@/hooks/useUserDashboardOverview";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";

const STALE_MS = 45_000;

const wlChartConfig = {
  wins: { label: "Wins", color: "hsl(var(--foreground))" },
  losses: { label: "Losses", color: "hsl(var(--destructive) / 0.65)" },
} satisfies ChartConfig;

export interface DashboardOverviewProps {
  embedded?: boolean;
}

export default function DashboardOverview({ embedded = false }: DashboardOverviewProps) {
  const { address } = useWalletContext();
  const { openConnectModal } = useConnectModal();
  const showInternal = isInternalTeamMonitorWallet(address);
  const overview = useUserDashboardOverview();

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
    ],
  });

  const [trendScoutQ, partnershipScoutQ] = internalQueries;

  const internalPipelineCount = useMemo(() => {
    if (!showInternal) return 0;
    return [trendScoutQ.data?.data, partnershipScoutQ.data?.data].filter(Boolean).length;
  }, [showInternal, trendScoutQ.data, partnershipScoutQ.data]);

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
        className={cn(DASHBOARD_CONTENT_SHELL, "relative flex-1 space-y-8", PAGE_PADDING_TOP_MEDIUM, PAGE_SAFE_AREA_BOTTOM)}
      >
        {!showPortfolio ? (
          <UserOverviewConnectHero onConnect={() => openConnectModal()} />
        ) : (
          <UserOverviewHero
            walletLabel={walletLabel}
            totalUsd={overview.treasury.totalUsd}
            totalUsdc={overview.treasury.totalUsdc}
            totalSol={overview.treasury.totalSol}
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
                  Live balances
                </Badge>
                {overview.wallets.managedChatWallet ? (
                  <Badge
                    variant="outline"
                    className="rounded-lg border-border/50 bg-background/25 px-2.5 py-1 font-medium backdrop-blur-md"
                  >
                    Trading agent ready
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="rounded-lg border-amber-500/30 bg-amber-500/5 px-2.5 py-1 font-medium text-amber-700 dark:text-amber-400 backdrop-blur-md"
                  >
                    Set up trading agent
                  </Badge>
                )}
              </>
            }
          />
        )}

        {showPortfolio ? (
          <>
            <OverviewGroupLabel icon={Wallet}>Treasury</OverviewGroupLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <OverviewStatCard
                label="Total assets"
                icon={Wallet}
                accent="marketplace"
                isLoading={overview.balancesLoading}
                value={
                  overview.treasury.totalUsd != null
                    ? formatCompactUsd(overview.treasury.totalUsd)
                    : overview.treasury.totalUsdc != null
                      ? formatCompactUsd(overview.treasury.totalUsdc)
                      : "—"
                }
                hint={
                  overview.treasury.totalSol != null
                    ? `${formatSol(overview.treasury.totalSol)} SOL across wallet + agents`
                    : "Wallet + agent treasuries"
                }
                href="/wallet"
              />
              <OverviewStatCard
                label="Trading agent balance"
                icon={Bot}
                accent="experiment"
                isLoading={overview.balancesLoading}
                value={
                  overview.treasury.chatUsdc != null
                    ? formatCompactUsd(overview.treasury.chatUsdc)
                    : "—"
                }
                hint={
                  overview.treasury.chatSol != null
                    ? `${formatSol(overview.treasury.chatSol)} SOL · fund for spot strategies`
                    : "Chat agent treasury"
                }
                href="/wallet?wallet=chat"
              />
              <OverviewStatCard
                label="LP agent balance"
                icon={Droplets}
                accent="experiment"
                isLoading={overview.balancesLoading}
                value={
                  overview.treasury.lpUsdc != null ? formatCompactUsd(overview.treasury.lpUsdc) : "—"
                }
                hint={
                  overview.treasury.lpSol != null
                    ? `${formatSol(overview.treasury.lpSol)} SOL · Meteora DLMM`
                    : "LP treasury"
                }
                href="/wallet?wallet=lp"
              />
              <OverviewStatCard
                label="Agent capital (combined)"
                icon={TrendingUp}
                accent="neutral"
                isLoading={overview.balancesLoading}
                value={
                  overview.treasury.agentUsdc != null
                    ? formatCompactUsd(overview.treasury.agentUsdc)
                    : "—"
                }
                hint="Trading + LP agent USDC"
                href="/agents"
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
            />

            <OverviewGroupLabel icon={FlaskConical}>Your agents</OverviewGroupLabel>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <OverviewStatCard
                label="Trading strategies"
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
                label="Alpha intel"
                icon={Telescope}
                accent="alpha"
                value="Explore"
                hint="Market signals & graduate candidates"
                href="/alpha"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className={overviewCardShell}>
                <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                  <div>
                    <CardTitle className="text-base">Trading strategies</CardTitle>
                    <CardDescription>Your custom agents — resolved outcomes</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="shrink-0 rounded-lg gap-1" asChild>
                    <Link to="/trading-experiment">
                      <Plus className="h-3.5 w-3.5" />
                      New
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="h-[240px]">
                  {overview.tradingStatsQ.isError ? (
                    <p className="text-sm text-destructive">Sign in and connect your wallet to load strategies.</p>
                  ) : overview.tradingTotals.wins + overview.tradingTotals.losses === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <p className="text-sm text-muted-foreground">No resolved trades yet.</p>
                      <Button size="sm" className="rounded-xl" asChild>
                        <Link to="/trading-experiment">Launch trading experiment</Link>
                      </Button>
                    </div>
                  ) : (
                    <ChartContainer config={wlChartConfig} className="h-full w-full aspect-auto">
                      <BarChart
                        data={[
                          {
                            label: "Your agents",
                            wins: overview.tradingTotals.wins,
                            losses: overview.tradingTotals.losses,
                          },
                        ]}
                        margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} width={48} allowDecimals={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="wins" stackId="a" fill="var(--color-wins)" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="losses" stackId="a" fill="var(--color-losses)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card className={cn(overviewCardShell, "overflow-hidden")}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Top strategies</CardTitle>
                  <CardDescription>By win count</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {overview.tradingStatsQ.isLoading ? (
                    <p className="px-4 pb-4 text-sm text-muted-foreground">Loading…</p>
                  ) : topStrategies.length === 0 ? (
                    <div className="px-4 pb-6 pt-2">
                      <p className="text-sm text-muted-foreground">No strategies yet.</p>
                      <Button size="sm" variant="outline" className="mt-3 rounded-xl" asChild>
                        <Link to="/trading-experiment">Create your first strategy</Link>
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Strategy</TableHead>
                          <TableHead className="text-right">W/L</TableHead>
                          <TableHead className="text-right">Open</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topStrategies.map((a) => (
                          <TableRow key={a.strategyId}>
                            <TableCell>
                              <span className="font-medium">{a.name}</span>
                              <p className="text-[11px] text-muted-foreground">{a.token}</p>
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs tabular-nums">
                              {a.wins}/{a.losses}
                            </TableCell>
                            <TableCell className="text-right font-mono text-xs tabular-nums text-muted-foreground">
                              {a.openPositions}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {lpSummary ? (
                <Card className={cn(overviewCardShell, "lg:col-span-2")}>
                  <CardHeader>
                    <CardTitle className="text-base">LP agent snapshot</CardTitle>
                    <CardDescription>Realized and book P&amp;L for your LP treasury</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {(
                        [
                          {
                            label: "Total return",
                            value: lpSummary.totalReturnSol,
                            format: formatSol,
                            suffix: " SOL",
                          },
                          {
                            label: "Realized PnL",
                            value: lpSummary.realizedNetPnlSol,
                            format: formatSol,
                            suffix: " SOL",
                          },
                          {
                            label: "Unrealized",
                            value: lpSummary.unrealizedPnlSol,
                            format: formatSol,
                            suffix: " SOL",
                          },
                          {
                            label: "Fees claimed",
                            value: lpSummary.totalFeesClaimedSol,
                            format: formatSol,
                            suffix: " SOL",
                          },
                        ] as const
                      ).map((stat) => (
                        <div
                          key={stat.label}
                          className="rounded-2xl border border-border/50 bg-muted/15 px-4 py-3.5"
                        >
                          <p className="text-[11px] font-medium text-muted-foreground">{stat.label}</p>
                          <p className="mt-1 font-mono text-xl font-semibold tabular-nums tracking-tight">
                            <AnimatedMetric value={stat.value} format={stat.format} />
                            {stat.suffix}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            <OverviewGroupLabel icon={Bot}>Quick actions</OverviewGroupLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(
                [
                  { label: "Agent wallets", desc: "Deposit & withdraw", to: "/wallet", icon: Wallet },
                  { label: "My agents", desc: "Profiles & addresses", to: "/agents", icon: Bot },
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
                hint="Trend scout + partnership scout"
                href="/internal-team-agents"
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
                href="/internal-team-agents"
              />
            </div>

            <Card className={cn(overviewCardShell, "divide-y divide-border/60")}>
              {INTERNAL_AGENTS.map((agent) => {
                const href =
                  agent.slug === "partnership-scout"
                    ? "/internal-team-agents#partnership-board"
                    : `/internal-team-agents/${agent.slug}`;
                const q =
                  agent.slug === "trend-scout"
                    ? trendScoutQ
                    : agent.slug === "partnership-scout"
                      ? partnershipScoutQ
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
