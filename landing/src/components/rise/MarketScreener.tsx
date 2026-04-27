/**
 * The screener — the dense, sortable, filterable table of every RISE market.
 *
 * - Server pagination via /uponly-rise-markets?page&limit
 * - Client-side filter (search, verified, has-floor, level chips) over current page
 * - Click row → opens MarketDetailDrawer (controlled from parent)
 * - Mobile collapses to card list
 */
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  SectionHeader,
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
        "inline-flex w-full items-center gap-1 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground sm:text-xs",
        align === "right" ? "justify-end" : "justify-start",
        active && "text-foreground",
        className,
      )}
      aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}
    >
      <span>{label}</span>
      {active ? (
        dir === "asc" ? (
          <ArrowUp className="h-3 w-3" aria-hidden />
        ) : (
          <ArrowDown className="h-3 w-3" aria-hidden />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-60" aria-hidden />
      )}
    </button>
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

  return (
    <section aria-labelledby="rise-screener-heading">
      <SectionHeader
        eyebrow="Screener"
        title="Every RISE market"
        description={
          <>
            Sort and filter all <strong className="font-medium text-foreground/85">{total != null ? formatInt(total) : "—"}</strong>
            {" "}listed markets. Click a row to open the detail panel with chart and recent trades.
          </>
        }
        right={
          <div className="text-[0.7rem] text-muted-foreground sm:text-xs">
            {data
              ? `Showing page ${data.page} · ${data.count} rows${hasActiveFilters ? ` (${sorted.length} after filters)` : ""}`
              : "Loading…"}
          </div>
        }
      />

      <GlassCard padded={false}>
        <div className="flex flex-col gap-3 border-b border-border/40 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by symbol, name or mint address…"
                className="h-10 pl-9 pr-9"
                aria-label="Search markets"
              />
              {search ? (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2">
                <Switch id="verified-only" checked={verifiedOnly} onCheckedChange={setVerifiedOnly} />
                <Label htmlFor="verified-only" className="cursor-pointer text-xs font-medium text-foreground/85">
                  Verified only
                </Label>
              </div>
              <div className="inline-flex items-center gap-2">
                <Switch id="has-floor" checked={hasFloorOnly} onCheckedChange={setHasFloorOnly} />
                <Label htmlFor="has-floor" className="cursor-pointer text-xs font-medium text-foreground/85">
                  Has floor
                </Label>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-muted-foreground sm:text-xs">
            <Filter className="h-3 w-3" aria-hidden />
            <span>Levels:</span>
            {LEVEL_CHIPS.map((lvl) => {
              const active = selectedLevels.has(lvl);
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => toggleLevel(lvl)}
                  className={cn(
                    "rounded-md border px-2 py-0.5 font-mono tabular-nums transition-colors",
                    active
                      ? "border-foreground/55 bg-foreground/[0.08] text-foreground"
                      : "border-border/45 bg-background/30 text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                  aria-pressed={active}
                >
                  L{lvl}
                </button>
              );
            })}
            {hasActiveFilters ? (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="ml-auto h-6 px-2 text-[0.7rem]">
                Reset filters
              </Button>
            ) : null}
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <Table className="text-[0.8rem] tabular-nums">
            <TableHeader className="sticky top-0 z-[1] bg-card/90 backdrop-blur-sm">
              <TableRow className="border-border/40">
                <TableHead className="h-10 w-[24%] px-3 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  Token
                </TableHead>
                <TableHead className="h-10 px-2 text-right">
                  <SortableHeader label={SORT_LABEL.priceUsd} active={sortKey === "priceUsd"} dir={sortDir} onClick={() => onSort("priceUsd")} />
                </TableHead>
                <TableHead className="h-10 px-2 text-right">
                  <SortableHeader label={SORT_LABEL.priceChange24hPct} active={sortKey === "priceChange24hPct"} dir={sortDir} onClick={() => onSort("priceChange24hPct")} />
                </TableHead>
                <TableHead className="h-10 px-2 text-right">
                  <SortableHeader label={SORT_LABEL.floorPriceUsd} active={sortKey === "floorPriceUsd"} dir={sortDir} onClick={() => onSort("floorPriceUsd")} />
                </TableHead>
                <TableHead className="h-10 px-2 text-right">
                  <SortableHeader label={SORT_LABEL.floorDeltaPct} active={sortKey === "floorDeltaPct"} dir={sortDir} onClick={() => onSort("floorDeltaPct")} />
                </TableHead>
                <TableHead className="h-10 px-2 text-right">
                  <SortableHeader label={SORT_LABEL.marketCapUsd} active={sortKey === "marketCapUsd"} dir={sortDir} onClick={() => onSort("marketCapUsd")} />
                </TableHead>
                <TableHead className="h-10 px-2 text-right">
                  <SortableHeader label={SORT_LABEL.volume24hUsd} active={sortKey === "volume24hUsd"} dir={sortDir} onClick={() => onSort("volume24hUsd")} />
                </TableHead>
                <TableHead className="h-10 px-2 text-right">
                  <SortableHeader label={SORT_LABEL.holders} active={sortKey === "holders"} dir={sortDir} onClick={() => onSort("holders")} />
                </TableHead>
                <TableHead className="h-10 px-2 text-right">
                  <SortableHeader label={SORT_LABEL.creatorFeePct} active={sortKey === "creatorFeePct"} dir={sortDir} onClick={() => onSort("creatorFeePct")} />
                </TableHead>
                <TableHead className="h-10 px-2 text-right">
                  <SortableHeader label={SORT_LABEL.lockedSupplyPct} active={sortKey === "lockedSupplyPct"} dir={sortDir} onClick={() => onSort("lockedSupplyPct")} />
                </TableHead>
                <TableHead className="h-10 px-2 text-right">
                  <SortableHeader label={SORT_LABEL.ageHours} active={sortKey === "ageHours"} dir={sortDir} onClick={() => onSort("ageHours")} />
                </TableHead>
                <TableHead className="h-10 px-3 text-right text-xs uppercase tracking-wider text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isPending && rows.length === 0
                ? Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={`sk-${i}`} className="border-border/30">
                      <TableCell colSpan={12} className="px-3 py-3">
                        <Skeleton className="h-9 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : sorted.map((m) => (
                    <TableRow
                      key={m.mint}
                      onClick={() => onSelect(m)}
                      className="cursor-pointer border-border/25 hover:bg-muted/40"
                    >
                      <TableCell className="px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-2.5">
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
                      <TableCell className="px-2 py-2.5 text-right font-medium text-foreground">{formatPriceSmart(m.priceUsd)}</TableCell>
                      <TableCell className="px-2 py-2.5 text-right">
                        <ChangePill pct={m.priceChange24hPct} />
                      </TableCell>
                      <TableCell className="px-2 py-2.5 text-right text-foreground">{formatPriceSmart(m.floorPriceUsd)}</TableCell>
                      <TableCell className="px-2 py-2.5 text-right">
                        <ChangePill pct={m.floorDeltaPct} />
                      </TableCell>
                      <TableCell className="px-2 py-2.5 text-right text-foreground">{formatUsd(m.marketCapUsd, { compact: true })}</TableCell>
                      <TableCell className="px-2 py-2.5 text-right text-foreground">{formatUsd(m.volume24hUsd, { compact: true })}</TableCell>
                      <TableCell className="px-2 py-2.5 text-right text-foreground">{formatInt(m.holders)}</TableCell>
                      <TableCell className="px-2 py-2.5 text-right text-muted-foreground">
                        {m.creatorFeePct != null ? `${m.creatorFeePct}%` : "—"}
                      </TableCell>
                      <TableCell className="px-2 py-2.5 text-right text-muted-foreground">
                        {m.lockedSupplyPct != null ? `${m.lockedSupplyPct.toFixed(0)}%` : "—"}
                      </TableCell>
                      <TableCell className="px-2 py-2.5 text-right text-muted-foreground">{formatRelativeAge(m.ageHours)}</TableCell>
                      <TableCell className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
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
            <div className="flex flex-col gap-2 px-3 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="px-4 py-8">
              <EmptyState title="No markets match" description="Try clearing filters or search." />
            </div>
          ) : (
            <ul className="divide-y divide-border/30">
              {sorted.map((m) => (
                <li key={m.mint}>
                  <button
                    type="button"
                    onClick={() => onSelect(m)}
                    className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <TokenAvatar imageUrl={m.imageUrl} symbol={m.symbol} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-foreground">${m.symbol || "—"}</span>
                        <VerifiedBadge verified={m.isVerified} />
                        <LevelChip level={m.level} />
                      </div>
                      <p className="truncate text-[0.7rem] text-muted-foreground">{m.name || shortenMint(m.mint)}</p>
                      <p className="mt-0.5 truncate text-[0.65rem] text-muted-foreground">
                        MC {formatUsd(m.marketCapUsd, { compact: true })} · Vol {formatUsd(m.volume24hUsd, { compact: true })} · Holders {formatInt(m.holders)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular-nums text-foreground">{formatPriceSmart(m.priceUsd)}</p>
                      <ChangePill pct={m.priceChange24hPct} className="mt-0.5" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-stretch gap-2 border-t border-border/40 px-4 py-3 text-[0.7rem] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:text-xs">
          <div className="min-w-0 truncate">
            {isError ? (
              <span className="text-destructive">{(error as Error)?.message ?? "Failed to load markets."}</span>
            ) : (
              <>
                Page <strong className="font-medium text-foreground">{data?.page ?? page}</strong>
                {totalPages ? ` of ${formatInt(totalPages)}` : ""} ·{" "}
                <span>{isFetching ? "Refreshing…" : "Up to date"}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-8 gap-1 px-2"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Prev
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={(totalPages != null && page >= totalPages) || isFetching || rows.length < PAGE_SIZE}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 gap-1 px-2"
            >
              Next <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            {isError ? (
              <Button size="sm" variant="secondary" onClick={() => refetch()} className="h-8 px-2">
                Retry
              </Button>
            ) : null}
          </div>
        </div>
      </GlassCard>
    </section>
  );
}
