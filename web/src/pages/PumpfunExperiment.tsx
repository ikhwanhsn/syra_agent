import { useMemo, useState } from "react";

import { ChevronDown, TrendingUp, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";

import { Card, CardContent } from "@/components/ui/card";

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from "@/components/ui/select";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { cn } from "@/lib/utils";

import {

  DASHBOARD_CONTENT_SHELL,

  PAGE_SAFE_AREA_BOTTOM_COMPACT,

} from "@/lib/layoutConstants";

import type { PumpfunAlphaPeriod } from "@/lib/pumpfunAlphaTrendApi";

import {

  PUMPFUN_EXIT_STRATEGIES,

  PUMPFUN_EXPERIMENT_EXIT_COUNT,

  PUMPFUN_EXPERIMENT_PERSONALITY_COUNT,

  PUMPFUN_EXPERIMENT_START_SOL,

  PUMPFUN_PERSONALITIES,

  cellKey,

  entrySolForPersonality,

  isAggressiveStrategy,

  isSniperPersonality,

  isSmartPersonality,

  positionMarkValueSol,

  totalEquitySol,

  type PumpfunCellState,

  type PumpfunClosedTrade,

} from "@/lib/pumpfunExperimentModel";

import { usePumpfunExperimentRunner } from "@/hooks/usePumpfunExperimentRunner";

import { useTablePagination } from "@/hooks/useTablePagination";

import { PremiumTablePagination } from "@/components/experiment/PremiumTablePagination";

import { LpSectionHeader } from "@/components/experiment/lp/LpSectionHeader";

import { PumpfunExperimentHero } from "@/components/experiment/pumpfun/PumpfunExperimentHero";

import {

  PumpfunExperimentStats,

  formatStrategyLabel,

} from "@/components/experiment/pumpfun/PumpfunExperimentStats";

import { PumpfunHowItWorks } from "@/components/experiment/pumpfun/PumpfunHowItWorks";

import { PumpfunSniperAgents } from "@/components/experiment/pumpfun/PumpfunSniperAgents";

import { PumpfunSmartStrategies } from "@/components/experiment/pumpfun/PumpfunSmartStrategies";

import { ExperimentTabShell, type ExperimentTabId } from "@/components/experiment/shared/ExperimentTabShell";

import { ExperimentBeginnerBanner } from "@/components/experiment/shared/ExperimentBeginnerBanner";

import { ExperimentLeaderboardList } from "@/components/experiment/shared/ExperimentLeaderboardList";

import { ExperimentTradeFeed } from "@/components/experiment/shared/ExperimentTradeFeed";

import { ExperimentAgentBalancePanel } from "@/components/experiment/shared/ExperimentAgentBalancePanel";

import { buildEquityHistoryFromCell, formatExperimentSol } from "@/lib/experimentEquityHistory";

import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";



function formatSol(n: number): string {

  if (!Number.isFinite(n)) return "—";

  const sign = n < 0 ? "−" : "";

  const v = Math.abs(n);

  return `${sign}${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}`;

}



function formatPct(n: number): string {

  if (!Number.isFinite(n)) return "—";

  const sign = n > 0 ? "+" : "";

  return `${sign}${n.toFixed(1)}%`;

}



function heatClass(retPct: number): string {

  if (retPct >= 8) return "border-emerald-500/35 bg-emerald-500/[0.14] text-emerald-100";

  if (retPct >= 2) return "border-emerald-500/20 bg-emerald-500/[0.08] text-foreground";

  if (retPct >= -2) return "border-border/50 bg-muted/[0.12] text-foreground";

  if (retPct >= -8) return "border-amber-500/25 bg-amber-500/[0.08] text-foreground";

  return "border-red-500/30 bg-red-500/[0.12] text-foreground";

}



function strategyBadge(p: number, e: number) {

  if (isSmartPersonality(p)) {

    return {

      text: "Smart",

      className: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",

    };

  }

  if (isSniperPersonality(p)) {

    return {

      text: "Sniper",

      className: "border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-300",

    };

  }

  if (isAggressiveStrategy(p, e)) {

    return {

      text: "Aggressive",

      className: "border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300",

    };

  }

  return null;

}



export default function PumpfunExperiment({ embedded = false }: { embedded?: boolean }) {

  const [period, setPeriod] = useState<PumpfunAlphaPeriod>("today");

  const { persisted, trendQ } = usePumpfunExperimentRunner(period);

  const [activeTab, setActiveTab] = useState<ExperimentTabId>("start");

  const [selP, setSelP] = useState(3);

  const [selE, setSelE] = useState(4);

  const [gridOpen, setGridOpen] = useState(false);

  const [filterMode, setFilterMode] = useState<"all" | "smart" | "aggressive">("all");



  const leaderboard = useMemo(() => {

    const rows: Array<{

      key: string;

      p: number;

      e: number;

      equity: number;

      retPct: number;

      cell: PumpfunCellState;

    }> = [];

    for (let p = 0; p < PUMPFUN_EXPERIMENT_PERSONALITY_COUNT; p++) {

      for (let e = 0; e < PUMPFUN_EXPERIMENT_EXIT_COUNT; e++) {

        const key = cellKey(p, e);

        const cell = persisted.cells[key];

        if (!cell) continue;

        const equity = totalEquitySol(cell, persisted.mcByMint);

        rows.push({

          key,

          p,

          e,

          equity,

          retPct: (equity / PUMPFUN_EXPERIMENT_START_SOL - 1) * 100,

          cell,

        });

      }

    }

    rows.sort((a, b) => b.equity - a.equity);

    return rows;

  }, [persisted]);



  const mergedTrades = useMemo(() => {

    const all: PumpfunClosedTrade[] = [];

    for (const cell of Object.values(persisted.cells)) {

      all.push(...cell.closed);

    }

    all.sort((a, b) => b.closedAtMs - a.closedAtMs);

    return all;

  }, [persisted]);



  const tradesPagination = useTablePagination(mergedTrades, 10);

  const selectedCell = persisted.cells[cellKey(selP, selE)];



  const summary = useMemo(() => {

    let sumEq = 0;

    let winners = 0;

    for (const r of leaderboard) {

      sumEq += r.equity;

      if (r.retPct > 0) winners += 1;

    }

    const avgRet = leaderboard.length

      ? (sumEq / leaderboard.length / PUMPFUN_EXPERIMENT_START_SOL - 1) * 100

      : 0;

    return { avgRet, winners, totalCells: leaderboard.length };

  }, [leaderboard]);



  const topRow = leaderboard[0];

  const topSmartRow = useMemo(

    () =>

      leaderboard.find((r) => isSmartPersonality(r.p) && r.retPct > 0) ??

      leaderboard.find((r) => isSmartPersonality(r.p)) ??

      null,

    [leaderboard],

  );



  const featuredAgent = topRow ?? null;

  const featuredHistory = useMemo(() => {

    const nowMs = trendQ.data?.nowMs ?? Date.now();

    if (!featuredAgent) {

      return buildEquityHistoryFromCell({

        startSol: PUMPFUN_EXPERIMENT_START_SOL,

        closedTrades: [],

        currentEquitySol: PUMPFUN_EXPERIMENT_START_SOL,

        nowMs,

      });

    }

    return buildEquityHistoryFromCell({

      startSol: PUMPFUN_EXPERIMENT_START_SOL,

      closedTrades: featuredAgent.cell.closed,

      currentEquitySol: featuredAgent.equity,

      nowMs,

    });

  }, [featuredAgent, trendQ.data?.nowMs]);

  const visibleLeaderboard = useMemo(() => {

    if (filterMode === "smart") return leaderboard.filter((r) => isSmartPersonality(r.p));

    if (filterMode === "aggressive") return leaderboard.filter((r) => isAggressiveStrategy(r.p, r.e));

    return leaderboard;

  }, [leaderboard, filterMode]);



  const selectStrategy = (p: number, e: number, switchTab = false) => {

    setSelP(p);

    setSelE(e);

    if (switchTab) setActiveTab("results");

  };



  const leaderboardCards = visibleLeaderboard.slice(0, 8).map((r, i) => ({

    key: r.key,

    rank: i + 1,

    label: formatStrategyLabel(r.p, r.e),

    equityLabel: `${formatSol(r.equity)} SOL`,

    retPct: r.retPct,

    openCount: r.cell.open.length,

    badge: strategyBadge(r.p, r.e),

    selected: selP === r.p && selE === r.e,

  }));



  const tradeFeedItems = tradesPagination.slice.map((t, idx) => ({

    id: `${t.closedAtMs}-${t.mint}-${idx}`,

    timeLabel: new Date(t.closedAtMs).toLocaleString(undefined, { timeStyle: "short", dateStyle: "short" }),

    strategyLabel: formatStrategyLabel(t.personalityId, t.exitStrategyId),

    tokenLabel: t.symbol,

    reasonLabel: t.reason,

    pnlLabel: `${formatSol(t.pnlSol)} SOL`,

    pnlPositive: t.pnlSol > 0,

    pnlNegative: t.pnlSol < 0,

    href: `https://pump.fun/coin/${encodeURIComponent(t.mint)}`,

    hrefLabel: "View on Pump.fun",

  }));



  const emptyLeaderboardMsg =

    filterMode === "smart"

      ? "No smart strategies in profit yet — they are waiting for a high-quality token."

      : filterMode === "aggressive"

        ? "No aggressive strategies in profit yet — they need a big runner first."

        : "Strategies are warming up. Check back once new tokens appear.";



  return (

    <TooltipProvider delayDuration={200}>

      <div

        className={cn(

          "relative text-foreground",

          embedded ? "w-full min-w-0" : "flex min-h-screen min-w-0 flex-col",

        )}

      >

        <main

          className={cn(

            DASHBOARD_CONTENT_SHELL,

            "pt-2 sm:pt-3",

            PAGE_SAFE_AREA_BOTTOM_COMPACT,

            "space-y-6",

          )}

        >

          <ExperimentAgentBalancePanel
            platformLabel="Pump.fun"
            bankLabel="10 SOL paper agent"
            strategyLabel={featuredAgent ? formatStrategyLabel(featuredAgent.p, featuredAgent.e) : "Warming up…"}
            startBalance={PUMPFUN_EXPERIMENT_START_SOL}
            currentBalance={featuredAgent?.equity ?? PUMPFUN_EXPERIMENT_START_SOL}
            retPct={featuredAgent?.retPct ?? 0}
            closedCount={featuredAgent?.cell?.closed.length ?? 0}
            openCount={featuredAgent?.cell?.open.length ?? 0}
            historyPoints={featuredHistory}
            formatBalance={formatExperimentSol}
            formatAxis={(n) => `${n.toFixed(1)}`}
            accent="experiment"
          />



          <PumpfunExperimentHero

            embedded={embedded}

            period={period}

            onPeriodChange={setPeriod}

            loading={trendQ.isFetching}

            failed={trendQ.isError}

            onRefresh={() => void trendQ.refetch()}

          />



          <PumpfunExperimentStats

            loading={trendQ.isLoading}

            avgRetPct={summary.avgRet}

            winners={summary.winners}

            totalStrategies={summary.totalCells}

            topStrategyLabel={

              topSmartRow

                ? formatStrategyLabel(topSmartRow.p, topSmartRow.e)

                : topRow

                  ? formatStrategyLabel(topRow.p, topRow.e)

                  : null

            }

            topRetPct={topSmartRow?.retPct ?? topRow?.retPct ?? null}

            newTokens={persisted.discoveries.length}

          />



          {trendQ.isError ? (

            <Card className="border-destructive/25 bg-destructive/[0.04]">

              <CardContent className="space-y-3 p-5">

                <p className="text-sm font-medium">Could not load live token feed</p>

                <p className="text-sm text-muted-foreground">{(trendQ.error as Error)?.message}</p>

                <Button type="button" variant="secondary" size="sm" className="rounded-xl" onClick={() => void trendQ.refetch()}>

                  Try again

                </Button>

              </CardContent>

            </Card>

          ) : null}



          <ExperimentTabShell

            activeTab={activeTab}

            onTabChange={setActiveTab}

            accentClass="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"

            startContent={

              <>

                <ExperimentBeginnerBanner

                  title="This is a simulator — no real money"

                  description="Every strategy trades with fake SOL on live Pump.fun tokens. Watch, compare, and learn before you trade for real."

                  accentIconClass="text-violet-500"

                />



                <section className="space-y-4">

                  <LpSectionHeader

                    kicker="Step 1"

                    title="How it works"

                    description="Three steps. No trading experience needed."

                  />

                  <PumpfunHowItWorks />

                </section>



                <section className="space-y-4">

                  <LpSectionHeader

                    kicker="Step 2"

                    title="Pick a smart strategy"

                    description="Recommended starting points — tap one to follow it."

                  />

                  <PumpfunSmartStrategies

                    selectedPersonalityId={selP}

                    selectedExitId={selE}

                    onSelect={(p, e) => selectStrategy(p, e, true)}

                  />

                </section>



                <section className="space-y-4">

                  <LpSectionHeader

                    kicker="Step 3"

                    title="Or try a sniper"

                    description="Snipers target specific token stages — launch, bonding curve, or graduation."

                  />

                  <PumpfunSniperAgents

                    selectedPersonalityId={selP}

                    onSelect={(p) => {

                      setSelP(p);

                      setActiveTab("results");

                    }}

                  />

                </section>

              </>

            }

            resultsContent={

              <>

                <section className="space-y-4">

                  <LpSectionHeader

                    kicker="Leaderboard"

                    title="Who is winning right now"

                    description="Tap any strategy to see its balance and open positions."

                    action={

                      <div className="flex flex-wrap gap-2">

                        {(["all", "smart", "aggressive"] as const).map((mode) => (

                          <Button

                            key={mode}

                            type="button"

                            size="sm"

                            variant={filterMode === mode ? "secondary" : "outline"}

                            className="h-9 rounded-xl capitalize"

                            onClick={() => setFilterMode(mode)}

                          >

                            {mode === "all" ? "All" : mode}

                          </Button>

                        ))}

                      </div>

                    }

                  />

                  <ExperimentLeaderboardList

                    rows={leaderboardCards}

                    emptyMessage={emptyLeaderboardMsg}

                    onSelect={(key) => {

                      const row = visibleLeaderboard.find((r) => r.key === key);

                      if (row) selectStrategy(row.p, row.e);

                    }}

                  />

                </section>



                <section id="explore-strategy" className="scroll-mt-8 space-y-4">

                  <LpSectionHeader

                    kicker="Your pick"

                    title="Strategy details"

                    description="Change buy and sell styles to explore any combination."

                  />



                  <div className={cn(overviewCardShell, "rounded-3xl p-5 sm:p-6")}>

                    <div className="grid gap-4 lg:grid-cols-2">

                      <div className="space-y-2">

                        <label className="text-sm font-medium text-foreground" htmlFor="buy-style-select">

                          When to buy

                        </label>

                        <Select value={String(selP)} onValueChange={(v) => setSelP(Number(v))}>

                          <SelectTrigger id="buy-style-select" className="h-11 rounded-xl border-border/60">

                            <SelectValue />

                          </SelectTrigger>

                          <SelectContent className="max-h-72 rounded-xl">

                            {PUMPFUN_PERSONALITIES.map((p) => (

                              <SelectItem key={p.id} value={String(p.id)}>

                                {p.name}

                              </SelectItem>

                            ))}

                          </SelectContent>

                        </Select>

                        <p className="text-xs leading-relaxed text-muted-foreground">

                          {PUMPFUN_PERSONALITIES[selP]?.description}

                        </p>

                      </div>

                      <div className="space-y-2">

                        <label className="text-sm font-medium text-foreground" htmlFor="sell-style-select">

                          When to sell

                        </label>

                        <Select value={String(selE)} onValueChange={(v) => setSelE(Number(v))}>

                          <SelectTrigger id="sell-style-select" className="h-11 rounded-xl border-border/60">

                            <SelectValue />

                          </SelectTrigger>

                          <SelectContent className="max-h-72 rounded-xl">

                            {PUMPFUN_EXIT_STRATEGIES.map((e) => (

                              <SelectItem key={e.id} value={String(e.id)}>

                                {e.name}

                              </SelectItem>

                            ))}

                          </SelectContent>

                        </Select>

                        <p className="text-xs leading-relaxed text-muted-foreground">

                          {PUMPFUN_EXIT_STRATEGIES[selE]?.description}

                        </p>

                      </div>

                    </div>



                    {selectedCell ? (

                      <div className="mt-5">

                        <StrategyDetailCard cell={selectedCell} mcByMint={persisted.mcByMint} personalityId={selP} />

                      </div>

                    ) : null}

                  </div>

                </section>



                <Collapsible open={gridOpen} onOpenChange={setGridOpen}>

                  <CollapsibleTrigger asChild>

                    <button

                      type="button"

                      className={cn(

                        overviewCardShell,

                        "flex w-full items-center justify-between gap-4 rounded-2xl p-5 text-left transition-all duration-200",

                        "hover:border-violet-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",

                      )}

                    >

                      <div className="min-w-0 space-y-1">

                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">

                          Advanced

                        </p>

                        <p className="text-base font-semibold tracking-tight text-foreground">

                          View all 225 strategies

                        </p>

                        <p className="text-sm text-muted-foreground">

                          Full grid — green is profit, red is loss.

                        </p>

                      </div>

                      <ChevronDown

                        className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200", gridOpen && "rotate-180")}

                        aria-hidden

                      />

                    </button>

                  </CollapsibleTrigger>



                  <CollapsibleContent className="mt-4 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0">

                    <Card className={cn(overviewCardShell, "rounded-2xl border-border/50")}>

                      <CardContent className="space-y-4 overflow-x-auto p-5">

                        <div className="min-w-[720px] space-y-1">

                          <div

                            className="grid gap-1"

                            style={{

                              gridTemplateColumns: `88px repeat(${PUMPFUN_EXPERIMENT_EXIT_COUNT}, minmax(0,1fr))`,

                            }}

                          >

                            <div />

                            {PUMPFUN_EXIT_STRATEGIES.map((e) => (

                              <Tooltip key={e.id}>

                                <TooltipTrigger asChild>

                                  <div className="flex h-10 items-center justify-center rounded-lg border border-border/40 bg-muted/20 px-0.5 text-center text-[10px] font-semibold leading-tight text-muted-foreground">

                                    {e.short}

                                  </div>

                                </TooltipTrigger>

                                <TooltipContent side="bottom" className="max-w-xs rounded-xl">

                                  <p className="font-semibold">{e.name}</p>

                                  <p className="text-xs text-muted-foreground">{e.description}</p>

                                </TooltipContent>

                              </Tooltip>

                            ))}

                            {PUMPFUN_PERSONALITIES.map((p) => (

                              <div key={p.id} className="contents">

                                <Tooltip>

                                  <TooltipTrigger asChild>

                                    <div className="flex h-12 items-center rounded-lg border border-border/40 bg-muted/20 px-2 text-[11px] font-semibold leading-snug text-muted-foreground">

                                      {p.short}

                                    </div>

                                  </TooltipTrigger>

                                  <TooltipContent side="left" className="max-w-xs rounded-xl">

                                    <p className="font-semibold">{p.name}</p>

                                    <p className="text-xs text-muted-foreground">{p.description}</p>

                                  </TooltipContent>

                                </Tooltip>

                                {PUMPFUN_EXIT_STRATEGIES.map((e) => {

                                  const cell = persisted.cells[cellKey(p.id, e.id)];

                                  const equity = cell ? totalEquitySol(cell, persisted.mcByMint) : 0;

                                  const ret = (equity / PUMPFUN_EXPERIMENT_START_SOL - 1) * 100;

                                  const active = selP === p.id && selE === e.id;

                                  return (

                                    <button

                                      key={e.id}

                                      type="button"

                                      onClick={() => selectStrategy(p.id, e.id)}

                                      className={cn(

                                        "flex h-12 flex-col items-center justify-center rounded-lg border px-0.5 text-center transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",

                                        heatClass(ret),

                                        active && "ring-2 ring-violet-500 ring-offset-2 ring-offset-background",

                                      )}

                                    >

                                      <span className="font-mono text-[11px] font-semibold tabular-nums leading-none">

                                        {formatPct(ret)}

                                      </span>

                                      <span className="mt-0.5 text-[9px] font-medium uppercase tracking-wide text-muted-foreground/80">

                                        {cell?.open.length ? `${cell.open.length} open` : "flat"}

                                      </span>

                                    </button>

                                  );

                                })}

                              </div>

                            ))}

                          </div>

                        </div>

                      </CardContent>

                    </Card>

                  </CollapsibleContent>

                </Collapsible>

              </>

            }

            activityContent={

              <section className="space-y-4">

                <LpSectionHeader

                  kicker="Recent"

                  title="Completed trades"

                  description="Every sell across all strategies — newest first."

                />

                <ExperimentTradeFeed

                  items={tradeFeedItems}

                  emptyMessage="No completed trades yet. They will appear here once strategies start selling."

                />

                {mergedTrades.length > 0 ? (

                  <PremiumTablePagination

                    page={tradesPagination.page}

                    pageSize={tradesPagination.pageSize}

                    totalItems={tradesPagination.totalItems}

                    onPageChange={tradesPagination.setPage}

                    onPageSizeChange={tradesPagination.setPageSize}

                    pageSizeOptions={[10, 15, 25]}

                    loading={trendQ.isFetching}

                    itemLabel="trades"

                    className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3"

                  />

                ) : null}

              </section>

            }

          />

        </main>

      </div>

    </TooltipProvider>

  );

}



function StrategyDetailCard({

  cell,

  mcByMint,

  personalityId,

}: {

  cell: PumpfunCellState;

  mcByMint: Record<string, number | null>;

  personalityId: number;

}) {

  const equity = totalEquitySol(cell, mcByMint);

  const ret = (equity / PUMPFUN_EXPERIMENT_START_SOL - 1) * 100;



  return (

    <div className="space-y-4 rounded-2xl border border-border/50 bg-background/40 p-4 sm:p-5">

      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>

          <p className="text-xs font-medium text-muted-foreground">Total balance</p>

          <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight">

            {formatSol(equity)} SOL

          </p>

          <p className="mt-1 text-xs text-muted-foreground">

            Started with {PUMPFUN_EXPERIMENT_START_SOL} SOL · {entrySolForPersonality(personalityId)} SOL per trade

          </p>

        </div>

        <div className="text-right">

          <p className="text-xs font-medium text-muted-foreground">Return</p>

          <p

            className={cn(

              "font-mono text-2xl font-semibold tabular-nums",

              ret > 0 ? "text-emerald-600 dark:text-emerald-400" : ret < 0 ? "text-red-600 dark:text-red-400" : "text-foreground",

            )}

          >

            {formatPct(ret)}

          </p>

        </div>

      </div>



      <div className="flex flex-wrap gap-2">

        <Badge variant="outline" className="rounded-lg font-mono text-xs">

          <Wallet className="mr-1 h-3 w-3" />

          Cash {formatSol(cell.balanceSol)} SOL

        </Badge>

        <Badge variant="outline" className="rounded-lg font-mono text-xs">

          <TrendingUp className="mr-1 h-3 w-3" />

          {cell.open.length} open

        </Badge>

        <Badge variant="outline" className="rounded-lg font-mono text-xs">

          {cell.closed.length} completed

        </Badge>

      </div>



      {cell.open.length > 0 ? (

        <div className="space-y-2">

          <p className="text-xs font-medium text-muted-foreground">Current holdings</p>

          <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">

            {cell.open.map((o) => {

              const mc = mcByMint[o.mint] ?? o.entryMc;

              const mark = positionMarkValueSol(o, mc);

              const r = ((mc ?? o.entryMc) / o.entryMc - 1) * 100;

              return (

                <li

                  key={`${o.mint}-${o.entryAtMs}`}

                  className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/[0.06] px-3 py-2.5"

                >

                  <div className="min-w-0">

                    <p className="truncate text-sm font-medium">{o.symbol}</p>

                    <p className="text-xs text-muted-foreground">Bought for {formatSol(o.solNotional)} SOL</p>

                  </div>

                  <div className="shrink-0 text-right">

                    <p className="font-mono text-sm tabular-nums">{formatSol(mark)} SOL</p>

                    <p

                      className={cn(

                        "font-mono text-xs tabular-nums",

                        r >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400",

                      )}

                    >

                      {formatPct(r)}

                    </p>

                  </div>

                </li>

              );

            })}

          </ul>

        </div>

      ) : (

        <p className="rounded-xl border border-dashed border-border/50 bg-muted/[0.04] px-4 py-6 text-center text-sm text-muted-foreground">

          No open positions — waiting for the next token that matches this buy style.

        </p>

      )}

    </div>

  );

}


