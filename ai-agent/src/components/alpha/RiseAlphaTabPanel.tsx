import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Bot,
  Landmark,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Trophy,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { fetchRiseAlphaMarketsBundle } from "@/lib/riseMarketsApi";
import {
  countAgentReady,
  enrichRiseMarket,
  rankEnrichedByAlpha,
  type RankedRiseMarket,
} from "@/lib/riseIntelligence";
import { buildRiseTradeUrl, buildSolscanTokenUrl, shortenMint } from "@/lib/riseToken";
import {
  AgentTierBadge,
  AlphaScoreCell,
  ChangePill,
  NarrativeTagsCell,
  RiskFlagsCell,
} from "@/components/alpha/RiseAlphaColumns";

const STALE_MS = 180_000;
const LIST_SIZE = 50;

type SortKey = "alpha" | "volume24hUsd" | "marketCapUsd" | "priceChange24hPct";
type FilterPreset = "all" | "agentReady" | "verified";

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
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/75">{label}</p>
        <p className="mt-2 font-mono text-xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
        {hint ? <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/80">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function TokenAvatar({ imageUrl, symbol }: { imageUrl: string | null; symbol: string }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="h-8 w-8 shrink-0 rounded-lg border border-border/50 object-cover"
      />
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/30 font-mono text-[10px] font-bold text-foreground">
      {(symbol || "?").slice(0, 2).toUpperCase()}
    </div>
  );
}

export function RiseAlphaTabPanel() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [preset, setPreset] = useState<FilterPreset>("all");
  const [sortKey, setSortKey] = useState<SortKey>("alpha");

  const batchQ = useQuery({
    queryKey: ["alpha", "rise-markets"],
    queryFn: () => fetchRiseAlphaMarketsBundle(),
    staleTime: STALE_MS,
  });

  const enriched = useMemo(
    () => (batchQ.data?.markets ?? []).map((m) => enrichRiseMarket(m)),
    [batchQ.data?.markets],
  );

  const filtered = useMemo(() => {
    return enriched.filter((row) => {
      const m = row.market;
      if (deferredSearch) {
        const hay = `${m.symbol} ${m.name} ${m.mint}`.toLowerCase();
        if (!hay.includes(deferredSearch)) return false;
      }
      if (preset === "agentReady" && row.agentTier !== "ready") return false;
      if (preset === "verified" && !m.isVerified) return false;
      return true;
    });
  }, [deferredSearch, enriched, preset]);

  const sorted = useMemo(() => {
    if (sortKey === "alpha") return rankEnrichedByAlpha(filtered).slice(0, LIST_SIZE);
    const next = [...filtered];
    next.sort((a, b) => {
      const av = a.market[sortKey] ?? 0;
      const bv = b.market[sortKey] ?? 0;
      return (bv as number) - (av as number);
    });
    return next.slice(0, LIST_SIZE);
  }, [filtered, sortKey]);

  const agentReadyCount = useMemo(() => countAgentReady(enriched), [enriched]);
  const aggregate = batchQ.data?.aggregate;
  const kpi = aggregate?.terminalKpiTrend?.today;
  const alphaPicks =
    kpi?.alphaPicks ??
    enriched.filter((r) => r.alpha.score >= 70).length;

  return (
    <div className="space-y-8 pb-10 sm:pb-12 lg:pb-14">
      <Card className="relative overflow-hidden rounded-3xl border border-border/55 bg-gradient-to-br from-sky-950/25 via-card/90 to-muted/[0.05] shadow-[0_24px_70px_-46px_rgba(0,0,0,0.85)] backdrop-blur-xl">
        <CardContent className="relative space-y-5 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/55 bg-background/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <Landmark className="h-3.5 w-3.5 text-sky-300" aria-hidden />
                RISE ecosystem
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">RISE Alpha screener</h2>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground/90">
                Full RISE token universe ranked like the Up Only fund terminal — plus agent trade tiers (ready / watch /
                avoid) for execution sizing. Same Syra API proxies as uponly.fund.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <p className="text-xs text-muted-foreground/75">
                  Updated {batchQ.data?.fetchedAtMs ? formatTs(batchQ.data.fetchedAtMs) : "—"}
                  {aggregate?.degraded ? " · partial upstream" : ""}
                </p>
                <Button variant="secondary" size="sm" className="h-8 rounded-lg px-3 text-xs font-semibold" asChild>
                  <Link to="/rise-experiment">Rise experiment</Link>
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 shrink-0 gap-2 rounded-xl border-border/70 px-3 font-semibold"
              onClick={() => void batchQ.refetch()}
              disabled={batchQ.isFetching}
            >
              {batchQ.isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {batchQ.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[118px] rounded-2xl" />
          ))}
        </div>
      ) : aggregate ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiTile
            label="RISE markets"
            value={String(aggregate.ecosystem.marketCount)}
            hint={`${aggregate.ecosystem.verifiedCount} verified · sampled ${aggregate.ecosystem.sampledCount}`}
            className="ring-1 ring-sky-500/10"
          />
          <KpiTile
            label="Agent-ready"
            value={String(agentReadyCount)}
            hint="Verified, ≥$6k 24h vol, alpha ≥ 55, ≤1 soft flag"
          />
          <KpiTile label="Alpha picks (≥70)" value={String(alphaPicks)} hint="High composite score today" />
          <KpiTile
            label="Ecosystem 24h vol"
            value={formatCompactUsd(aggregate.ecosystem.totalVolume24hUsd)}
            hint={formatCompactUsd(aggregate.ecosystem.totalMarketCapUsd) + " total mcap"}
          />
        </div>
      ) : null}

      {batchQ.isError ? (
        <Card className="border-destructive/25 bg-destructive/[0.03]">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm font-medium text-foreground">Unable to load RISE markets</p>
            <p className="text-sm text-muted-foreground">{(batchQ.error as Error)?.message || "Request failed."}</p>
            <Button type="button" variant="secondary" size="sm" className="rounded-xl" onClick={() => void batchQ.refetch()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {!batchQ.isLoading && enriched.length > 0 ? (
        <>
          <Card className="border-border/55 bg-card/55 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="h-4 w-4 text-primary" aria-hidden />
                Top alpha · agent lens
              </CardTitle>
              <CardDescription>
                Default sort: agent-ready first, then composite alpha (momentum, flow, depth, freshness). Same scoring
                engine as Up Only terminal.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-md flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search symbol, name, mint…"
                    className="h-10 rounded-xl border-border/60 bg-background/40 pl-9"
                  />
                  {search ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      ["all", "All", null],
                      ["agentReady", "Agent ready", Bot],
                      ["verified", "Verified", ShieldCheck],
                    ] as const
                  ).map(([id, label, Icon]) => (
                    <Button
                      key={id}
                      type="button"
                      size="sm"
                      variant={preset === id ? "secondary" : "outline"}
                      className="h-9 rounded-xl gap-1.5"
                      onClick={() => setPreset(id)}
                    >
                      {Icon ? <Icon className="h-3.5 w-3.5 opacity-80" /> : null}
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["alpha", "Alpha"],
                    ["volume24hUsd", "Volume"],
                    ["marketCapUsd", "Mcap"],
                    ["priceChange24hPct", "24h %"],
                  ] as const
                ).map(([key, label]) => (
                  <Button
                    key={key}
                    type="button"
                    size="sm"
                    variant={sortKey === key ? "secondary" : "ghost"}
                    className="h-8 rounded-lg text-xs"
                    onClick={() => setSortKey(key)}
                  >
                    {label}
                  </Button>
                ))}
                <Badge variant="outline" className="ml-auto font-mono text-[11px] tabular-nums">
                  {sorted.length} / {filtered.length} shown
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border/45">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="w-10 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        #
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Token
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Agent
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Alpha
                      </TableHead>
                      <TableHead className="hidden text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:table-cell">
                        Mcap
                      </TableHead>
                      <TableHead className="hidden text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:table-cell">
                        Vol 24h
                      </TableHead>
                      <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        24h
                      </TableHead>
                      <TableHead className="hidden text-[11px] font-semibold uppercase tracking-wide text-muted-foreground xl:table-cell">
                        Risk
                      </TableHead>
                      <TableHead className="hidden text-[11px] font-semibold uppercase tracking-wide text-muted-foreground xl:table-cell">
                        Tags
                      </TableHead>
                      <TableHead className="w-14 pr-4" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="py-12 text-center text-sm text-muted-foreground">
                          No tokens match this filter.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sorted.map((row, idx) => (
                        <RiseAlphaTableRow key={row.market.mint} row={row} rank={idx + 1} />
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : !batchQ.isLoading && !batchQ.isError ? (
        <Card className="border-border/55 bg-card/55">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <Landmark className="h-8 w-8 text-muted-foreground/70" aria-hidden />
            <p className="text-sm font-medium text-foreground">No RISE markets returned</p>
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => void batchQ.refetch()}>
              Refresh
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function RiseAlphaTableRow({ row, rank }: { row: RankedRiseMarket; rank: number }) {
  const m = row.market;
  const tradeUrl = buildRiseTradeUrl(m.mint);

  return (
    <TableRow className="group border-border/40 transition-colors hover:bg-muted/20">
      <TableCell className="font-mono text-xs text-muted-foreground">{rank}</TableCell>
      <TableCell>
        <div className="flex min-w-0 items-center gap-2.5">
          <TokenAvatar imageUrl={m.imageUrl} symbol={m.symbol} />
          <div className="min-w-0">
            <p className="truncate font-semibold tracking-tight text-foreground">
              ${m.symbol || "—"}
              {m.isVerified ? (
                <span className="ml-1.5 text-[10px] font-normal text-emerald-400">✓</span>
              ) : null}
            </p>
            <p className="truncate text-xs text-muted-foreground">{m.name}</p>
            <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground/70">{shortenMint(m.mint, 6, 4)}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <AgentTierBadge tier={row.agentTier} />
          <p className="max-w-[11rem] text-[10px] leading-snug text-muted-foreground/85">{row.agentNote}</p>
        </div>
      </TableCell>
      <TableCell>
        <AlphaScoreCell alpha={row.alpha} compact />
      </TableCell>
      <TableCell className="hidden text-right font-mono text-sm tabular-nums text-foreground md:table-cell">
        {formatCompactUsd(m.marketCapUsd)}
      </TableCell>
      <TableCell className="hidden text-right font-mono text-sm tabular-nums text-muted-foreground lg:table-cell">
        {formatCompactUsd(m.volume24hUsd)}
      </TableCell>
      <TableCell className="text-right">
        <ChangePill pct={m.priceChange24hPct} />
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        <RiskFlagsCell flags={row.riskFlags} />
      </TableCell>
      <TableCell className="hidden xl:table-cell">
        <NarrativeTagsCell tags={row.narratives} />
      </TableCell>
      <TableCell className="pr-4 text-right">
        <div className="flex justify-end gap-1">
          {tradeUrl ? (
            <a
              href={tradeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/30 text-primary transition-colors hover:bg-background/60"
              aria-label={`Trade ${m.symbol} on RISE`}
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          ) : null}
          <a
            href={buildSolscanTokenUrl(m.mint)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/30 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
            aria-label="Solscan"
          >
            <span className="font-mono text-[9px] font-bold">SOL</span>
          </a>
        </div>
      </TableCell>
    </TableRow>
  );
}
