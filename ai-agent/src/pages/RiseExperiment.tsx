import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Crosshair,
  Landmark,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  TrendingUp,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import type { PumpfunAlphaPeriod } from "@/lib/pumpfunAlphaTrendApi";
import { buildRiseTradeUrl, RISE_ALPHA_TOKEN_MINT } from "@/lib/riseToken";
import {
  RISE_EXPERIMENT_BORROW_APR,
  RISE_EXPERIMENT_ENTRY_SOL,
  RISE_EXPERIMENT_MAX_BORROW_SOL,
  RISE_EXPERIMENT_START_SOL,
  agentEquitySol,
  positionMarkValueSol,
  type RiseExperimentAgentId,
  type RiseExperimentPersisted,
} from "@/lib/riseExperimentModel";
import { useRiseExperimentRunner } from "@/hooks/useRiseExperimentRunner";

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

const AGENT_META: Record<
  RiseExperimentAgentId,
  { title: string; subtitle: string; badge: string }
> = {
  universal: {
    title: "Universal sniper",
    subtitle: "Paper clips every fresh graduate that appears in the Alpha feed (same tape as Pumpfun).",
    badge: "All new releases",
  },
  riseAlpha: {
    title: "Rise Alpha sniper",
    subtitle: "Only trades the RISE-listed $UPONLY mint — same token as the Up Only fund desk.",
    badge: "$UPONLY on RISE",
  },
};

function AgentDeskCard({
  agentId,
  persisted,
}: {
  agentId: RiseExperimentAgentId;
  persisted: RiseExperimentPersisted;
}) {
  const agent = persisted.agents[agentId];
  const meta = AGENT_META[agentId];
  const equity = agentEquitySol(agent, persisted.mcByMint);
  const retPct = (equity / RISE_EXPERIMENT_START_SOL - 1) * 100;

  const openNotional = agent.open.reduce((s, p) => s + positionMarkValueSol(p, persisted.mcByMint[p.mint]), 0);

  return (
    <Card className="border-border/55 bg-card/55 backdrop-blur-md">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg tracking-tight">{meta.title}</CardTitle>
            <CardDescription className="text-[13px] leading-relaxed">{meta.subtitle}</CardDescription>
          </div>
          <Badge variant="secondary" className="shrink-0 rounded-lg border border-border/55 bg-background/40 font-medium">
            {meta.badge}
          </Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/45 bg-muted/[0.08] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/75">Equity (paper)</p>
            <p className="mt-1 font-mono text-2xl font-semibold tabular-nums tracking-tight">{formatSol(equity)} SOL</p>
            <p className="mt-1 text-[11px] text-muted-foreground/85">Return {formatPct(retPct)} vs {RISE_EXPERIMENT_START_SOL}&nbsp;SOL start</p>
          </div>
          <div className="rounded-2xl border border-border/45 bg-muted/[0.08] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/75">Cash · marks</p>
            <p className="mt-1 font-mono text-sm font-semibold tabular-nums text-foreground">
              {formatSol(agent.balanceSol)} cash · {formatSol(openNotional)} open
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/85">
              Each clip {RISE_EXPERIMENT_ENTRY_SOL}&nbsp;SOL · borrow cap {RISE_EXPERIMENT_MAX_BORROW_SOL}&nbsp;SOL
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-200/80">Borrowed</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{formatSol(agent.borrowedPrincipalSol)} SOL</p>
          </div>
          <div className="rounded-xl border border-border/45 bg-background/25 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Interest owed</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{formatSol(agent.interestOwedSol)} SOL</p>
          </div>
          <div className="rounded-xl border border-border/45 bg-background/25 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Interest paid</p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{formatSol(agent.interestPaidAllTimeSol)} SOL</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Open positions</p>
          <p className="text-[11px] font-medium text-muted-foreground">{agent.open.length} live</p>
        </div>
        {agent.open.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open clips — waiting for the next qualifying mint.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/45">
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-[11px] uppercase text-muted-foreground">Symbol</TableHead>
                  <TableHead className="text-right text-[11px] uppercase text-muted-foreground">Clip</TableHead>
                  <TableHead className="text-right text-[11px] uppercase text-muted-foreground">Borrow leg</TableHead>
                  <TableHead className="text-right text-[11px] uppercase text-muted-foreground">Mark</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agent.open.map((p) => {
                  const mc = persisted.mcByMint[p.mint];
                  const mark = positionMarkValueSol(p, mc);
                  return (
                    <TableRow key={`${agentId}-${p.mint}`} className="border-border/40">
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-semibold tracking-tight">{p.symbol}</p>
                          <p className="truncate font-mono text-[11px] text-muted-foreground">{p.mint}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">{formatSol(p.solNotional)}</TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums text-amber-200/90">
                        {p.borrowedForLegSol > 0 ? formatSol(p.borrowedForLegSol) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">{formatSol(mark)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RiseExperiment() {
  const [period, setPeriod] = useState<PumpfunAlphaPeriod>("today");
  const { persisted, intelQ, resetAll } = useRiseExperimentRunner(period);

  const mergedTrades = useMemo(() => {
    const all = [...persisted.agents.universal.closed, ...persisted.agents.riseAlpha.closed];
    all.sort((a, b) => b.closedAtMs - a.closedAtMs);
    return all.slice(0, 320);
  }, [persisted.agents.riseAlpha.closed, persisted.agents.universal.closed]);

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
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-border/55 bg-gradient-to-br from-sky-950/30 via-card/90 to-background px-5 py-8 shadow-[0_28px_90px_-52px_rgba(0,0,0,0.9)] sm:px-8 sm:py-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.45]"
            style={{
              backgroundImage: `
                linear-gradient(to right, hsl(var(--border) / 0.18) 1px, transparent 1px),
                linear-gradient(to bottom, hsl(var(--border) / 0.18) 1px, transparent 1px)
              `,
              backgroundSize: "48px 48px",
            }}
          />
          <div
            className="pointer-events-none absolute -right-16 top-0 h-[260px] w-[260px] rounded-full blur-3xl"
            style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.2), transparent 65%)" }}
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/55 bg-background/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground backdrop-blur-md">
                <Crosshair className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                Rise borrow lab
              </div>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Rise experiment</h1>
              <p className="max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Two isolated snipers — Universal clips every fresh Pumpfun graduate, while Rise Alpha only paper-trades
                the RISE-listed $UPONLY token. Each desk starts with {RISE_EXPERIMENT_START_SOL}&nbsp;SOL, deploys{" "}
                {RISE_EXPERIMENT_ENTRY_SOL}&nbsp;SOL per entry, and may draw up to {RISE_EXPERIMENT_MAX_BORROW_SOL}&nbsp;SOL
                from a modeled Rise vault at {(RISE_EXPERIMENT_BORROW_APR * 100).toFixed(0)}% APR to stay in the game when
                cash is tight. Interest accrues continuously and is auto-paid from exits before principal.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="rounded-lg border border-border/50 bg-background/40 font-medium">
                  <Sparkles className="mr-1.5 h-3 w-3 opacity-80" aria-hidden />
                  Pumpfun + $UPONLY
                </Badge>
                <Badge variant="secondary" className="rounded-lg border border-border/50 bg-background/40 font-medium">
                  <Landmark className="mr-1.5 h-3 w-3 opacity-80" aria-hidden />
                  Borrow + interest ledger
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
                    disabled={intelQ.isFetching}
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
                onClick={() => void intelQ.refetch()}
                disabled={intelQ.isFetching}
              >
                {intelQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" className="h-9 gap-2 rounded-xl border-red-500/25 text-red-200/90">
                    <Trash2 className="h-4 w-4" />
                    Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-2xl border-border/60">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Rise experiment?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Clears both desks, borrow balances, interest accrual, and tape memory. This cannot be undone.
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

        {intelQ.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[104px] rounded-2xl" />
            ))}
          </div>
        ) : intelQ.data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/55 bg-card/60">
              <CardContent className="space-y-1 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Borrow pool</p>
                <p className="font-mono text-xl font-semibold tabular-nums">{formatCompactUsd(intelQ.data.rise.borrowPoolUsd)}</p>
                <p className="text-[11px] text-muted-foreground/80">Modeled Rise vault depth (USD)</p>
              </CardContent>
            </Card>
            <Card className="border-border/55 bg-card/60">
              <CardContent className="space-y-1 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Utilization</p>
                <p className="font-mono text-xl font-semibold tabular-nums">{intelQ.data.rise.utilizationPct.toFixed(1)}%</p>
                <p className="text-[11px] text-muted-foreground/80">Borrow demand vs pool capacity</p>
              </CardContent>
            </Card>
            <Card className="border-border/55 bg-card/60">
              <CardContent className="space-y-1 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">Borrow APR</p>
                <p className="font-mono text-xl font-semibold tabular-nums">{intelQ.data.rise.borrowAprPct.toFixed(2)}%</p>
                <p className="text-[11px] text-muted-foreground/80">Variable borrow (paper lens)</p>
              </CardContent>
            </Card>
            <Card className="border-border/55 bg-card/60">
              <CardContent className="space-y-1 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">$UPONLY MC</p>
                <p className="font-mono text-xl font-semibold tabular-nums">
                  {formatCompactUsd(intelQ.data.token.marketCapUsd)}
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  Pumpfun tape: {intelQ.data.matchedCount} grads · {formatTs(intelQ.data.nowMs)}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {intelQ.isError ? (
          <Card className="border-destructive/25 bg-destructive/[0.04]">
            <CardContent className="space-y-3 p-5">
              <p className="text-sm font-medium">Unable to load experiment feeds</p>
              <p className="text-sm text-muted-foreground">{(intelQ.error as Error)?.message}</p>
              <Button type="button" variant="secondary" size="sm" className="rounded-xl" onClick={() => void intelQ.refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <AgentDeskCard agentId="universal" persisted={persisted} />
          <AgentDeskCard agentId="riseAlpha" persisted={persisted} />
        </div>

        <Card className="mt-8 border-border/55 bg-card/50 backdrop-blur-md">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-4 w-4 text-primary" aria-hidden />
                Trade ledger
              </CardTitle>
              <CardDescription>Unified log — interest and principal repayments are captured per fill.</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="cursor-default rounded-lg border-border/60 font-mono text-[11px]">
                  {mergedTrades.length} rows
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                Exits route proceeds through Rise settlement: pay accrued interest first, knock down borrow principal, then
                credit remaining SOL to the desk wallet.
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[min(480px,50vh)] pr-3">
              {mergedTrades.length === 0 ? (
                <p className="text-sm text-muted-foreground">No closed trades yet — feed needs fresh mints after bootstrap.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-[11px] uppercase text-muted-foreground">Time</TableHead>
                      <TableHead className="text-[11px] uppercase text-muted-foreground">Desk</TableHead>
                      <TableHead className="text-[11px] uppercase text-muted-foreground">Symbol</TableHead>
                      <TableHead className="text-[11px] uppercase text-muted-foreground">Reason</TableHead>
                      <TableHead className="text-right text-[11px] uppercase text-muted-foreground">PnL</TableHead>
                      <TableHead className="text-right text-[11px] uppercase text-muted-foreground">Interest</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mergedTrades.map((t) => (
                      <TableRow key={`${t.closedAtMs}-${t.mint}-${t.reason}`} className="border-border/40">
                        <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                          {formatTs(t.closedAtMs)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {t.agentId === "universal" ? "Universal" : "Rise Alpha"}
                        </TableCell>
                        <TableCell className="font-medium">{t.symbol}</TableCell>
                        <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">{t.reason}</TableCell>
                        <TableCell
                          className={cn(
                            "text-right font-mono text-sm tabular-nums",
                            t.pnlSol >= 0 ? "text-emerald-200/90" : "text-red-200/90",
                          )}
                        >
                          {formatSol(t.pnlSol)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-amber-200/85">
                          {formatSol(t.interestPaidSol)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="mt-6 border-border/55 bg-card/45 backdrop-blur-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
              Fresh mint discoveries
            </CardTitle>
            <CardDescription>
              Chronological Pumpfun graduates plus $UPONLY when it updates — Universal reads all; Rise Alpha only the RISE mint.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Time</TableHead>
                    <TableHead className="text-[11px] uppercase text-muted-foreground">Symbol</TableHead>
                    <TableHead className="text-right text-[11px] uppercase text-muted-foreground">Market cap</TableHead>
                    <TableHead className="w-12 pr-4 text-right text-[11px] uppercase text-muted-foreground">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {persisted.discoveries.slice(0, 40).map((d) => (
                    <TableRow key={`${d.atMs}-${d.mint}`} className="border-border/40">
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{formatTs(d.atMs)}</TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="font-semibold tracking-tight">{d.symbol}</p>
                          <p className="truncate font-mono text-[11px] text-muted-foreground">{d.mint}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm tabular-nums">
                        {d.marketCapUsd != null ? formatCompactUsd(d.marketCapUsd) : "—"}
                      </TableCell>
                      <TableCell className="pr-4 text-right">
                        <a
                          href={
                            d.mint === RISE_ALPHA_TOKEN_MINT
                              ? buildRiseTradeUrl(d.mint) ?? `https://rise.rich/trade/${encodeURIComponent(d.mint)}`
                              : `https://pump.fun/coin/${encodeURIComponent(d.mint)}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/30 text-primary transition-colors hover:bg-background/60"
                          aria-label={
                            d.mint === RISE_ALPHA_TOKEN_MINT
                              ? `Trade ${d.symbol} on RISE`
                              : `Open ${d.symbol} on pump.fun`
                          }
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
