import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Layers3, ShieldCheck, Sparkles, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import {
  ChangePill,
  EmptyState,
  GlassCard,
  RiseTradeButton,
  TokenAvatar,
  formatPriceSmart,
} from "@/components/rise/RiseShared";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import { cn } from "@/lib/utils";

type SortBy = "backing" | "delta";

const PAGE_SIZE = 10;

function rankAccent(rank: number): string {
  if (rank === 1) return "border-l-amber-400/90 shadow-[inset_4px_0_0_0_rgba(251,191,36,0.55)]";
  if (rank === 2) return "border-l-slate-300/80 shadow-[inset_4px_0_0_0_rgba(148,163,184,0.45)]";
  if (rank === 3) return "border-l-orange-400/75 shadow-[inset_4px_0_0_0_rgba(251,146,60,0.45)]";
  return "border-l-transparent";
}

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  gradientClass,
  ringClass,
}: {
  icon: typeof Layers3;
  label: string;
  value: string;
  hint: string;
  gradientClass: string;
  ringClass: string;
}) {
  return (
    <div
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br p-5 shadow-[0_1px_0_0_hsl(0_0%_100%/0.06)_inset,0_20px_50px_-24px_hsl(0_0%_0%/0.5)] transition-[transform,box-shadow,border-color] duration-300",
        "from-card/90 via-card/50 to-card/30 hover:-translate-y-0.5 hover:border-border/70 hover:shadow-[0_1px_0_0_hsl(0_0%_100%/0.08)_inset,0_24px_60px_-20px_hsl(0_0%_0%/0.45)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.12] blur-2xl transition-opacity duration-500 group-hover:opacity-25",
          gradientClass,
        )}
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-inner",
            gradientClass,
            ringClass,
          )}
        >
          <Icon className="h-5 w-5 text-foreground/90" strokeWidth={1.75} aria-hidden />
        </div>
      </div>
      <p className="relative mt-4 text-[0.65rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="relative mt-1.5 font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-foreground sm:text-[1.65rem]">
        {value}
      </p>
      <p className="relative mt-2 text-[0.78rem] leading-relaxed text-muted-foreground sm:text-xs">{hint}</p>
    </div>
  );
}

export default function FloorScannerPage() {
  const [sortBy, setSortBy] = useState<SortBy>("backing");
  const [page, setPage] = useState(1);
  const markets = useRiseMarketsAll();

  const rows = useMemo(() => {
    const filtered = (markets.data ?? []).filter(
      (row) => (row.floorPriceUsd ?? 0) > 0 && (row.marketCapUsd ?? 0) > 0,
    );
    return filtered
      .map((row) => ({
        row,
        backing: ((row.floorMarketCapUsd ?? 0) / (row.marketCapUsd ?? 1)) * 100,
      }))
      .sort((a, b) => {
        if (sortBy === "delta") return (b.row.floorDeltaPct ?? -999) - (a.row.floorDeltaPct ?? -999);
        return b.backing - a.backing;
      });
  }, [markets.data, sortBy]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const pageRows = useMemo(
    () => rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [rows, page],
  );

  const stats = useMemo(() => {
    const universe = markets.data ?? [];
    const floorEligible = universe.filter((row) => (row.floorPriceUsd ?? 0) > 0 && (row.marketCapUsd ?? 0) > 0);
    const strongBacking = floorEligible.filter(
      (row) => ((row.floorMarketCapUsd ?? 0) / Math.max(row.marketCapUsd ?? 1, 1)) * 100 >= 35,
    );
    const avgFloorDelta =
      floorEligible.length > 0
        ? floorEligible.reduce((acc, row) => acc + (row.floorDeltaPct ?? 0), 0) / floorEligible.length
        : 0;
    return {
      floorEligible: floorEligible.length,
      strongBacking: strongBacking.length,
      avgFloorDelta,
    };
  }, [markets.data]);

  const liveBanner =
    markets.isPending || markets.isError ? null : (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-1 text-[0.65rem] font-medium text-emerald-300/95">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60 opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Live universe · {formatInt(rows.length)} ranked
      </span>
    );

  return (
    <div className="relative flex flex-col gap-8">
      <div
        className="pointer-events-none absolute inset-x-0 -top-32 z-0 h-[28rem] bg-[radial-gradient(ellipse_70%_55%_at_50%_-10%,hsl(var(--uof)_/_0.14),transparent_55%),radial-gradient(ellipse_50%_40%_at_90%_20%,hsl(200_80%_50%/0.07),transparent_50%),radial-gradient(ellipse_45%_35%_at_10%_30%,hsl(280_65%_55%/0.06),transparent_50%)]"
        aria-hidden
      />

      <div className="relative z-[1] flex flex-col gap-8">
        <DashboardPageHeader
          eyebrow="Floor intelligence"
          title="Floor scanner"
          description="Surface markets where on-chain floor liquidity meaningfully backs circulating float—prioritized by structural backing and floor momentum."
          right={<div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">{liveBanner}</div>}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard
            icon={Layers3}
            label="Floor universe"
            value={formatInt(stats.floorEligible)}
            hint="Tokens with concurrent floor price and market-cap inputs."
            gradientClass="from-sky-500/25 to-cyan-600/10"
            ringClass="ring-sky-400/25"
          />
          <KpiCard
            icon={ShieldCheck}
            label="Strong backing"
            value={formatInt(stats.strongBacking)}
            hint="Floor market cap ≥ 35% of spot float—high structural support."
            gradientClass="from-emerald-500/25 to-teal-700/10"
            ringClass="ring-emerald-400/25"
          />
          <KpiCard
            icon={Waves}
            label="Avg floor delta"
            value={`${stats.avgFloorDelta.toFixed(2)}%`}
            hint="Mean floor-vs-spot momentum across the eligible set."
            gradientClass="from-violet-500/22 to-fuchsia-700/10"
            ringClass="ring-violet-400/22"
          />
        </div>

        <GlassCard padded={false} className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]">
          <div className="border-b border-border/45 bg-gradient-to-b from-card/50 to-transparent px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5 text-foreground/50" aria-hidden />
                  Scanner feed
                </p>
                <h2 className="mt-1.5 text-balance text-lg font-semibold tracking-[-0.02em] text-foreground sm:text-xl">
                  Ranked floor book
                </h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  {sortBy === "backing"
                    ? "Sorted by floor backing—how much of spot MC is implied by the floor book."
                    : "Sorted by floor delta—short-term floor momentum vs spot."}
                </p>
              </div>
              <ToggleGroup
                type="single"
                value={sortBy}
                onValueChange={(v) => {
                  if (v === "backing" || v === "delta") {
                    setSortBy(v);
                    setPage(1);
                  }
                }}
                className="inline-flex shrink-0 rounded-xl border border-border/55 bg-muted/25 p-1 shadow-inner"
                aria-label="Sort scanner by"
              >
                <ToggleGroupItem
                  value="backing"
                  className="rounded-lg px-4 py-2 text-xs font-medium data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm sm:px-5"
                >
                  Floor backing
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="delta"
                  className="rounded-lg px-4 py-2 text-xs font-medium data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm sm:px-5"
                >
                  Floor delta
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {markets.isPending ? (
            <div className="space-y-0 divide-y divide-border/35">
              {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-4 px-4 py-3.5 sm:px-6">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-full sm:ml-auto sm:max-w-[12rem]" />
                  </div>
                </div>
              ))}
            </div>
          ) : markets.isError ? (
            <div className="p-6 sm:p-8">
              <EmptyState
                title="Could not load floor scanner"
                description={(markets.error as Error)?.message || "Please retry in a few seconds."}
                action={
                  <Button size="sm" variant="secondary" onClick={() => markets.refetch()}>
                    Retry scanner
                  </Button>
                }
              />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6 sm:p-8">
              <EmptyState title="No floor-backed markets found" description="Try again after refresh." />
            </div>
          ) : (
            <>
              {/* Desktop */}
              <div className="hidden md:block">
                <Table className="text-[0.8125rem] tabular-nums">
                  <TableHeader>
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="h-11 w-12 px-4 text-left text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        #
                      </TableHead>
                      <TableHead className="h-11 min-w-[10rem] px-2 text-left text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Asset
                      </TableHead>
                      <TableHead className="h-11 px-3 text-right text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Spot
                      </TableHead>
                      <TableHead className="h-11 px-3 text-right text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Floor
                      </TableHead>
                      <TableHead className="h-11 px-3 text-right text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Backing
                      </TableHead>
                      <TableHead className="h-11 px-3 text-right text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Floor MC
                      </TableHead>
                      <TableHead className="h-11 px-3 text-right text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Floor Δ
                      </TableHead>
                      <TableHead className="h-11 w-[1%] px-4 text-right text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                        Action
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map(({ row, backing }, index) => {
                      const rank = (page - 1) * PAGE_SIZE + index + 1;
                      return (
                        <TableRow
                          key={row.mint}
                          className={cn(
                            "group border-border/35 transition-colors hover:bg-muted/[0.35]",
                            rankAccent(rank),
                            "border-l-4",
                          )}
                        >
                          <TableCell className="px-4 py-3.5 align-middle text-muted-foreground">
                            <span className="inline-flex min-w-[1.75rem] justify-center rounded-md bg-background/50 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-foreground/90">
                              {rank}
                            </span>
                          </TableCell>
                          <TableCell className="px-2 py-3.5 align-middle">
                            <div className="flex min-w-0 items-center gap-3">
                              <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="sm" />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-foreground">${row.symbol}</p>
                                <p className="truncate text-[0.7rem] text-muted-foreground">{row.name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-3 py-3.5 text-right font-medium text-foreground">
                            {formatPriceSmart(row.priceUsd)}
                          </TableCell>
                          <TableCell className="px-3 py-3.5 text-right font-medium text-foreground">
                            {formatPriceSmart(row.floorPriceUsd)}
                          </TableCell>
                          <TableCell className="px-3 py-3.5 text-right font-medium text-foreground">
                            {backing.toFixed(1)}%
                          </TableCell>
                          <TableCell className="px-3 py-3.5 text-right text-foreground/95">
                            {formatUsd(row.floorMarketCapUsd, { compact: true })}
                          </TableCell>
                          <TableCell className="px-3 py-3.5 text-right">
                            <ChangePill pct={row.floorDeltaPct ?? null} />
                          </TableCell>
                          <TableCell className="px-4 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <RiseTradeButton mint={row.mint} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile */}
              <div className="flex flex-col gap-3 p-4 md:hidden">
                {pageRows.map(({ row, backing }, index) => {
                  const rank = (page - 1) * PAGE_SIZE + index + 1;
                  return (
                    <div
                      key={row.mint}
                      className={cn(
                        "overflow-hidden rounded-2xl border border-border/45 bg-gradient-to-b from-card/50 to-card/[0.15] p-4 shadow-sm transition-all duration-200 hover:border-border/65 hover:shadow-md",
                        rankAccent(rank),
                        "border-l-4",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <span className="inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg border border-border/50 bg-background/50 text-xs font-bold tabular-nums text-foreground">
                            {rank}
                          </span>
                          <TokenAvatar imageUrl={row.imageUrl} symbol={row.symbol} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">${row.symbol}</p>
                            <p className="truncate text-xs text-muted-foreground">{row.name}</p>
                          </div>
                        </div>
                        <RiseTradeButton mint={row.mint} />
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                        <div className="rounded-xl border border-border/40 bg-background/35 px-3 py-2.5">
                          <p className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">Spot</p>
                          <p className="mt-1 font-semibold tabular-nums text-foreground">{formatPriceSmart(row.priceUsd)}</p>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-background/35 px-3 py-2.5">
                          <p className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">Floor</p>
                          <p className="mt-1 font-semibold tabular-nums text-foreground">{formatPriceSmart(row.floorPriceUsd)}</p>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-background/35 px-3 py-2.5">
                          <p className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">Backing</p>
                          <p className="mt-1 font-semibold tabular-nums text-foreground">{backing.toFixed(1)}%</p>
                        </div>
                        <div className="rounded-xl border border-border/40 bg-background/35 px-3 py-2.5">
                          <p className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">Floor MC</p>
                          <p className="mt-1 font-semibold tabular-nums text-foreground">
                            {formatUsd(row.floorMarketCapUsd, { compact: true })}
                          </p>
                        </div>
                        <div className="col-span-2 rounded-xl border border-border/40 bg-background/35 px-3 py-2.5 sm:col-span-1">
                          <p className="text-[0.6rem] font-medium uppercase tracking-[0.1em] text-muted-foreground">Floor Δ</p>
                          <div className="mt-1.5">
                            <ChangePill pct={row.floorDeltaPct ?? null} />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col gap-3 border-t border-border/45 bg-muted/[0.15] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-[0.7rem] text-muted-foreground sm:text-xs">
                  <span className="font-medium text-foreground/90">
                    Page {page} of {totalPages}
                  </span>
                  <span className="text-muted-foreground/85">
                    {" "}
                    · Rows {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, rows.length)} of {rows.length}
                  </span>
                </p>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-9 gap-1 rounded-lg px-3 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Previous
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-9 gap-1 rounded-lg px-3 text-xs"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
