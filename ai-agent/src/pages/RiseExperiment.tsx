import { useMemo } from "react";
import { PremiumTablePagination } from "@/components/experiment/PremiumTablePagination";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  Activity,
  ArrowUpRight,
  Crosshair,
  Landmark,
  Loader2,
  RefreshCw,
  Sparkles,
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
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import { buildRiseTradeUrl } from "@/lib/riseToken";
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
    subtitle: "Enters every new listing on the live RISE markets tape.",
    badge: "All RISE listings",
  },
  riseAlpha: {
    title: "Rise Alpha sniper",
    subtitle: "Only trades RISE tokens that pass agent-ready or watch-tier gates (alpha score + liquidity).",
    badge: "Alpha-ready RISE",
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/75">Equity</p>
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

export default function RiseExperiment({ embedded = false }: { embedded?: boolean }) {
  const { persisted, intelQ, markets, ledgerReady } = useRiseExperimentRunner();

  const discoveryRows = useMemo(() => {
    if (persisted.discoveries.length > 0) {
      return persisted.discoveries;
    }
    if (markets.length === 0) return [];
    const nowMs = intelQ.data?.nowMs ?? Date.now();
    return [...markets]
      .sort((a, b) => {
        const aMs = a.createdAt ? Date.parse(a.createdAt) : 0;
        const bMs = b.createdAt ? Date.parse(b.createdAt) : 0;
        return bMs - aMs;
      })
      .map((m) => ({
        atMs: nowMs,
        mint: m.mint,
        symbol: m.symbol?.trim() || "—",
        marketCapUsd: m.marketCapUsd,
      }));
  }, [persisted.discoveries, markets, intelQ.data?.nowMs]);

  const mergedTrades = useMemo(() => {
    const all = [...persisted.agents.universal.closed, ...persisted.agents.riseAlpha.closed];
    all.sort((a, b) => b.closedAtMs - a.closedAtMs);
    return all;
  }, [persisted.agents.riseAlpha.closed, persisted.agents.universal.closed]);

  const discoveriesPagination = useTablePagination(discoveryRows, 10);
  const tradesPagination = useTablePagination(mergedTrades, 15);

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={cn(
          "bg-background text-foreground",
          embedded ? "w-full min-w-0" : "flex min-h-screen min-w-0 flex-col",
        )}
      >
        <main
          className={cn(
            DASHBOARD_CONTENT_SHELL,
            PAGE_PADDING_TOP_STANDARD,
            PAGE_SAFE_AREA_BOTTOM_COMPACT,
            "flex min-h-0 flex-col space-y-8",
            !embedded && "min-h-0 flex-1",
          )}
        >
        <div
          className={cn(
            "relative overflow-hidden rounded-3xl border border-border/55 bg-gradient-to-br from-sky-950/30 via-card/90 to-background shadow-[0_28px_90px_-52px_rgba(0,0,0,0.9)]",
            "px-5 py-6 sm:px-6 sm:py-7",
            !embedded && "mb-2 sm:py-8",
          )}
        >
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
                Rise trading desk
              </div>
              {embedded ? (
                <h2 className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Rise experiment</h2>
              ) : (
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Rise experiment</h1>
              )}
              <p className="max-w-2xl text-pretty text-[15px] leading-relaxed text-muted-foreground sm:text-base">
                Two isolated snipers on the live RISE tape — Universal enters every new RISE listing; Rise Alpha only
                allocates to agent-ready or watch-tier names. Each desk starts with {RISE_EXPERIMENT_START_SOL}&nbsp;SOL,
                deploys {RISE_EXPERIMENT_ENTRY_SOL}&nbsp;SOL per entry, and may draw up to {RISE_EXPERIMENT_MAX_BORROW_SOL}
                &nbsp;SOL from the Rise vault at {(RISE_EXPERIMENT_BORROW_APR * 100).toFixed(0)}% APR when cash is tight.
                Interest accrues continuously and is paid from exits before principal.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Badge variant="secondary" className="rounded-lg border border-border/50 bg-background/40 font-medium">
                  <Sparkles className="mr-1.5 h-3 w-3 opacity-80" aria-hidden />
                  RISE markets tape
                </Badge>
                <Badge variant="secondary" className="rounded-lg border border-border/50 bg-background/40 font-medium">
                  <Landmark className="mr-1.5 h-3 w-3 opacity-80" aria-hidden />
                  Borrow + interest ledger
                </Badge>
                <Badge variant="outline" className="rounded-lg border-emerald-500/25 text-emerald-200/90">
                  Live execution
                </Badge>
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
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
                <p className="text-[11px] text-muted-foreground/80">Rise vault depth (USD)</p>
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
                <p className="text-[11px] text-muted-foreground/80">Variable borrow</p>
              </CardContent>
            </Card>
            <Card className="border-border/55 bg-card/60">
              <CardContent className="space-y-1 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">$UPONLY MC</p>
                <p className="font-mono text-xl font-semibold tabular-nums">
                  {formatCompactUsd(intelQ.data.token.marketCapUsd)}
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  RISE tape: {intelQ.data.marketCount} markets · {formatTs(intelQ.data.nowMs)}
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
                  {tradesPagination.totalItems.toLocaleString()} rows
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                Exits route proceeds through Rise settlement: pay accrued interest first, knock down borrow principal, then
                credit remaining SOL to the desk wallet.
              </TooltipContent>
            </Tooltip>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[min(420px,48vh)] px-5 pr-3">
              {mergedTrades.length === 0 ? (
                <p className="py-10 text-sm text-muted-foreground">
                  No closed trades yet — feed needs fresh mints after bootstrap.
                </p>
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
                    {tradesPagination.slice.map((t) => (
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
            <PremiumTablePagination
              page={tradesPagination.page}
              pageSize={tradesPagination.pageSize}
              totalItems={tradesPagination.totalItems}
              onPageChange={tradesPagination.setPage}
              onPageSizeChange={tradesPagination.setPageSize}
              pageSizeOptions={[10, 15, 25, 50]}
              loading={intelQ.isFetching}
              itemLabel="trades"
              className="rounded-b-xl"
            />
          </CardContent>
        </Card>

        <Card className="mt-6 border-border/55 bg-card/45 backdrop-blur-md">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-4 w-4 text-primary" aria-hidden />
                Fresh mint discoveries
              </CardTitle>
              <CardDescription>
                Chronological RISE listings — Universal reads all; Rise Alpha only agent-ready or watch-tier mints.
              </CardDescription>
            </div>
            <Badge variant="outline" className="rounded-lg border-border/60 font-mono text-[11px]">
              {discoveriesPagination.totalItems.toLocaleString()} listings
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto px-5">
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
                  {discoveryRows.length === 0 ? (
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableCell colSpan={4} className="py-10 text-center text-sm text-muted-foreground">
                        {!ledgerReady || intelQ.isLoading
                          ? "Loading RISE markets tape…"
                          : intelQ.isError
                            ? "RISE markets feed unavailable — use Refresh after the API is reachable."
                            : "No RISE listings on the tape yet."}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {discoveriesPagination.slice.map((d) => (
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
                          href={buildRiseTradeUrl(d.mint) ?? `https://rise.rich/trade/${encodeURIComponent(d.mint)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/30 text-primary transition-colors hover:bg-background/60"
                          aria-label={`Trade ${d.symbol} on RISE`}
                        >
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <PremiumTablePagination
              page={discoveriesPagination.page}
              pageSize={discoveriesPagination.pageSize}
              totalItems={discoveriesPagination.totalItems}
              onPageChange={discoveriesPagination.setPage}
              onPageSizeChange={discoveriesPagination.setPageSize}
              pageSizeOptions={[10, 20, 50]}
              loading={intelQ.isFetching || !ledgerReady}
              itemLabel="listings"
              className="rounded-b-xl"
            />
          </CardContent>
        </Card>
      </main>
      </div>
    </TooltipProvider>
  );
}
