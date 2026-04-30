import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRiseMarkets, useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import { formatUsd } from "@/lib/marketDisplayFormat";
import type { RiseMarketRow } from "@/lib/riseDashboardTypes";
import {
  ChangePill,
  GlassCard,
  RiseTradeButton,
  TokenAvatar,
  VerifiedBadge,
  formatPriceSmart,
} from "@/components/rise/RiseShared";
import {
  computeAlphaScore,
  computeNarrativeTags,
  computeRiskFlags,
  enrichMarket,
} from "./IntelligenceEngine";
import { AlphaCell, NarrativeCell, RiskCell } from "./IntelligenceColumns";
import type { NarrativeTag, RiskFlag } from "./types";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";

const PAGE_SIZE = 10;
const RISK_OPTIONS: RiskFlag[] = ["LowLiquidity", "HighFee", "NewAge", "LowLocked", "Unverified", "DisableSell"];
const NARRATIVE_OPTIONS: NarrativeTag[] = [
  "Verified",
  "FloorBacked",
  "Momentum",
  "Cooldown",
  "BlueChip",
  "Microcap",
  "Fresh",
];

type SortKey = "alpha" | "volume24hUsd" | "marketCapUsd" | "priceChange24hPct";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-60" />;
  return dir === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
}

function toggleValue<T extends string>(arr: T[], value: T): T[] {
  return arr.includes(value) ? arr.filter((item) => item !== value) : [...arr, value];
}

type TerminalScreenerProps = {
  onSelect: (market: RiseMarketRow) => void;
  narrativeFilter: NarrativeTag | null;
  hideInlineNarrativeFilters?: boolean;
};

export function TerminalScreener({
  onSelect,
  narrativeFilter,
  hideInlineNarrativeFilters = false,
}: TerminalScreenerProps) {
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const queryClient = useQueryClient();
  const marketsQuery = useRiseMarketsAll(150);
  const firstPageQuery = useRiseMarkets({ page: 1, limit: 10 });
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasFloorOnly, setHasFloorOnly] = useState(false);
  const [riskFilters, setRiskFilters] = useState<RiskFlag[]>([]);
  const [narrativeFilters, setNarrativeFilters] = useState<NarrativeTag[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("alpha");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (narrativeFilter) {
      setNarrativeFilters([narrativeFilter]);
      setPage(1);
    }
  }, [narrativeFilter]);

  const baseRows = useMemo(
    () => marketsQuery.data ?? firstPageQuery.data?.markets ?? [],
    [marketsQuery.data, firstPageQuery.data?.markets],
  );
  const enriched = useMemo(() => baseRows.map((market) => enrichMarket(market)), [baseRows]);

  const filtered = useMemo(() => {
    return enriched.filter((row) => {
      const market = row.market;
      if (deferredSearch) {
        const haystack = `${market.symbol} ${market.name} ${market.mint}`.toLowerCase();
        if (!haystack.includes(deferredSearch)) return false;
      }
      if (verifiedOnly && !market.isVerified) return false;
      if (hasFloorOnly && !(market.floorMarketCapUsd !== null && market.floorMarketCapUsd > 0)) return false;
      if (riskFilters.length > 0 && !riskFilters.every((flag) => row.riskFlags.includes(flag))) return false;
      if (narrativeFilters.length > 0 && !narrativeFilters.every((tag) => row.narratives.includes(tag))) return false;
      return true;
    });
  }, [deferredSearch, enriched, hasFloorOnly, narrativeFilters, riskFilters, verifiedOnly]);

  const sorted = useMemo(() => {
    const next = [...filtered];
    next.sort((a, b) => {
      const factor = sortDir === "asc" ? 1 : -1;
      if (sortKey === "alpha") return (a.alpha.score - b.alpha.score) * factor;
      const av = a.market[sortKey] ?? 0;
      const bv = b.market[sortKey] ?? 0;
      return ((av as number) - (bv as number)) * factor;
    });
    return next;
  }, [filtered, sortDir, sortKey]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [safePage, sorted]);

  const setSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };
  const activeFilterCount = (verifiedOnly ? 1 : 0) + (hasFloorOnly ? 1 : 0) + riskFilters.length + narrativeFilters.length;
  const clearFilters = () => {
    setVerifiedOnly(false);
    setHasFloorOnly(false);
    setRiskFilters([]);
    setNarrativeFilters([]);
    setSearch("");
    setPage(1);
  };

  return (
    <GlassCard className="p-0">
      <div className="border-b border-border/60 px-4 py-3 sm:px-5">
        <div className="rounded-xl border border-border/55 bg-background/35 p-3">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {copy.terminal.filters}
                {activeFilterCount > 0 ? <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-foreground">{activeFilterCount}</span> : null}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={verifiedOnly ? "default" : "outline"}
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => setVerifiedOnly((prev) => !prev)}
                >
                  {copy.terminal.verified}
                </Button>
                <Button
                  variant={hasFloorOnly ? "default" : "outline"}
                  size="sm"
                  className="h-8 rounded-full px-3 text-xs"
                  onClick={() => setHasFloorOnly((prev) => !prev)}
                >
                  {copy.terminal.floorBacked}
                </Button>
                {activeFilterCount > 0 || search ? (
                  <Button variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={clearFilters}>
                    <X className="mr-1 h-3.5 w-3.5" />
                    {copy.terminal.clear}
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  title={copy.terminal.refresh}
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["rise-markets-all"] });
                    queryClient.invalidateQueries({ queryKey: ["rise-markets"] });
                    queryClient.invalidateQueries({ queryKey: ["rise-aggregate"] });
                    void Promise.all([marketsQuery.refetch(), firstPageQuery.refetch()]);
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="relative min-w-[16rem] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={copy.terminal.searchPlaceholder}
                className="h-9 rounded-lg border-border/60 bg-background/70 pl-8"
              />
            </div>

            <div className={`grid gap-2 ${hideInlineNarrativeFilters ? "md:grid-cols-1" : "md:grid-cols-2"}`}>
              <div className="rounded-lg border border-border/55 bg-background/45 p-2">
                <p className="mb-2 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">{copy.terminal.riskFlags}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {RISK_OPTIONS.map((flag) => (
                    <Button
                      key={flag}
                      size="sm"
                      variant={riskFilters.includes(flag) ? "default" : "outline"}
                      onClick={() => {
                        setRiskFilters((prev) => toggleValue(prev, flag));
                        setPage(1);
                      }}
                      className="h-7 rounded-full px-2.5 text-[0.65rem]"
                    >
                      {copy.terminal.riskLabel[flag]}
                    </Button>
                  ))}
                </div>
              </div>

              {!hideInlineNarrativeFilters ? (
                <div className="rounded-lg border border-border/55 bg-background/45 p-2">
                  <p className="mb-2 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">{copy.terminal.narratives}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {NARRATIVE_OPTIONS.map((tag) => (
                      <Button
                        key={tag}
                        size="sm"
                        variant={narrativeFilters.includes(tag) ? "default" : "outline"}
                        onClick={() => {
                          setNarrativeFilters((prev) => toggleValue(prev, tag));
                          setPage(1);
                        }}
                        className="h-7 rounded-full px-2.5 text-[0.65rem]"
                      >
                        {copy.terminal.narrativeLabel[tag]}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden min-h-[34rem] md:block">
        <div className="overflow-x-hidden px-4 py-3 sm:px-5">
          {/*
            Plain <table> (not shadcn Table): the shared Table component wraps with overflow-auto,
            which always shows a horizontal scrollbar gutter when content is tight — bad UX here.
            Full narrative / floor / holders / age live in the row drawer; keep the grid lean.
          */}
          <table className="w-full table-fixed border-collapse text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="h-10 w-8 px-2 py-2 text-left">#</TableHead>
                <TableHead className="h-10 w-[18%] px-2 py-2 text-left">{copy.terminal.token}</TableHead>
                <TableHead className="h-10 px-2 py-2 text-left">
                  <button type="button" onClick={() => setSort("alpha")} className="inline-flex max-w-full items-center gap-1 truncate">
                    {copy.terminal.alpha} <SortIcon active={sortKey === "alpha"} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="h-10 px-2 py-2 text-left">{copy.terminal.price}</TableHead>
                <TableHead className="h-10 px-2 py-2 text-left">{copy.terminal.h24}</TableHead>
                <TableHead className="h-10 px-2 py-2 text-left">
                  <button type="button" onClick={() => setSort("volume24hUsd")} className="inline-flex max-w-full items-center gap-1 truncate">
                    {copy.terminal.vol24hLabel} <SortIcon active={sortKey === "volume24hUsd"} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="h-10 px-2 py-2 text-left">
                  <button type="button" onClick={() => setSort("marketCapUsd")} className="inline-flex max-w-full items-center gap-1 truncate">
                    {copy.terminal.mcapLabel} <SortIcon active={sortKey === "marketCapUsd"} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="h-10 px-2 py-2 text-left">{copy.terminal.risk}</TableHead>
                <TableHead className="h-10 px-2 py-2 text-right">{copy.terminal.trade}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketsQuery.isPending && firstPageQuery.isPending && pageRows.length === 0
                ? Array.from({ length: 14 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="px-2 py-2" colSpan={9}>
                        <Skeleton className="h-8 w-full rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                : pageRows.map((row, idx) => (
                    <TableRow
                      key={row.market.mint}
                      className="cursor-pointer hover:bg-muted/20"
                      onClick={() => onSelect(row.market)}
                    >
                      <TableCell className="px-2 py-2">{(safePage - 1) * PAGE_SIZE + idx + 1}</TableCell>
                      <TableCell className="px-2 py-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <TokenAvatar imageUrl={row.market.imageUrl} symbol={row.market.symbol} size="sm" />
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-1">
                              <span className="truncate text-xs font-semibold text-foreground sm:text-[13px]">
                                ${row.market.symbol || "—"}
                              </span>
                              <VerifiedBadge verified={row.market.isVerified} />
                            </div>
                            <p className="truncate text-[0.65rem] text-muted-foreground">{row.market.name || "—"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <AlphaCell alpha={row.alpha} compact />
                      </TableCell>
                      <TableCell className="truncate px-2 py-2 text-xs tabular-nums sm:text-[13px]">
                        {formatPriceSmart(row.market.priceUsd)}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <ChangePill pct={row.market.priceChange24hPct} />
                      </TableCell>
                      <TableCell className="truncate px-2 py-2 text-xs tabular-nums sm:text-[13px]">
                        {formatUsd(row.market.volume24hUsd, { compact: true })}
                      </TableCell>
                      <TableCell className="truncate px-2 py-2 text-xs tabular-nums sm:text-[13px]">
                        {formatUsd(row.market.marketCapUsd, { compact: true })}
                      </TableCell>
                      <TableCell className="px-2 py-2">
                        <RiskCell flags={row.riskFlags} />
                      </TableCell>
                      <TableCell className="px-2 py-2 text-right">
                        <div onClick={(e) => e.stopPropagation()}>
                          <RiseTradeButton mint={row.market.mint} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </table>
        </div>
      </div>

      <div className="space-y-2 px-4 py-3 md:hidden">
        {marketsQuery.isPending && firstPageQuery.isPending && pageRows.length === 0
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={`m-${i}`} className="h-24 w-full rounded-xl" />)
          : pageRows.map((row) => (
              <button
                key={row.market.mint}
                type="button"
                onClick={() => onSelect(row.market)}
                className="w-full rounded-xl border border-border/55 bg-background/35 p-3 text-left"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <TokenAvatar imageUrl={row.market.imageUrl} symbol={row.market.symbol} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">${row.market.symbol || "—"}</p>
                      <p className="truncate text-[0.7rem] text-muted-foreground">{row.market.name || "—"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatPriceSmart(row.market.priceUsd)}</p>
                    <ChangePill pct={row.market.priceChange24hPct} className="mt-1" />
                  </div>
                </div>
                <div className="mt-2 grid gap-2">
                  <AlphaCell alpha={computeAlphaScore(row.market)} compact />
                  <RiskCell flags={computeRiskFlags(row.market)} />
                  <NarrativeCell tags={computeNarrativeTags(row.market)} />
                </div>
              </button>
            ))}
      </div>

      <div className="flex items-center justify-between border-t border-border/60 px-4 py-3 text-xs sm:px-5">
        <p className="text-muted-foreground">
          {copy.terminal.showing} {pageRows.length} {copy.terminal.of} {sorted.length} {copy.terminal.markets}
        </p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
            {copy.terminal.prev}
          </Button>
          <span className="text-muted-foreground">
            {safePage}/{totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {copy.terminal.next}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}
