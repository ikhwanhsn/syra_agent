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
  SlidersHorizontal,
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRiseMarkets, useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import { formatInt, formatUsd } from "@/lib/marketDisplayFormat";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import { cn } from "@/lib/utils";
import {
  ChangePill,
  EmptyState,
  GlassCard,
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
  verifiedOnly: boolean,
  hasFloorOnly: boolean,
  minMarketCap: number | null,
  minVolume24h: number | null,
  minHolders: number | null,
): RiseMarketRow[] {
  const needle = q.trim().toLowerCase();
  return rows.filter((r) => {
    if (verifiedOnly && !r.isVerified) return false;
    if (hasFloorOnly && !((r.floorPriceUsd ?? 0) > 0)) return false;
    if (minMarketCap != null && (r.marketCapUsd ?? 0) < minMarketCap) return false;
    if (minVolume24h != null && (r.volume24hUsd ?? 0) < minVolume24h) return false;
    if (minHolders != null && (r.holders ?? 0) < minHolders) return false;
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

export function MarketScreener({ onSelect }: { onSelect: (m: RiseMarketRow) => void }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasFloorOnly, setHasFloorOnly] = useState(false);
  const [minMarketCapInput, setMinMarketCapInput] = useState("");
  const [minVolumeInput, setMinVolumeInput] = useState("");
  const [minHoldersInput, setMinHoldersInput] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("ageHours");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const deferredSearch = useDeferredValue(search);
  const minMarketCap = useMemo(() => {
    const parsed = Number(minMarketCapInput);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [minMarketCapInput]);
  const minVolume24h = useMemo(() => {
    const parsed = Number(minVolumeInput);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [minVolumeInput]);
  const minHolders = useMemo(() => {
    const parsed = Number(minHoldersInput);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [minHoldersInput]);
  const hasGlobalFilter =
    deferredSearch.trim().length > 0 ||
    verifiedOnly ||
    hasFloorOnly ||
    minMarketCap != null ||
    minVolume24h != null ||
    minHolders != null;

  const allMarketsQuery = useRiseMarketsAll();
  const isGlobalSearchMode = true;

  const total = allMarketsQuery.data?.length ?? null;
  const sourceRows = useMemo(() => allMarketsQuery.data ?? [], [allMarketsQuery.data]);

  const filtered = useMemo(
    () => applyFilters(sourceRows, deferredSearch, verifiedOnly, hasFloorOnly, minMarketCap, minVolume24h, minHolders),
    [sourceRows, deferredSearch, verifiedOnly, hasFloorOnly, minMarketCap, minVolume24h, minHolders],
  );
  const globalRows = allMarketsQuery.data ?? [];
  const todayStats = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const createdToday = globalRows.filter((row) => {
      if (!row.createdAt) return false;
      const createdTs = new Date(row.createdAt).getTime();
      return Number.isFinite(createdTs) && createdTs >= startOfToday;
    });
    const withMarketCap = globalRows.filter((row) => (row.marketCapUsd ?? 0) > 0);
    const withFloorMarketCap = globalRows.filter((row) => (row.floorMarketCapUsd ?? 0) > 0);
    const avgMarketCap =
      withMarketCap.length > 0
        ? withMarketCap.reduce((sum, row) => sum + (row.marketCapUsd ?? 0), 0) / withMarketCap.length
        : null;
    const avgFloorMarketCap =
      withFloorMarketCap.length > 0
        ? withFloorMarketCap.reduce((sum, row) => sum + (row.floorMarketCapUsd ?? 0), 0) / withFloorMarketCap.length
        : null;
    return {
      newToday: createdToday.length,
      avgMarketCap,
      avgFloorMarketCap,
    };
  }, [globalRows]);
  const sorted = useMemo(() => sortRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pagedRows = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
  );
  const isPending = allMarketsQuery.isPending;
  const isFetching = allMarketsQuery.isFetching;
  const isError = allMarketsQuery.isError;
  const error = allMarketsQuery.error;
  const refetch = allMarketsQuery.refetch;

  useEffect(() => {
    setPage(1);
  }, [verifiedOnly, hasFloorOnly, deferredSearch, minMarketCap, minVolume24h, minHolders]);

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const resetFilters = () => {
    setSearch("");
    setVerifiedOnly(false);
    setHasFloorOnly(false);
    setMinMarketCapInput("");
    setMinVolumeInput("");
    setMinHoldersInput("");
  };

  const activeFilterCount =
    (verifiedOnly ? 1 : 0) +
    (hasFloorOnly ? 1 : 0) +
    (minMarketCap != null ? 1 : 0) +
    (minVolume24h != null ? 1 : 0) +
    (minHolders != null ? 1 : 0);
  const hasActiveFilters = search.trim().length > 0 || activeFilterCount > 0;

  return (
    <section aria-labelledby="rise-screener-heading" className="flex flex-col gap-5">
      <h2 id="rise-screener-heading" className="sr-only">
        RISE market screener
      </h2>

      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        {isPending && sourceRows.length === 0 ? (
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
              hint="Markets in current server scope."
              gradientClass="from-sky-500/28 to-cyan-700/12"
              ringClass="ring-sky-400/22"
            />
            <ScreenerStatCard
              icon={Layers}
              label="New tokens today"
              value={formatInt(todayStats.newToday)}
              hint="Tokens created since 00:00 local time."
              gradientClass="from-emerald-500/25 to-teal-800/12"
              ringClass="ring-emerald-400/22"
            />
            <ScreenerStatCard
              icon={RefreshCw}
              label="Average market / floor MC"
              value={
                <span className="text-[1.15rem] sm:text-[1.35rem]">
                  {todayStats.avgMarketCap != null ? formatUsd(todayStats.avgMarketCap, { compact: true }) : "—"}
                  <span className="mx-1 text-base font-medium text-muted-foreground">/</span>
                  {todayStats.avgFloorMarketCap != null ? formatUsd(todayStats.avgFloorMarketCap, { compact: true }) : "—"}
                </span>
              }
              hint="Average market cap and average floor market cap."
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
                Search and apply advanced filters to isolate the markets that matter.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
              <div className="relative min-w-0 sm:w-[20rem]">
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

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-11 rounded-xl border-border/55 px-3 text-xs sm:text-sm">
                    <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 ? (
                      <span className="ml-1 rounded-full bg-uof/20 px-1.5 py-0.5 text-[10px] font-semibold text-uof">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[20rem] space-y-3 rounded-xl border-border/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Quick Filters</p>

                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border/40 bg-muted/[0.12] px-2.5 py-2">
                    <span className="text-xs font-medium text-foreground">Verified only</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-current"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                    />
                  </label>
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border/40 bg-muted/[0.12] px-2.5 py-2">
                    <span className="text-xs font-medium text-foreground">Has floor price</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-current"
                      checked={hasFloorOnly}
                      onChange={(e) => setHasFloorOnly(e.target.checked)}
                    />
                  </label>

                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Min market cap (USD)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step="1000"
                      value={minMarketCapInput}
                      onChange={(e) => setMinMarketCapInput(e.target.value)}
                      placeholder="e.g. 1000000"
                      className="h-9 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Min 24h volume (USD)
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step="1000"
                      value={minVolumeInput}
                      onChange={(e) => setMinVolumeInput(e.target.value)}
                      placeholder="e.g. 50000"
                      className="h-9 rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      Min holders
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step="1"
                      value={minHoldersInput}
                      onChange={(e) => setMinHoldersInput(e.target.value)}
                      placeholder="e.g. 250"
                      className="h-9 rounded-lg"
                    />
                  </div>
                </PopoverContent>
              </Popover>

              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="h-11 rounded-xl border-border/55 px-3 text-xs sm:text-sm"
                >
                  Clear
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
                  {isPending && pagedRows.length === 0
                    ? Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <TableRow key={`sk-${i}`} className="border-border/30">
                          <TableCell colSpan={12} className="px-4 py-3">
                            <Skeleton className="h-10 w-full rounded-lg" />
                          </TableCell>
                        </TableRow>
                      ))
                    : pagedRows.map((m) => (
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
              {isPending && pagedRows.length === 0 ? (
                <div className="flex flex-col gap-3 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl" />
                  ))}
                </div>
              ) : pagedRows.length === 0 ? (
                <div className="px-4 py-10 sm:px-6">
                  <EmptyState title="No markets match" description="Try clearing filters or search." />
                </div>
              ) : (
                <ul className="flex flex-col gap-3 p-4">
                  {pagedRows.map((m) => (
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
                      Page {isGlobalSearchMode ? page : (listQuery.data?.page ?? page)}
                      {totalPages != null ? ` of ${formatInt(totalPages)}` : ""}
                    </span>
                    <span className="text-muted-foreground/85">
                      {" "}
                      · {isFetching ? "Refreshing…" : "Up to date"}
                      {hasActiveFilters
                        ? ` · ${formatInt(isGlobalSearchMode ? filtered.length : sorted.length)} rows after local filters`
                        : ""}
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
                  disabled={
                    isGlobalSearchMode
                      ? page >= (totalPages ?? 1) || isFetching
                      : (totalPages != null && page >= totalPages) || isFetching || sourceRows.length < PAGE_SIZE
                  }
                  onClick={() => setPage((p) => Math.min((totalPages ?? p + 1), p + 1))}
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
