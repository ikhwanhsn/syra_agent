import { useMemo, useState } from "react";

import { ArrowUpRight, ChevronDown, TrendingUp } from "lucide-react";

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

import { buildRiseTradeUrl } from "@/lib/riseToken";

import {

  RISE_EXIT_STRATEGIES,

  RISE_EXPERIMENT_EXIT_COUNT,

  RISE_EXPERIMENT_PERSONALITY_COUNT,

  RISE_EXPERIMENT_START_SOL,

  RISE_PERSONALITIES,

  cellEquitySol,

  cellKey,

  entrySolForPersonality,

  isAggressiveStrategy,

  isSniperPersonality,

  positionMarkValueSol,

  type RiseCellState,

  type RiseClosedTrade,

} from "@/lib/riseExperimentModel";

import { useRiseExperimentRunner } from "@/hooks/useRiseExperimentRunner";

import { useTablePagination } from "@/hooks/useTablePagination";

import { PremiumTablePagination } from "@/components/experiment/PremiumTablePagination";

import { LpSectionHeader } from "@/components/experiment/lp/LpSectionHeader";

import { RiseExperimentHero } from "@/components/experiment/rise/RiseExperimentHero";

import {

  RiseExperimentStats,

  formatRiseStrategyLabel,

} from "@/components/experiment/rise/RiseExperimentStats";

import { RiseHowItWorks } from "@/components/experiment/rise/RiseHowItWorks";

import { RiseSniperAgents } from "@/components/experiment/rise/RiseSniperAgents";

import { RiseRecommendedStrategies } from "@/components/experiment/rise/RiseRecommendedStrategies";

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



function heatClass(retPct: number): string {

  if (retPct >= 8) return "border-emerald-500/35 bg-emerald-500/[0.14] text-emerald-100";

  if (retPct >= 2) return "border-emerald-500/20 bg-emerald-500/[0.08] text-foreground";

  if (retPct >= -2) return "border-border/50 bg-muted/[0.12] text-foreground";

  if (retPct >= -8) return "border-amber-500/25 bg-amber-500/[0.08] text-foreground";

  return "border-red-500/30 bg-red-500/[0.12] text-foreground";

}



function strategyBadge(p: number, e: number) {

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



function StrategyDetailCard({

  cell,

  mcByMint,

  personalityId,

  exitId,

}: {

  cell: RiseCellState;

  mcByMint: Record<string, number | null>;

  personalityId: number;

  exitId: number;

}) {

  const equity = cellEquitySol(cell, mcByMint);

  const retPct = (equity / RISE_EXPERIMENT_START_SOL - 1) * 100;



  return (

    <div className="space-y-4 rounded-2xl border border-border/50 bg-background/40 p-4 sm:p-5">

      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>

          <p className="text-xs font-medium text-muted-foreground">Total balance</p>

          <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight">

            {formatSol(equity)} SOL

          </p>

          <p className="mt-1 text-xs text-muted-foreground">

            Started with {RISE_EXPERIMENT_START_SOL} SOL · {entrySolForPersonality(personalityId)} SOL per trade

          </p>

        </div>

        <div className="text-right">

          <p className="text-xs font-medium text-muted-foreground">Return</p>

          <p

            className={cn(

              "font-mono text-2xl font-semibold tabular-nums",

              retPct > 0 ? "text-emerald-600 dark:text-emerald-400" : retPct < 0 ? "text-red-600 dark:text-red-400" : "text-foreground",

            )}

          >

            {formatPct(retPct)}

          </p>

        </div>

      </div>



      <div className="grid gap-3 sm:grid-cols-2">

        <div className="rounded-xl border border-border/40 bg-muted/[0.06] px-3 py-2.5">

          <p className="text-[11px] font-medium text-muted-foreground">Cash available</p>

          <p className="font-mono text-sm font-semibold tabular-nums">{formatSol(cell.balanceSol)} SOL</p>

        </div>

        <div className="rounded-xl border border-border/40 bg-muted/[0.06] px-3 py-2.5">

          <p className="text-[11px] font-medium text-muted-foreground">Borrowed (leverage)</p>

          <p className="font-mono text-sm font-semibold tabular-nums text-amber-700 dark:text-amber-300">

            {formatSol(cell.borrowedPrincipalSol)} SOL

          </p>

        </div>

        <div className="rounded-xl border border-border/40 bg-muted/[0.06] px-3 py-2.5">

          <p className="text-[11px] font-medium text-muted-foreground">Open positions</p>

          <p className="font-mono text-sm font-semibold tabular-nums">{cell.open.length}</p>

        </div>

        <div className="rounded-xl border border-border/40 bg-muted/[0.06] px-3 py-2.5">

          <p className="text-[11px] font-medium text-muted-foreground">Sell style</p>

          <p className="text-sm font-medium">{RISE_EXIT_STRATEGIES[exitId]?.name}</p>

        </div>

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

          No open positions — waiting for the next listing that matches this buy style.

        </p>

      )}

    </div>

  );

}



export default function RiseExperiment({ embedded = false }: { embedded?: boolean }) {

  const { persisted, intelQ, markets, ledgerReady } = useRiseExperimentRunner();

  const [activeTab, setActiveTab] = useState<ExperimentTabId>("start");

  const [selP, setSelP] = useState(1);

  const [selE, setSelE] = useState(0);

  const [gridOpen, setGridOpen] = useState(false);

  const [aggressiveOnly, setAggressiveOnly] = useState(false);



  const leaderboard = useMemo(() => {

    const rows: Array<{

      key: string;

      p: number;

      e: number;

      equity: number;

      retPct: number;

      cell: RiseCellState;

    }> = [];

    for (let p = 0; p < RISE_EXPERIMENT_PERSONALITY_COUNT; p++) {

      for (let e = 0; e < RISE_EXPERIMENT_EXIT_COUNT; e++) {

        const key = cellKey(p, e);

        const cell = persisted.cells[key];

        if (!cell) continue;

        const equity = cellEquitySol(cell, persisted.mcByMint);

        rows.push({

          key,

          p,

          e,

          equity,

          retPct: (equity / RISE_EXPERIMENT_START_SOL - 1) * 100,

          cell,

        });

      }

    }

    rows.sort((a, b) => b.equity - a.equity);

    return rows;

  }, [persisted]);



  const mergedTrades = useMemo(() => {

    const all: RiseClosedTrade[] = [];

    for (const cell of Object.values(persisted.cells)) {

      all.push(...cell.closed);

    }

    all.sort((a, b) => b.closedAtMs - a.closedAtMs);

    return all;

  }, [persisted]);



  const discoveryRows = useMemo(() => {

    if (persisted.discoveries.length > 0) return persisted.discoveries;

    if (markets.length === 0) return [];

    const nowMs = intelQ.data?.nowMs ?? Date.now();

    return [...markets]

      .sort((a, b) => {

        const aMs = a.createdAt ? Date.parse(a.createdAt) : 0;

        const bMs = b.createdAt ? Date.parse(b.createdAt) : 0;

        return bMs - aMs;

      })

      .slice(0, 120)

      .map((m) => ({

        atMs: nowMs,

        mint: m.mint,

        symbol: m.symbol?.trim() || "—",

        marketCapUsd: m.marketCapUsd,

      }));

  }, [persisted.discoveries, markets, intelQ.data?.nowMs]);



  const tradesPagination = useTablePagination(mergedTrades, 10);

  const discoveriesPagination = useTablePagination(discoveryRows, 8);

  const selectedCell = persisted.cells[cellKey(selP, selE)];



  const summary = useMemo(() => {

    let sumEq = 0;

    let winners = 0;

    for (const r of leaderboard) {

      sumEq += r.equity;

      if (r.retPct > 0) winners += 1;

    }

    const avgRet = leaderboard.length

      ? (sumEq / leaderboard.length / RISE_EXPERIMENT_START_SOL - 1) * 100

      : 0;

    return { avgRet, winners, totalCells: leaderboard.length };

  }, [leaderboard]);



  const topRow = leaderboard[0];

  const topAggressiveRow = useMemo(

    () => leaderboard.find((r) => isAggressiveStrategy(r.p, r.e)) ?? null,

    [leaderboard],

  );



  const featuredAgent = topRow ?? null;

  const featuredHistory = useMemo(() => {

    const nowMs = intelQ.data?.nowMs ?? Date.now();

    if (!featuredAgent) {

      return buildEquityHistoryFromCell({

        startSol: RISE_EXPERIMENT_START_SOL,

        closedTrades: [],

        currentEquitySol: RISE_EXPERIMENT_START_SOL,

        nowMs,

      });

    }

    return buildEquityHistoryFromCell({

      startSol: RISE_EXPERIMENT_START_SOL,

      closedTrades: featuredAgent.cell.closed,

      currentEquitySol: featuredAgent.equity,

      nowMs,

    });

  }, [featuredAgent, intelQ.data?.nowMs]);





  const visibleLeaderboard = useMemo(

    () => (aggressiveOnly ? leaderboard.filter((r) => isAggressiveStrategy(r.p, r.e)) : leaderboard),

    [leaderboard, aggressiveOnly],

  );



  const selectStrategy = (p: number, e: number, switchTab = false) => {

    setSelP(p);

    setSelE(e);

    if (switchTab) setActiveTab("results");

  };



  const leaderboardCards = visibleLeaderboard.slice(0, 8).map((r, i) => ({

    key: r.key,

    rank: i + 1,

    label: formatRiseStrategyLabel(r.p, r.e),

    equityLabel: `${formatSol(r.equity)} SOL`,

    retPct: r.retPct,

    openCount: r.cell.open.length,

    badge: strategyBadge(r.p, r.e),

    selected: selP === r.p && selE === r.e,

  }));



  const tradeFeedItems = tradesPagination.slice.map((t) => ({

    id: `${t.closedAtMs}-${t.mint}-${t.reason}`,

    timeLabel: formatTs(t.closedAtMs),

    strategyLabel: formatRiseStrategyLabel(t.personalityId, t.exitStrategyId),

    tokenLabel: t.symbol,

    reasonLabel: t.reason,

    pnlLabel: `${formatSol(t.pnlSol)} SOL`,

    pnlPositive: t.pnlSol > 0,

    pnlNegative: t.pnlSol < 0,

    href: buildRiseTradeUrl(t.mint) ?? `https://rise.rich/trade/${encodeURIComponent(t.mint)}`,

    hrefLabel: "Trade on RISE",

  }));



  const discoveryFeedItems = discoveriesPagination.slice.map((d) => ({

    id: `${d.atMs}-${d.mint}`,

    timeLabel: formatTs(d.atMs),

    strategyLabel: d.marketCapUsd != null ? `Market cap ${formatCompactUsd(d.marketCapUsd)}` : "New listing",

    tokenLabel: d.symbol,

    reasonLabel: "Spotted on live RISE tape",

    pnlLabel: "",

    pnlPositive: false,

    pnlNegative: false,

    href: buildRiseTradeUrl(d.mint) ?? `https://rise.rich/trade/${encodeURIComponent(d.mint)}`,

    hrefLabel: "Trade on RISE",

  }));



  return (

    <TooltipProvider delayDuration={200}>

      <div

        className={cn(

          "relative text-foreground",

          embedded ? "w-full min-w-0" : "flex min-h-screen min-w-0 flex-col bg-background",

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
            platformLabel="RISE"
            bankLabel="10 SOL paper agent"
            strategyLabel={featuredAgent ? formatRiseStrategyLabel(featuredAgent.p, featuredAgent.e) : "Warming up…"}
            startBalance={RISE_EXPERIMENT_START_SOL}
            currentBalance={featuredAgent?.equity ?? RISE_EXPERIMENT_START_SOL}
            retPct={featuredAgent?.retPct ?? 0}
            closedCount={featuredAgent?.cell?.closed.length ?? 0}
            openCount={featuredAgent?.cell?.open.length ?? 0}
            historyPoints={featuredHistory}
            formatBalance={formatExperimentSol}
            formatAxis={(n) => `${n.toFixed(1)}`}
            accent="alpha"
          />



          <RiseExperimentHero

            embedded={embedded}

            loading={intelQ.isFetching || !ledgerReady}

            failed={intelQ.isError}

            onRefresh={() => void intelQ.refetch()}

          />



          <RiseExperimentStats

            loading={intelQ.isLoading || !ledgerReady}

            avgRetPct={summary.avgRet}

            winners={summary.winners}

            totalStrategies={summary.totalCells}

            topStrategyLabel={

              topAggressiveRow

                ? formatRiseStrategyLabel(topAggressiveRow.p, topAggressiveRow.e)

                : topRow

                  ? formatRiseStrategyLabel(topRow.p, topRow.e)

                  : null

            }

            topRetPct={topAggressiveRow?.retPct ?? topRow?.retPct ?? null}

            newListings={persisted.discoveries.length}

            borrowAprPct={intelQ.data?.rise.borrowAprPct}

          />



          {intelQ.isError ? (

            <Card className="border-destructive/25 bg-destructive/[0.04]">

              <CardContent className="space-y-3 p-5">

                <p className="text-sm font-medium">Could not load RISE markets feed</p>

                <p className="text-sm text-muted-foreground">{(intelQ.error as Error)?.message}</p>

                <Button type="button" variant="secondary" size="sm" className="rounded-xl" onClick={() => void intelQ.refetch()}>

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

                  description="Every strategy trades with fake SOL on live RISE listings. Some use vault leverage to amplify bets — still all simulated."

                  accentIconClass="text-sky-500"

                />



                <section className="space-y-4">

                  <LpSectionHeader

                    kicker="Step 1"

                    title="How it works"

                    description="Three steps. No trading experience needed."

                  />

                  <RiseHowItWorks />

                </section>



                <section className="space-y-4">

                  <LpSectionHeader

                    kicker="Step 2"

                    title="Pick a recommended strategy"

                    description="Curated combos with quality filters and sensible exits."

                  />

                  <RiseRecommendedStrategies

                    selectedPersonalityId={selP}

                    selectedExitId={selE}

                    onSelect={(p, e) => selectStrategy(p, e, true)}

                  />

                </section>



                <section className="space-y-4">

                  <LpSectionHeader

                    kicker="Step 3"

                    title="Or try a sniper"

                    description="Snipers target specific listing stages — fresh launch, high quality, or watchlist."

                  />

                  <RiseSniperAgents

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

                      <Button

                        type="button"

                        size="sm"

                        variant={aggressiveOnly ? "secondary" : "outline"}

                        className="h-9 rounded-xl"

                        onClick={() => setAggressiveOnly((v) => !v)}

                      >

                        {aggressiveOnly ? "Showing aggressive" : "Aggressive only"}

                      </Button>

                    }

                  />

                  <ExperimentLeaderboardList

                    rows={leaderboardCards}

                    emptyMessage={

                      aggressiveOnly

                        ? "No aggressive strategies in profit yet — they need a big runner first."

                        : "Strategies are warming up. Check back once new listings appear."

                    }

                    accentRingClass="ring-sky-500/30 border-sky-500/35"

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

                        <label className="text-sm font-medium text-foreground" htmlFor="rise-buy-style">

                          When to buy

                        </label>

                        <Select value={String(selP)} onValueChange={(v) => setSelP(Number(v))}>

                          <SelectTrigger id="rise-buy-style" className="h-11 rounded-xl border-border/60">

                            <SelectValue />

                          </SelectTrigger>

                          <SelectContent className="max-h-72 rounded-xl">

                            {RISE_PERSONALITIES.map((p) => (

                              <SelectItem key={p.id} value={String(p.id)}>

                                {p.name}

                              </SelectItem>

                            ))}

                          </SelectContent>

                        </Select>

                        <p className="text-xs leading-relaxed text-muted-foreground">

                          {RISE_PERSONALITIES[selP]?.description}

                        </p>

                      </div>

                      <div className="space-y-2">

                        <label className="text-sm font-medium text-foreground" htmlFor="rise-sell-style">

                          When to sell

                        </label>

                        <Select value={String(selE)} onValueChange={(v) => setSelE(Number(v))}>

                          <SelectTrigger id="rise-sell-style" className="h-11 rounded-xl border-border/60">

                            <SelectValue />

                          </SelectTrigger>

                          <SelectContent className="max-h-72 rounded-xl">

                            {RISE_EXIT_STRATEGIES.map((e) => (

                              <SelectItem key={e.id} value={String(e.id)}>

                                {e.name}

                              </SelectItem>

                            ))}

                          </SelectContent>

                        </Select>

                        <p className="text-xs leading-relaxed text-muted-foreground">

                          {RISE_EXIT_STRATEGIES[selE]?.description}

                        </p>

                      </div>

                    </div>



                    {selectedCell ? (

                      <div className="mt-5">

                        <StrategyDetailCard

                          cell={selectedCell}

                          mcByMint={persisted.mcByMint}

                          personalityId={selP}

                          exitId={selE}

                        />

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

                        "hover:border-sky-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",

                      )}

                    >

                      <div className="min-w-0 space-y-1">

                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">

                          Advanced

                        </p>

                        <p className="text-base font-semibold tracking-tight text-foreground">

                          View all 64 strategies

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

                        <div className="min-w-[640px] space-y-1">

                          <div

                            className="grid gap-1"

                            style={{

                              gridTemplateColumns: `72px repeat(${RISE_EXPERIMENT_EXIT_COUNT}, minmax(0,1fr))`,

                            }}

                          >

                            <div />

                            {RISE_EXIT_STRATEGIES.map((e) => (

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

                            {RISE_PERSONALITIES.map((p) => (

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

                                {RISE_EXIT_STRATEGIES.map((e) => {

                                  const cell = persisted.cells[cellKey(p.id, e.id)];

                                  const equity = cell ? cellEquitySol(cell, persisted.mcByMint) : 0;

                                  const ret = (equity / RISE_EXPERIMENT_START_SOL - 1) * 100;

                                  const active = selP === p.id && selE === e.id;

                                  return (

                                    <button

                                      key={e.id}

                                      type="button"

                                      onClick={() => selectStrategy(p.id, e.id)}

                                      className={cn(

                                        "flex h-12 flex-col items-center justify-center rounded-lg border px-0.5 text-center transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",

                                        heatClass(ret),

                                        active && "ring-2 ring-sky-500 ring-offset-2 ring-offset-background",

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

              <>

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

                      loading={intelQ.isFetching}

                      itemLabel="trades"

                      className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3"

                    />

                  ) : null}

                </section>



                <section className="space-y-4">

                  <LpSectionHeader

                    kicker="Discoveries"

                    title="Fresh RISE listings"

                    description="New tokens spotted on the live tape."

                    action={

                      intelQ.data ? (

                        <Badge variant="outline" className="rounded-lg border-border/60 font-mono text-[11px]">

                          {intelQ.data.marketCount.toLocaleString()} markets

                        </Badge>

                      ) : null

                    }

                  />

                  {discoveryRows.length === 0 ? (

                    <div className={cn(overviewCardShell, "rounded-2xl px-6 py-14 text-center text-sm text-muted-foreground")}>

                      {!ledgerReady || intelQ.isLoading

                        ? "Loading RISE markets…"

                        : intelQ.isError

                          ? "RISE markets feed unavailable — try Refresh."

                          : "No RISE listings on the tape yet."}

                    </div>

                  ) : (

                    <>

                      <ul className="space-y-2">

                        {discoveryFeedItems.map((d) => (

                          <li

                            key={d.id}

                            className={cn(

                              overviewCardShell,

                              "flex items-center justify-between gap-3 rounded-2xl p-4 transition-[border-color] duration-200 hover:border-border/70",

                            )}

                          >

                            <div className="min-w-0">

                              <p className="text-sm font-semibold tracking-tight text-foreground">{d.tokenLabel}</p>

                              <p className="text-xs text-muted-foreground">{d.strategyLabel}</p>

                            </div>

                            {d.href ? (

                              <a

                                href={d.href}

                                target="_blank"

                                rel="noopener noreferrer"

                                className="inline-flex h-9 items-center gap-1 rounded-xl border border-border/60 bg-background/30 px-3 text-xs font-medium text-primary transition-colors hover:bg-background/60"

                              >

                                Trade

                                <ArrowUpRight className="h-3 w-3" aria-hidden />

                              </a>

                            ) : null}

                          </li>

                        ))}

                      </ul>

                      <PremiumTablePagination

                        page={discoveriesPagination.page}

                        pageSize={discoveriesPagination.pageSize}

                        totalItems={discoveriesPagination.totalItems}

                        onPageChange={discoveriesPagination.setPage}

                        onPageSizeChange={discoveriesPagination.setPageSize}

                        pageSizeOptions={[8, 16, 32]}

                        loading={intelQ.isFetching || !ledgerReady}

                        itemLabel="listings"

                        className="rounded-2xl border border-border/50 bg-muted/20 px-4 py-3"

                      />

                    </>

                  )}

                </section>

              </>

            }

          />

        </main>

      </div>

    </TooltipProvider>

  );

}


