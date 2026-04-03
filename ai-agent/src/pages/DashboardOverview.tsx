import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import {
  ArrowRight,
  BarChart3,
  Bot,
  FileText,
  LayoutDashboard,
  Loader2,
  Scale,
  Trophy,
  FlaskConical,
  Wifi,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { DASHBOARD_CONTENT_SHELL } from "@/lib/layoutConstants";
import { agentLeaderboardApi, type AgentLeaderboardEntry, userPromptsApi, type UserPromptItem } from "@/lib/chatApi";
import { agent8004Api } from "@/lib/agent8004Api";
import { fetchTradingExperimentStats } from "@/lib/tradingExperimentApi";
import { fetchArbitrageSnapshot, fetchCmcTop } from "@/lib/arbitrageExperimentApi";
import { BUILTIN_MARKETPLACE_PROMPT_COUNT } from "@/lib/marketplaceBuiltinCount";

const USER_PROMPTS_SAMPLE = 100;
const STALE_MS = 60_000;

function maskAnonymousId(id: string): string {
  if (!id) return "—";
  if (id.startsWith("wallet:")) {
    const pubkey = id.slice(7).trim();
    if (pubkey.length <= 8) return pubkey;
    return `${pubkey.slice(0, 4)}…${pubkey.slice(-4)}`;
  }
  if (id.length <= 10) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

const leaderboardChartConfig = {
  messages: { label: "Messages", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const wlChartConfig = {
  wins: { label: "Wins", color: "hsl(142 70% 45%)" },
  losses: { label: "Losses", color: "hsl(0 70% 50%)" },
} satisfies ChartConfig;

const venueChartConfig = {
  ok: { label: "Live", color: "hsl(142 70% 45%)" },
  err: { label: "Unavailable", color: "hsl(240 10% 45%)" },
} satisfies ChartConfig;

const promptMixConfig = {
  builtin: { label: "Built-in", color: "hsl(var(--primary))" },
  community: { label: "Community", color: "hsl(38 92% 50%)" },
} satisfies ChartConfig;

function aggregatePromptCategories(prompts: UserPromptItem[]): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const p of prompts) {
    const key = p.category?.trim() || "general";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}

export interface DashboardOverviewProps {
  embedded?: boolean;
}

export default function DashboardOverview({ embedded = false }: DashboardOverviewProps) {
  const [lbQ, promptsQ, regQ, tradeQ, arbQ, cmcQ] = useQueries({
    queries: [
      {
        queryKey: ["dashboard-overview", "leaderboard"],
        queryFn: () =>
          agentLeaderboardApi.get({
            sort: "messages",
            order: "desc",
            limit: 8,
            skip: 0,
          }),
        staleTime: STALE_MS,
      },
      {
        queryKey: ["dashboard-overview", "user-prompts"],
        queryFn: () => userPromptsApi.list({ limit: USER_PROMPTS_SAMPLE, skip: 0 }),
        staleTime: STALE_MS,
      },
      {
        queryKey: ["dashboard-overview", "registry-stats"],
        queryFn: () => agent8004Api.stats(),
        staleTime: 120_000,
      },
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
    ],
  });

  const loading =
    lbQ.isLoading ||
    promptsQ.isLoading ||
    regQ.isLoading ||
    tradeQ.isLoading ||
    arbQ.isLoading ||
    cmcQ.isLoading;

  const leaderboardTotal = lbQ.data?.total ?? 0;

  const communityPrompts = promptsQ.data?.prompts ?? [];
  const communityCount = communityPrompts.length;
  const communityMaybeTruncated = communityCount >= USER_PROMPTS_SAMPLE;

  const registryTotal =
    typeof regQ.data?.totalAgents === "number"
      ? regQ.data.totalAgents
      : typeof (regQ.data as { total?: number } | undefined)?.total === "number"
        ? (regQ.data as { total: number }).total
        : null;

  const tradingStrategies = tradeQ.data?.strategies ?? [];
  const tradingTotals = useMemo(() => {
    const agents = tradeQ.data?.agents ?? [];
    let wins = 0;
    let losses = 0;
    let open = 0;
    for (const a of agents) {
      wins += a.wins ?? 0;
      losses += a.losses ?? 0;
      open += a.openPositions ?? 0;
    }
    return { wins, losses, open };
  }, [tradeQ.data?.agents]);

  const venueStats = useMemo(() => {
    const venues = arbQ.data?.venues ?? [];
    let ok = 0;
    let err = 0;
    for (const v of venues) {
      if (v.ok) ok += 1;
      else err += 1;
    }
    return { ok, err, token: arbQ.data?.token ?? "—" };
  }, [arbQ.data]);

  const categoryChartData = useMemo(
    () => aggregatePromptCategories(promptsQ.data?.prompts ?? []),
    [promptsQ.data?.prompts],
  );

  const CATEGORY_BAR_COLORS = [
    "hsl(var(--primary))",
    "hsl(38 92% 50%)",
    "hsl(142 70% 45%)",
    "hsl(280 60% 55%)",
    "hsl(200 80% 50%)",
    "hsl(0 70% 55%)",
    "hsl(240 10% 55%)",
    "hsl(30 80% 50%)",
  ];

  const leaderboardBarData = useMemo(
    () =>
      (lbQ.data?.leaderboard ?? []).map((e: AgentLeaderboardEntry) => ({
        id: maskAnonymousId(e.anonymousId),
        messages: e.totalMessages,
      })),
    [lbQ.data?.leaderboard],
  );

  const cmcBarData = useMemo(
    () =>
      (cmcQ.data?.assets ?? []).map((a) => ({
        symbol: a.symbol,
        rank: a.cmcRank,
        score: Math.max(1, 51 - Math.min(50, a.cmcRank)),
      })),
    [cmcQ.data?.assets],
  );

  const promptMixData = useMemo(
    () => [
      {
        name: "builtin",
        label: "Built-in",
        value: BUILTIN_MARKETPLACE_PROMPT_COUNT,
        fill: "var(--color-builtin)",
      },
      {
        name: "community",
        label: "Community",
        value: Math.max(0, communityCount),
        fill: "var(--color-community)",
      },
    ],
    [communityCount],
  );

  const sectionLinkClass =
    "inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-3";

  return (
    <div
      className={cn(
        "flex flex-col bg-background min-h-0",
        embedded ? "flex-1 min-h-0" : "min-h-screen",
      )}
    >
      <div className={cn(DASHBOARD_CONTENT_SHELL, "py-6 sm:py-8 space-y-8 flex-1")}>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-secondary border border-border shrink-0">
              <LayoutDashboard className="w-6 h-6 text-primary" aria-hidden />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">Overview</h1>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Cross-section snapshot of marketplace activity, trustless agents, chat leaderboard, trading lab, and
                cross-venue prices. Data refreshes on load; open each area for full detail.
              </p>
            </div>
          </div>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
              Loading…
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Trophy className="w-4 h-4" />
                Chat leaderboard
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {lbQ.isError ? "—" : leaderboardTotal.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">Wallets ranked by activity (messages, tools, x402 volume).</p>
              <Link to="/dashboard/leaderboard" className={sectionLinkClass}>
                Open leaderboard <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Prompts
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {promptsQ.isError
                  ? "—"
                  : `${BUILTIN_MARKETPLACE_PROMPT_COUNT + communityCount}${communityMaybeTruncated ? "+" : ""}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                Built-in templates plus community prompts
                {communityMaybeTruncated ? ` (showing up to ${USER_PROMPTS_SAMPLE} community)` : ""}.
              </p>
              <Link to="/dashboard/marketplace/prompts" className={sectionLinkClass}>
                Marketplace prompts <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Trustless agents
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {regQ.isError ? "—" : registryTotal != null ? registryTotal.toLocaleString() : "—"}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">8004 registry global agent count.</p>
              <Link to="/dashboard/marketplace/agents" className={sectionLinkClass}>
                Agent marketplace <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Trading lab
              </CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {tradeQ.isError ? "—" : (tradeQ.data?.agents ?? []).length.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground">
                {tradingStrategies.length} strategies · {tradingTotals.wins}W / {tradingTotals.losses}L ·{" "}
                {tradingTotals.open} open
              </p>
              <Link to="/dashboard/trading-experiment" className={sectionLinkClass}>
                Trading experiment <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Top wallets by messages
              </CardTitle>
              <CardDescription>Sample of current leaderboard (primary sort: messages).</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {lbQ.isError ? (
                <p className="text-sm text-destructive">Could not load leaderboard.</p>
              ) : leaderboardBarData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No leaderboard rows yet.</p>
              ) : (
                <ChartContainer config={leaderboardChartConfig} className="h-full w-full aspect-auto">
                  <BarChart data={leaderboardBarData} margin={{ left: 8, right: 8, top: 8, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                    <XAxis dataKey="id" tickLine={false} axisLine={false} interval={0} angle={-35} textAnchor="end" height={56} />
                    <YAxis tickLine={false} axisLine={false} width={40} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="messages" fill="var(--color-messages)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Prompt catalog mix
              </CardTitle>
              <CardDescription>Built-in vs community prompts in the marketplace.</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px] flex flex-col sm:flex-row items-center gap-4">
              {promptsQ.isError ? (
                <p className="text-sm text-destructive">Could not load community prompts.</p>
              ) : (
                <>
                  <ChartContainer config={promptMixConfig} className="h-[220px] w-full sm:w-1/2 aspect-auto">
                    <PieChart>
                      <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                      <Pie
                        data={promptMixData}
                        dataKey="value"
                        nameKey="label"
                        innerRadius={48}
                        outerRadius={80}
                        paddingAngle={2}
                      />
                    </PieChart>
                  </ChartContainer>
                  <ul className="text-sm text-muted-foreground space-y-1 w-full sm:w-1/2">
                    <li>
                      <span className="text-foreground font-medium">{BUILTIN_MARKETPLACE_PROMPT_COUNT}</span> built-in
                      Syra prompts
                    </li>
                    <li>
                      <span className="text-foreground font-medium">{communityCount}</span> community prompts
                      {communityMaybeTruncated ? ` (capped at ${USER_PROMPTS_SAMPLE})` : ""}
                    </li>
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Community prompts by category
              </CardTitle>
              <CardDescription>From the latest community sample (by use count on server).</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {promptsQ.isError ? (
                <p className="text-sm text-destructive">Could not load prompts.</p>
              ) : categoryChartData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No community prompts in sample.</p>
              ) : (
                  <ChartContainer
                    config={{ count: { label: "Prompts", color: "hsl(var(--primary))" } }}
                    className="h-full w-full aspect-auto"
                  >
                  <BarChart data={categoryChartData} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" horizontal={false} />
                    <XAxis type="number" tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={88} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {categoryChartData.map((row, i) => (
                        <Cell key={row.name} fill={CATEGORY_BAR_COLORS[i % CATEGORY_BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Trading lab — resolved outcomes
              </CardTitle>
              <CardDescription>Aggregated wins and losses across all strategy agents (primary suite).</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
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
                    <Bar dataKey="wins" stackId="a" fill="var(--color-wins)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="losses" stackId="a" fill="var(--color-losses)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wifi className="w-4 h-4" />
                Arbitrage snapshot — venues
              </CardTitle>
              <CardDescription>
                Live vs unavailable price feeds for <span className="text-foreground font-medium">{venueStats.token}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
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
                    <Bar dataKey="ok" stackId="v" fill="var(--color-ok)" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="err" stackId="v" fill="var(--color-err)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
              <Link to="/dashboard/arbitrage-experiment" className={sectionLinkClass}>
                Arbitrage experiment <ArrowRight className="w-3 h-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Market cap rank (top assets)
              </CardTitle>
              <CardDescription>Lower bar = higher CMC rank (more prominent).</CardDescription>
            </CardHeader>
            <CardContent className="h-[280px]">
              {cmcQ.isError ? (
                <p className="text-sm text-destructive">Could not load CMC top list.</p>
              ) : cmcBarData.length === 0 ? (
                <p className="text-sm text-muted-foreground">No assets returned.</p>
              ) : (
                <ChartContainer
                  config={{
                    score: { label: "Rank score", color: "hsl(var(--accent))" },
                  }}
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
                        const row = payload[0].payload as { symbol: string; rank: number; score: number };
                        return (
                          <div className="rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-xs shadow-md">
                            <p className="font-medium text-foreground">{row.symbol}</p>
                            <p className="text-muted-foreground">CMC rank #{row.rank}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="score" fill="var(--color-score)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 pb-4">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/marketplace/prompts">Prompts</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/marketplace/agents">Agents</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/leaderboard">Leaderboard</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/trading-experiment">Trading experiment</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard/arbitrage-experiment">Arbitrage experiment</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
