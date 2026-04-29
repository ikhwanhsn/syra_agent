/**
 * The screener — the dense, sortable, filterable table of every RISE market.
 *
 * - Server pagination via /uponly-rise-markets?page&limit
 * - Client-side filter (search, verified, has-floor, level chips) over current page
 * - Click row → opens MarketDetailDrawer (controlled from parent)
 * - Mobile collapses to card list
 */
import { type ReactNode, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  Globe2,
  Layers,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRiseMarkets } from "@/lib/RiseDashboardContext";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { cn } from "@/lib/utils";
import {
  ChangePill,
  EmptyState,
  GlassCard,
  LevelChip,
  RiseTradeButton,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
  formatRelativeAge,
  shortenMint,
} from "./RiseShared";

const PAGE_SIZE = 10;

type SortKey =
  | "marketCapUsd"
  | "volume24hUsd"
  | "priceUsd"
  | "priceChange24hPct"
  | "floorPriceUsd"
  | "floorMarketCapUsd"
  | "floorDeltaPct"
  | "holders"
  | "creatorFeePct"
  | "lockedSupplyPct"
  | "ageHours";

type SortDir = "asc" | "desc";

const SORT_LABEL: Record<SortKey, string> = {
  marketCapUsd: "Market cap",
  volume24hUsd: "24h volume",
  priceUsd: "Price",
  priceChange24hPct: "24h Δ",
  floorPriceUsd: "Floor",
  floorMarketCapUsd: "Floor MC",
  floorDeltaPct: "Floor Δ",
  holders: "Holders",
  creatorFeePct: "Fee",
  lockedSupplyPct: "Locked",
  ageHours: "Age",
};

function sortRows(rows: RiseMarketRow[], key: SortKey, dir: SortDir): RiseMarketRow[] {
  const factor = dir === "asc" ? 1 : -1;
  const out = [...rows];
  out.sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    const aNum = typeof av === "number" && Number.isFinite(av) ? av : null;
    const bNum = typeof bv === "number" && Number.isFinite(bv) ? bv : null;
    if (aNum === null && bNum === null) return 0;
    if (aNum === null) return 1;
    if (bNum === null) return -1;
    return (aNum - bNum) * factor;
  });
  return out;
}

function applyFilters(
  rows: RiseMarketRow[],
  q: string,
  selectedLevels: Set<number>,
): RiseMarketRow[] {
  const needle = q.trim().toLowerCase();
  return rows.filter((r) => {
    if (selectedLevels.size > 0) {
      const lvl = r.level !== null && Number.isFinite(r.level) ? Math.round(r.level) : null;
      if (lvl === null || !selectedLevels.has(lvl)) return false;
    }
    if (!needle) return true;
    return (
      r.symbol.toLowerCase().includes(needle) ||
      r.name.toLowerCase().includes(needle) ||
      r.mint.toLowerCase().includes(needle)
    );
  });
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
  align = "right",
  className,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "-mx-1 inline-flex w-full items-center gap-1 rounded-lg px-1.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.08em] transition-colors sm:text-[0.7rem]",
        align === "right" ? "justify-end" : "justify-start",
        active
          ? "bg-foreground/[0.07] text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        className,
      )}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span>{label}</span>
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="h-3 w-3 shrink-0 text-uof" aria-hidden />
        ) : (
          <ArrowDown className="h-3 w-3 shrink-0 text-uof" aria-hidden />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 shrink-0 opacity-45" aria-hidden />
      )}
    </button>
  );
}

function ScreenerStatCard({
  icon: Icon,
  label,
  value,
  hint,
  gradientClass,
  ringClass,
}: {
  icon: typeof Globe2;
  label: string;
  value: ReactNode;
  hint: string;
  gradientClass: string;
  ringClass: string;
}) {
  return (
    <div
      className={cn(
        "group relative min-w-0 overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br p-[1.125rem] shadow-[0_1px_0_0_hsl(0_0%_100%/0.05)_inset,0_18px_44px_-22px_hsl(0_0%_0%/0.45)] transition-[transform,box-shadow] duration-300",
        "from-card/90 via-card/45 to-card/25 hover:-translate-y-px hover:border-border/65 hover:shadow-[0_22px_50px_-20px_hsl(0_0%_0%/0.4)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.14] blur-2xl transition-opacity group-hover:opacity-25",
          gradientClass,
        )}
        aria-hidden
      />
      <div
        className={cn(
          "relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br shadow-inner",
          gradientClass,
          ringClass,
        )}
      >
        <Icon className="h-[1.15rem] w-[1.15rem] text-foreground/90" strokeWidth={1.85} aria-hidden />
      </div>
      <p className="relative mt-3 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="relative mt-1 font-display text-xl font-semibold tabular-nums tracking-[-0.02em] text-foreground sm:text-[1.35rem]">
        {value}
      </p>
      <p className="relative mt-1.5 text-[0.76rem] leading-snug text-muted-foreground sm:text-xs">{hint}</p>
    </div>
  );
}

const LEVEL_CHIPS = [0, 1, 2, 3, 4] as const;

export function MarketScreener({ onSelect }: { onSelect: (m: RiseMarketRow) => void }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasFloorOnly, setHasFloorOnly] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("marketCapUsd");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const deferredSearch = useDeferredValue(search);
  const { data, isPending, isFetching, isError, error, refetch } = useRiseMarkets({
    page,
    limit: PAGE_SIZE,
    verified: verifiedOnly,
    hasFloor: hasFloorOnly,
  });

  useEffect(() => {
    setPage(1);
  }, [verifiedOnly, hasFloorOnly]);

  const totalPages = data?.totalPages ?? null;
  const total = data?.total ?? null;
  const rows = useMemo(() => data?.markets ?? [], [data]);

  const filtered = useMemo(
    () => applyFilters(rows, deferredSearch, selectedLevels),
    [rows, deferredSearch, selectedLevels],
  );
  const sorted = useMemo(() => sortRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleLevel = (lvl: number) => {
    setSelectedLevels((prev) => {
      const next = new Set(prev);
      if (next.has(lvl)) next.delete(lvl);
      else next.add(lvl);
      return next;
    });
  };

  const resetFilters = () => {
    setSearch("");
    setVerifiedOnly(false);
    setHasFloorOnly(false);
    setSelectedLevels(new Set());
  };

  const hasActiveFilters =
    search.trim().length > 0 || verifiedOnly || hasFloorOnly || selectedLevels.size > 0;

  const liveBanner =
    !isPending && !isError && data ? (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/[0.07] px-3 py-1 text-[0.65rem] font-medium text-emerald-300/95">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/55 opacity-35" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        Feed synced · page {data.page}
        {totalPages != null ? ` / ${formatInt(totalPages)}` : ""}
      </span>
    ) : null;

  return (
    <section aria-labelledby="rise-screener-heading" className="flex flex-col gap-5">
      <h2 id="rise-screener-heading" className="sr-only">
        RISE market screener
      </h2>

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {isPending && !data ? (
          <>
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl border border-border/45 bg-card/30 p-[1.125rem]">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="mt-3 h-3 w-24" />
                <Skeleton className="mt-2 h-8 w-20" />
                <Skeleton className="mt-2 h-3 w-full max-w-[12rem]" />
              </div>
            ))}
          </>
        ) : (
          <>
            <ScreenerStatCard
              icon={Globe2}
              label="Listed universe"
              value={total != null ? formatInt(total) : "—"}
              hint="Total markets matching your server filters (verified / floor)."
              gradientClass="from-sky-500/28 to-cyan-700/12"
              ringClass="ring-sky-400/22"
            />
            <ScreenerStatCard
              icon={Layers}
              label="This page"
              value={data ? formatInt(data.count) : "—"}
              hint={`${PAGE_SIZE} rows per request · sort applies after fetch.`}
              gradientClass="from-emerald-500/25 to-teal-800/12"
              ringClass="ring-emerald-400/22"
            />
            <ScreenerStatCard
              icon={RefreshCw}
              label="Local view"
              value={
                hasActiveFilters ? (
                  <span className="text-[1.15rem] sm:text-[1.35rem]">
                    {formatInt(sorted.length)}
                    <span className="ml-1 text-base font-medium text-muted-foreground">match</span>
                  </span>
                ) : (
                  <span className="text-[1.15rem] sm:text-[1.35rem]">All rows</span>
                )
              }
              hint={
                hasActiveFilters
                  ? "Search & level chips filter the current page client-side."
                  : "Add search or level chips to narrow this page."
              }
              gradientClass="from-violet-500/24 to-fuchsia-800/12"
              ringClass="ring-violet-400/20"
            />
          </>
        )}
      </div>

      <GlassCard
        padded={false}
        className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]"
      >
        {/* Toolbar */}
        <div className="border-b border-border/45 bg-gradient-to-b from-card/55 to-transparent px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
                Full-depth book
              </p>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Server-side scope via switches; client-side refine via search and level chips. Click any row for the detail
                drawer.
              </p>
            </div>
            {liveBanner ? <div className="flex shrink-0 justify-start lg:justify-end">{liveBanner}</div> : null}
          </div>

          <div className="mt-5 flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/90"
                  aria-hidden
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search symbol, name, or mint…"
                  className="h-11 rounded-xl border-border/55 bg-background/40 pl-10 pr-10 shadow-inner placeholder:text-muted-foreground/75"
                  aria-label="Search markets"
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/40 bg-muted/[0.12] px-3 py-2.5 lg:shrink-0">
                <div className="flex items-center gap-2">
                  <Switch id="verified-only" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                  <Label htmlFor="verified-only" className="cursor-pointer text-xs font-medium text-foreground/90">
                    Verified only
                  </Label>
                </div>
                <div className="hidden h-4 w-px bg-border/55 sm:block" aria-hidden />
                <div className="flex items-center gap-2">
                  <Switch id="has-floor" checked={hasFloorOnly} onCheckedChange={setHasFloorOnly} />
                  <Label htmlFor="has-floor" className="cursor-pointer text-xs font-medium text-foreground/90">
                    Has floor
                  </Label>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/40 bg-background/[0.2] px-3 py-2.5">
              <span className="inline-flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Filter className="h-3.5 w-3.5" aria-hidden />
                Levels
              </span>
              <div className="flex flex-wrap gap-1.5">
                {LEVEL_CHIPS.map((lvl) => {
                  const active = selectedLevels.has(lvl);
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => toggleLevel(lvl)}
                      className={cn(
                        "rounded-lg border px-2.5 py-1 text-[0.7rem] font-mono font-semibold tabular-nums transition-all",
                        active
                          ? "border-foreground/45 bg-foreground/[0.09] text-foreground shadow-sm"
                          : "border-border/50 bg-background/35 text-muted-foreground hover:border-border hover:bg-background/55 hover:text-foreground",
                      )}
                      aria-pressed={active}
                    >
                      L{lvl}
                    </button>
                  );
                })}
              </div>
              {hasActiveFilters ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="ml-auto h-8 gap-1 rounded-lg px-2.5 text-[0.7rem]"
                >
                  Reset filters
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {isError && !isPending ? (
          <div className="p-8 sm:p-10">
            <EmptyState
              title="Could not load markets"
              description={(error as Error)?.message ?? "Check your connection and try again."}
              action={
                <Button size="sm" variant="secondary" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <Table className="text-[0.8125rem] tabular-nums">
                <TableHeader>
                  <TableRow className="border-border/40 bg-muted/[0.12] hover:bg-transparent">
                    <TableHead className="h-12 min-w-[11rem] px-4 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Token
                    </TableHead>
                    <TableHead className="h-12 px-2">
                      <SortableHeader
                        label={SORT_LABEL.priceUsd}
                        active={sortKey === "priceUsd"}
                        dir={sortDir}
                        onClick={() => onSort("priceUsd")}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-2">
                      <SortableHeader
                        label={SORT_LABEL.priceChange24hPct}
                        active={sortKey === "priceChange24hPct"}
                        dir={sortDir}
                        onClick={() => onSort("priceChange24hPct")}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-2">
                      <SortableHeader
                        label={SORT_LABEL.floorPriceUsd}
                        active={sortKey === "floorPriceUsd"}
                        dir={sortDir}
                        onClick={() => onSort("floorPriceUsd")}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-2">
                      <SortableHeader
                        label={SORT_LABEL.floorDeltaPct}
                        active={sortKey === "floorDeltaPct"}
                        dir={sortDir}
                        onClick={() => onSort("floorDeltaPct")}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-2">
                      <SortableHeader
                        label={SORT_LABEL.marketCapUsd}
                        active={sortKey === "marketCapUsd"}
                        dir={sortDir}
                        onClick={() => onSort("marketCapUsd")}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-2">
                      <SortableHeader
                        label={SORT_LABEL.volume24hUsd}
                        active={sortKey === "volume24hUsd"}
                        dir={sortDir}
                        onClick={() => onSort("volume24hUsd")}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-2">
                      <SortableHeader
                        label={SORT_LABEL.holders}
                        active={sortKey === "holders"}
                        dir={sortDir}
                        onClick={() => onSort("holders")}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-2">
                      <SortableHeader
                        label={SORT_LABEL.creatorFeePct}
                        active={sortKey === "creatorFeePct"}
                        dir={sortDir}
                        onClick={() => onSort("creatorFeePct")}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-2">
                      <SortableHeader
                        label={SORT_LABEL.lockedSupplyPct}
                        active={sortKey === "lockedSupplyPct"}
                        dir={sortDir}
                        onClick={() => onSort("lockedSupplyPct")}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-2">
                      <SortableHeader
                        label={SORT_LABEL.ageHours}
                        active={sortKey === "ageHours"}
                        dir={sortDir}
                        onClick={() => onSort("ageHours")}
                      />
                    </TableHead>
                    <TableHead className="h-12 px-4 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending && rows.length === 0
                    ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <TableRow key={`sk-${i}`} className="border-border/30">
                          <TableCell colSpan={12} className="px-4 py-3">
                            <Skeleton className="h-10 w-full rounded-lg" />
                          </TableCell>
                        </TableRow>
                      ))
                    : sorted.map((m) => (
                        <TableRow
                          key={m.mint}
                          onClick={() => onSelect(m)}
                          className={cn(
                            "group cursor-pointer border-border/30 transition-colors hover:bg-muted/[0.38]",
                          )}
                        >
                          <TableCell className="border-l-2 border-l-transparent px-4 py-3 transition-colors group-hover:border-l-uof/55">
                            <div className="flex min-w-0 items-center gap-3">
                              <TokenAvatar imageUrl={m.imageUrl} symbol={m.symbol} size="sm" />
                              <div className="min-w-0">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  <span className="truncate font-semibold text-foreground">${m.symbol || "—"}</span>
                                  <VerifiedBadge verified={m.isVerified} />
                                  <LevelChip level={m.level} />
                                </div>
                                <p className="truncate text-[0.7rem] text-muted-foreground">{m.name || shortenMint(m.mint)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right font-medium text-foreground">
                            {formatPriceSmart(m.priceUsd)}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right">
                            <ChangePill pct={m.priceChange24hPct} />
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right text-foreground">{formatPriceSmart(m.floorPriceUsd)}</TableCell>
                          <TableCell className="px-2 py-3 text-right">
                            <ChangePill pct={m.floorDeltaPct} />
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right text-foreground">
                            {formatUsd(m.marketCapUsd, { compact: true })}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right text-foreground">
                            {formatUsd(m.volume24hUsd, { compact: true })}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right text-foreground">{formatInt(m.holders)}</TableCell>
                          <TableCell className="px-2 py-3 text-right text-muted-foreground">
                            {m.creatorFeePct != null ? `${m.creatorFeePct}%` : "—"}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right text-muted-foreground">
                            {m.lockedSupplyPct != null ? `${m.lockedSupplyPct.toFixed(0)}%` : "—"}
                          </TableCell>
                          <TableCell className="px-2 py-3 text-right text-muted-foreground">{formatRelativeAge(m.ageHours)}</TableCell>
                          <TableCell className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <RiseTradeButton mint={m.mint} />
                          </TableCell>
                        </TableRow>
                      ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden">
              {isPending && rows.length === 0 ? (
                <div className="flex flex-col gap-3 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl" />
                  ))}
                </div>
              ) : sorted.length === 0 ? (
                <div className="px-4 py-10 sm:px-6">
                  <EmptyState title="No markets match" description="Try clearing filters or search." />
                </div>
              ) : (
                <ul className="flex flex-col gap-3 p-4">
                  {sorted.map((m) => (
                    <li key={m.mint}>
                      <button
                        type="button"
                        onClick={() => onSelect(m)}
                        className="flex w-full flex-col gap-3 rounded-2xl border border-border/45 bg-gradient-to-b from-card/45 to-card/[0.12] p-4 text-left shadow-sm transition-all hover:border-border/70 hover:shadow-md active:scale-[0.99]"
                      >
                        <div className="flex items-start gap-3">
                          <TokenAvatar imageUrl={m.imageUrl} symbol={m.symbol} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-foreground">${m.symbol || "—"}</span>
                              <VerifiedBadge verified={m.isVerified} />
                              <LevelChip level={m.level} />
                            </div>
                            <p className="truncate text-[0.75rem] text-muted-foreground">{m.name || shortenMint(m.mint)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold tabular-nums text-foreground">{formatPriceSmart(m.priceUsd)}</p>
                            <ChangePill pct={m.priceChange24hPct} className="mt-1" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-t border-border/35 pt-3 text-[0.68rem] text-muted-foreground sm:grid-cols-3">
                          <div>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em]">Market cap</p>
                            <p className="mt-0.5 font-medium text-foreground">{formatUsd(m.marketCapUsd, { compact: true })}</p>
                          </div>
                          <div>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em]">24h vol</p>
                            <p className="mt-0.5 font-medium text-foreground">{formatUsd(m.volume24hUsd, { compact: true })}</p>
                          </div>
                          <div>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em]">Holders</p>
                            <p className="mt-0.5 font-medium text-foreground">{formatInt(m.holders)}</p>
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em]">Floor Δ</p>
                            <div className="mt-1">
                              <ChangePill pct={m.floorDeltaPct} />
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-border/45 bg-muted/[0.12] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0 text-[0.7rem] text-muted-foreground sm:text-xs">
                {isError ? (
                  <span className="text-destructive">{(error as Error)?.message ?? "Failed to load markets."}</span>
                ) : (
                  <>
                    <span className="font-medium text-foreground/90">
                      Page {data?.page ?? page}
                      {totalPages != null ? ` of ${formatInt(totalPages)}` : ""}
                    </span>
                    <span className="text-muted-foreground/85">
                      {" "}
                      · {isFetching ? "Refreshing…" : "Up to date"}
                      {hasActiveFilters ? ` · ${formatInt(sorted.length)} rows after local filters` : ""}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-9 gap-1 rounded-lg px-3 text-xs"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={(totalPages != null && page >= totalPages) || isFetching || rows.length < PAGE_SIZE}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-9 gap-1 rounded-lg px-3 text-xs"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </Button>
                {isError ? (
                  <Button size="sm" variant="secondary" onClick={() => refetch()} className="h-9 px-3 text-xs">
                    Retry
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        )}
      </GlassCard>
    </section>
  );
}
