import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Grid3x3,
  LayoutList,
  Loader2,
  RefreshCw,
  Rocket,
  Scale,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import type { PumpfunAlphaPeriod } from "@/lib/pumpfunAlphaTrendApi";
import {
  PUMPFUN_EXIT_STRATEGIES,
  PUMPFUN_EXPERIMENT_ENTRY_SOL,
  PUMPFUN_EXPERIMENT_EXIT_COUNT,
  PUMPFUN_EXPERIMENT_PERSONALITY_COUNT,
  PUMPFUN_EXPERIMENT_START_SOL,
  PUMPFUN_PERSONALITIES,
  cellKey,
  positionMarkValueSol,
  totalEquitySol,
  type PumpfunCellState,
  type PumpfunClosedTrade,
} from "@/lib/pumpfunExperimentModel";
import { usePumpfunExperimentRunner } from "@/hooks/usePumpfunExperimentRunner";

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

export default function PumpfunExperiment() {
  const [period, setPeriod] = useState<PumpfunAlphaPeriod>("today");
  const { persisted, trendQ, resetAll } = usePumpfunExperimentRunner(period);
  const [selP, setSelP] = useState(0);
  const [selE, setSelE] = useState(0);

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
    return all.slice(0, 400);
  }, [persisted]);

  const selectedCell = persisted.cells[cellKey(selP, selE)];

  const summary = useMemo(() => {
    let sumEq = 0;
    let winners = 0;
    for (const r of leaderboard) {
      sumEq += r.equity;
      if (r.retPct > 0) winners += 1;
    }
    const avgRet = leaderboard.length ? (sumEq / leaderboard.length / PUMPFUN_EXPERIMENT_START_SOL - 1) * 100 : 0;
    return { sumEq, winners, avgRet, totalCells: leaderboard.length };
  }, [leaderboard]);

  const topRow = leaderboard[0];
  const bottomRow = leaderboard[leaderboard.length - 1];

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
          "flex flex-col min-h-0 pb-10",
        )}
      >
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/55 bg-gradient-to-br from-violet-950/35 via-card/90 to-background px-5 py-8 shadow-[0_28px_90px_-52px_rgba(0,0,0,0.9)] sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border) / 0.18) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border) / 0.18) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />
          <div
            className="pointer-events-none absolute -left-20 top-0 h-[280px] w-[280px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.22), transparent 65%)" }}
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md">
                <Rocket className="h-3.5 w-3.5 text-violet-400" aria-hidden />
                Live paper lab
              </div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Pumpfun experiment
              </h1>
              <p className="max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Fifteen entry personalities × fifteen exit rules — 225 independent 10&nbsp;SOL desks compounding 1&nbsp;SOL
                clips on every fresh graduate that hits the same Alpha Pumpfun feed. Deterministic paper marks move with
                live market cap snapshots from the API — not on-chain execution.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="rounded-lg border border-border/50 bg-background/40 font-medium">
                  <Sparkles className="mr-1.5 h-3 w-3 opacity-80" aria-hidden />
                  Alpha-linked feed
                </Badge>
                <Badge variant="secondary" className="rounded-lg border border-border/50 bg-background/40 font-medium">
                  <Activity className="mr-1.5 h-3 w-3 opacity-80" aria-hidden />
                  225 strategy cells
                </Badge>
                <Badge variant="outline" className="rounded-lg border-amber-500/25 text-amber-200/90">
                  Simulation only
                </Badge>
              </div>
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
                    className="h-9 min-w-14 rounded-xl px-4 font-semibold"
                    onClick={() => setPeriod(id)}
                    disabled={trendQ.isFetching}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 gap-2 rounded-xl border-border/70"
                onClick={() => void trendQ.refetch()}
                disabled={trendQ.isFetching}
              >
                {trendQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9 gap-2 rounded-xl border-red-500/25 text-red-200/90"
                  >
                    <Trash2 className="h-4 w-4" />
                    Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl border-border/60">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset entire experiment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Clears all paper balances, open bags, trade history, and feed memory. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                    <AlertDialogAction className="rounded-xl bg-red-600 hover:bg-red-600/90" onClick={resetAll}>
                      Reset all
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        {trendQ.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[108px] rounded-2xl" />
            ))}
          </div>
        ) : trendQ.data ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="relative overflow-hidden border-border/55 bg-gradient-to-br from-card/95 to-muted/[0.04] shadow-lg">
              <CardContent className="relative space-y-1 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Avg desk</p>
                <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">{formatPct(summary.avgRet)}</p>
                <p className="text-[11px] text-muted-foreground/80">Mean return vs 10&nbsp;SOL start across 225 cells</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-border/55 bg-gradient-to-br from-card/95 to-muted/[0.04] shadow-lg">
              <CardContent className="relative space-y-1 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Winning desks</p>
                <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">
                  {summary.winners}
                  <span className="text-base font-medium text-muted-foreground"> / {summary.totalCells}</span>
                </p>
                <p className="text-[11px] text-muted-foreground/80">Cells with positive mark-to-market</p>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-emerald-500/15 bg-gradient-to-br from-emerald-950/25 to-card/90 shadow-lg ring-1 ring-emerald-500/10">
              <CardContent className="relative space-y-1 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-200/70">Leader</p>
                {topRow ? (
                  <>
                    <p className="font-mono text-xl font-semibold tabular-nums text-emerald-100">
                      {PUMPFUN_PERSONALITIES[topRow.p]?.short} · {PUMPFUN_EXIT_STRATEGIES[topRow.e]?.short}
                    </p>
                    <p className="text-[11px] text-muted-foreground/85">
                      {formatSol(topRow.equity)} SOL · {formatPct(topRow.retPct)}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">—</p>
                )}
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden border-border/55 bg-gradient-to-br from-card/95 to-muted/[0.04] shadow-lg">
              <CardContent className="relative space-y-1 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">New this session</p>
                <p className="font-mono text-2xl font-semibold tabular-nums tracking-tight">{persisted.discoveries.length}</p>
                <p className="text-[11px] text-muted-foreground/80">Unique mints discovered after bootstrap</p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {trendQ.isError ? (
          <Card className="border-destructive/25 bg-destructive/[0.04]">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-medium">Unable to load Alpha Pumpfun feed</p>
              <p className="text-sm text-muted-foreground">{(trendQ.error as Error)?.message}</p>
              <Button type="button" variant="secondary" size="sm" className="rounded-xl" onClick={() => void trendQ.refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Tabs defaultValue="overview" className="mt-8 min-h-0 flex-1">
          <TabsList className="mb-6 grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-border/55 bg-muted/20 p-1 sm:inline-flex sm:w-auto">
            <TabsTrigger value="overview" className="gap-2 rounded-xl py-2.5 data-[state=active]:shadow-md">
              <BarChart3 className="h-4 w-4 opacity-80" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="matrix" className="gap-2 rounded-xl py-2.5 data-[state=active]:shadow-md">
              <Grid3x3 className="h-4 w-4 opacity-80" />
              Matrix
            </TabsTrigger>
            <TabsTrigger value="ledger" className="gap-2 rounded-xl py-2.5 data-[state=active]:shadow-md">
              <LayoutList className="h-4 w-4 opacity-80" />
              Ledger
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-0 space-y-6 outline-none">
            <div className="grid gap-6 xl:grid-cols-5">
              <Card className="border-border/55 bg-card/55 backdrop-blur-md xl:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scale className="h-4 w-4 text-primary" />
                    How the lab routes capital
                  </CardTitle>
                  <CardDescription>
                    Each cell is an isolated desk. Personalities gate which mints qualify; exits fire on live MC ratios
                    from the same snapshot Alpha uses.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Entries:</span> whenever the feed surfaces a mint we
                    have not recorded before, every desk whose personality passes and still holds ≥{" "}
                    {PUMPFUN_EXPERIMENT_ENTRY_SOL}&nbsp;SOL cash deploys exactly {PUMPFUN_EXPERIMENT_ENTRY_SOL}&nbsp;SOL
                    notional. Each desk buys a given mint at most once for its whole lifetime (open or fully realized —
                    no rebuys after exit).
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Marks:</span> position value scales with{" "}
                    <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-xs">currentMc / entryMc</code>{" "}
                    while the mint stays observable. Missing rows reuse the last cached MC until the token reappears.
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Compounding:</span> realized exits credit the same
                    desk balance, so winners can pyramid into more clips while underwater desks naturally go quiet once
                    they cannot fund another {PUMPFUN_EXPERIMENT_ENTRY_SOL}&nbsp;SOL ticket.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-border/55 bg-card/55 backdrop-blur-md xl:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Desk spotlight</CardTitle>
                  <CardDescription>Inspect any personality × exit pairing.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Personality</p>
                      <Select value={String(selP)} onValueChange={(v) => setSelP(Number(v))}>
                        <SelectTrigger className="rounded-xl border-border/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 rounded-xl">
                          {PUMPFUN_PERSONALITIES.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.short} — {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Exit rule</p>
                      <Select value={String(selE)} onValueChange={(v) => setSelE(Number(v))}>
                        <SelectTrigger className="rounded-xl border-border/60">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 rounded-xl">
                          {PUMPFUN_EXIT_STRATEGIES.map((e) => (
                            <SelectItem key={e.id} value={String(e.id)}>
                              {e.short} — {e.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {selectedCell ? (
                    <DeskDetailCard cell={selectedCell} mcByMint={persisted.mcByMint} personalityId={selP} exitId={selE} />
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card className="border-border/55 bg-card/50 backdrop-blur-md">
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
                <div>
                  <CardTitle className="text-lg">Leaderboard</CardTitle>
                  <CardDescription>Top desks by total equity (cash + open marks).</CardDescription>
                </div>
                {bottomRow ? (
                  <Badge variant="outline" className="rounded-lg border-border/60 font-mono text-[11px]">
                    Tail: {PUMPFUN_PERSONALITIES[bottomRow.p]?.short} · {PUMPFUN_EXIT_STRATEGIES[bottomRow.e]?.short}{" "}
                    ({formatPct(bottomRow.retPct)})
                  </Badge>
                ) : null}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[min(520px,55vh)] pr-3">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="w-12 text-[11px] uppercase">#</TableHead>
                        <TableHead className="text-[11px] uppercase">Desk</TableHead>
                        <TableHead className="text-right text-[11px] uppercase">Equity</TableHead>
                        <TableHead className="text-right text-[11px] uppercase">Return</TableHead>
                        <TableHead className="text-right text-[11px] uppercase">Open</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.slice(0, 40).map((r, i) => (
                        <TableRow
                          key={r.key}
                          className={cn(
                            "cursor-pointer border-border/40",
                            selP === r.p && selE === r.e ? "bg-primary/[0.06]" : "hover:bg-muted/25",
                          )}
                          onClick={() => {
                            setSelP(r.p);
                            setSelE(r.e);
                          }}
                        >
                          <TableCell className="font-mono text-xs text-muted-foreground">{i + 1}</TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {PUMPFUN_PERSONALITIES[r.p]?.name} · {PUMPFUN_EXIT_STRATEGIES[r.e]?.name}
                              </p>
                              <p className="truncate font-mono text-[11px] text-muted-foreground">{r.key}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm tabular-nums">{formatSol(r.equity)}</TableCell>
                          <TableCell
                            className={cn(
                              "text-right font-mono text-sm tabular-nums",
                              r.retPct > 0 ? "text-emerald-400" : r.retPct < 0 ? "text-red-400" : "text-muted-foreground",
                            )}
                          >
                            {formatPct(r.retPct)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                            {r.cell.open.length}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matrix" className="mt-0 outline-none">
            <Card className="border-border/55 bg-card/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg">15 × 15 performance heatmap</CardTitle>
                <CardDescription>
                  Rows are personalities (entry filters). Columns are exit strategies. Click a tile.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 overflow-x-auto">
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
                          <div className="flex h-10 items-center justify-center rounded-lg border border-border/40 bg-muted/20 px-0.5 text-center text-[10px] font-semibold uppercase leading-tight text-muted-foreground">
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
                              onClick={() => {
                                setSelP(p.id);
                                setSelE(e.id);
                              }}
                              className={cn(
                                "flex h-12 flex-col items-center justify-center rounded-lg border px-0.5 text-center transition-all hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                heatClass(ret),
                                active && "ring-2 ring-primary ring-offset-2 ring-offset-background",
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
          </TabsContent>

          <TabsContent value="ledger" className="mt-0 outline-none">
            <Card className="border-border/55 bg-card/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg">Global trade ledger</CardTitle>
                <CardDescription>Most recent realized clips across all desks (newest first).</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[min(640px,60vh)] pr-3">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-[11px] uppercase">Time</TableHead>
                        <TableHead className="text-[11px] uppercase">Desk</TableHead>
                        <TableHead className="text-[11px] uppercase">Token</TableHead>
                        <TableHead className="text-[11px] uppercase">Reason</TableHead>
                        <TableHead className="text-right text-[11px] uppercase">PnL</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mergedTrades.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-12 text-center text-sm text-muted-foreground">
                            No realized trades yet — wait for the feed to print fresh mints after bootstrap.
                          </TableCell>
                        </TableRow>
                      ) : (
                        mergedTrades.map((t, idx) => (
                          <TableRow key={`${t.closedAtMs}-${t.mint}-${idx}-${t.reason}`} className="border-border/40">
                            <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                              {new Date(t.closedAtMs).toLocaleString(undefined, { timeStyle: "short", dateStyle: "short" })}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {PUMPFUN_PERSONALITIES[t.personalityId]?.short}·{PUMPFUN_EXIT_STRATEGIES[t.exitStrategyId]?.short}
                            </TableCell>
                            <TableCell>
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{t.symbol}</p>
                                <a
                                  href={`https://pump.fun/coin/${encodeURIComponent(t.mint)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-mono text-[11px] text-primary hover:underline"
                                >
                                  {t.mint.slice(0, 4)}…{t.mint.slice(-4)}
                                  <ArrowUpRight className="h-3 w-3" />
                                </a>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">{t.reason}</TableCell>
                            <TableCell
                              className={cn(
                                "text-right font-mono text-sm tabular-nums",
                                t.pnlSol > 0 ? "text-emerald-400" : t.pnlSol < 0 ? "text-red-400" : "text-muted-foreground",
                              )}
                            >
                              {formatSol(t.pnlSol)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
}

function DeskDetailCard({
  cell,
  mcByMint,
  personalityId,
  exitId,
}: {
  cell: PumpfunCellState;
  mcByMint: Record<string, number | null>;
  personalityId: number;
  exitId: number;
}) {
  const equity = totalEquitySol(cell, mcByMint);
  const ret = (equity / PUMPFUN_EXPERIMENT_START_SOL - 1) * 100;
  const pMeta = PUMPFUN_PERSONALITIES[personalityId];
  const eMeta = PUMPFUN_EXIT_STRATEGIES[exitId];

  return (
    <div className="space-y-4 rounded-2xl border border-border/50 bg-background/30 p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Total equity</p>
          <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight">{formatSol(equity)} SOL</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Return</p>
          <p
            className={cn(
              "font-mono text-2xl font-semibold tabular-nums",
              ret > 0 ? "text-emerald-400" : ret < 0 ? "text-red-400" : "text-foreground",
            )}
          >
            {formatPct(ret)}
          </p>
        </div>
      </div>
      <div className="grid gap-2 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Personality:</span> {pMeta?.description}
        </p>
        <p>
          <span className="font-medium text-foreground">Exit:</span> {eMeta?.description}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="rounded-lg font-mono text-[11px]">
          <Wallet className="mr-1 h-3 w-3" />
          Cash {formatSol(cell.balanceSol)}
        </Badge>
        <Badge variant="outline" className="rounded-lg font-mono text-[11px]">
          <TrendingUp className="mr-1 h-3 w-3" />
          Open {cell.open.length}
        </Badge>
        <Badge variant="outline" className="rounded-lg font-mono text-[11px]">
          Realized {cell.closed.length} clips
        </Badge>
      </div>
      {cell.open.length ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Open bags</p>
          <ul className="max-h-40 space-y-2 overflow-y-auto pr-1">
            {cell.open.map((o) => {
              const mc = mcByMint[o.mint] ?? o.entryMc;
              const mark = positionMarkValueSol(o, mc);
              const r = ((mc ?? o.entryMc) / o.entryMc - 1) * 100;
              return (
                <li
                  key={`${o.mint}-${o.entryAtMs}`}
                  className="flex items-center justify-between gap-2 rounded-xl border border-border/40 bg-muted/[0.08] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{o.symbol}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      {o.mint.slice(0, 6)}…{o.mint.slice(-4)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-mono text-xs tabular-nums">{formatSol(mark)} SOL</p>
                    <p className={cn("font-mono text-[10px] tabular-nums", r >= 0 ? "text-emerald-400" : "text-red-400")}>
                      {formatPct(r)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
