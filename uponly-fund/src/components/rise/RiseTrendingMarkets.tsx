/**
 * Overview screener: full RISE universe via useRiseMarketsAll, default composite trending sort,
 * filters, column/header sort, client pagination (100 per page).
 */
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRiseMarketsAll } from "@/lib/RiseDashboardContext";
import { riseTrendingCompositeScore } from "@/lib/riseOverviewTrending";
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
  RISE_UPONLY_MINT,
  shortenMint,
} from "./RiseShared";
import { useLanguage } from "@/lib/LanguageContext";

export const TRENDING_PAGE_SIZE = 100;

/** When $UPONLY is on this page, show it first and style it in the table. */
function pinUponlyFirst(rows: RiseMarketRow[]): RiseMarketRow[] {
  const idx = rows.findIndex((r) => r.mint === RISE_UPONLY_MINT);
  if (idx <= 0) return rows;
  const row = rows[idx];
  return [row, ...rows.slice(0, idx), ...rows.slice(idx + 1)];
}

type OverviewSortKey =
  | "trending"
  | "priceUsd"
  | "priceChange24hPct"
  | "marketCapUsd"
  | "volume24hUsd"
  | "holders"
  | "ageHours";

type SortDir = "asc" | "desc";

function parsePage(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function buildPageItems(current: number, total: number): (number | "gap")[] {
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const anchor = new Set<number>([1, total, current]);
  for (let d = -2; d <= 2; d += 1) {
    const p = current + d;
    if (p >= 1 && p <= total) anchor.add(p);
  }
  const sorted = [...anchor].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev > 0 && p - prev > 1) out.push("gap");
    out.push(p);
    prev = p;
  }
  return out;
}

function applyOverviewFilters(
  rows: RiseMarketRow[],
  q: string,
  verifiedOnly: boolean,
  minMarketCap: number | null,
): RiseMarketRow[] {
  const needle = q.trim().toLowerCase();
  return rows.filter((r) => {
    if (verifiedOnly && !r.isVerified) return false;
    if (minMarketCap != null && (r.marketCapUsd ?? 0) < minMarketCap) return false;
    if (!needle) return true;
    return (
      r.symbol.toLowerCase().includes(needle) ||
      r.name.toLowerCase().includes(needle) ||
      r.mint.toLowerCase().includes(needle)
    );
  });
}

function defaultDirForSortKey(key: OverviewSortKey): SortDir {
  return key === "ageHours" ? "asc" : "desc";
}

type NumericOverviewSortKey = Exclude<OverviewSortKey, "trending">;

function compareNumericColumn(a: RiseMarketRow, b: RiseMarketRow, key: NumericOverviewSortKey, dir: SortDir): number {
  const factor = dir === "asc" ? 1 : -1;
  const av = a[key];
  const bv = b[key];
  const aNum = typeof av === "number" && Number.isFinite(av) ? av : null;
  const bNum = typeof bv === "number" && Number.isFinite(bv) ? bv : null;
  if (aNum === null && bNum === null) return 0;
  if (aNum === null) return 1;
  if (bNum === null) return -1;
  return (aNum - bNum) * factor;
}

function sortOverviewRows(rows: RiseMarketRow[], key: OverviewSortKey, dir: SortDir): RiseMarketRow[] {
  const out = [...rows];
  out.sort((a, b) => {
    if (key === "trending") {
      const diff = riseTrendingCompositeScore(b) - riseTrendingCompositeScore(a);
      return dir === "desc" ? diff : -diff;
    }
    return compareNumericColumn(a, b, key, dir);
  });
  return out;
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

export function RiseTrendingMarkets({ onSelect }: { onSelect: (m: RiseMarketRow) => void }) {
  const { language } = useLanguage();
  const isZh = language === "zh";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pageFromUrl = parsePage(searchParams.get("page"));

  const allMarketsQuery = useRiseMarketsAll(100);
  const sourceRows = allMarketsQuery.data ?? [];

  const [search, setSearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minMarketCapInput, setMinMarketCapInput] = useState("");
  const [sortKey, setSortKey] = useState<OverviewSortKey>("trending");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const deferredSearch = useDeferredValue(search);
  const minMarketCap = useMemo(() => {
    const parsed = Number(minMarketCapInput);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [minMarketCapInput]);

  const filterSigRef = useRef("");
  const filterSig = `${deferredSearch}|${verifiedOnly}|${minMarketCap}|${sortKey}|${sortDir}`;
  useEffect(() => {
    if (filterSigRef.current && filterSigRef.current !== filterSig && pageFromUrl > 1) {
      navigate({ pathname: "/", search: "" }, { replace: true });
    }
    filterSigRef.current = filterSig;
  }, [filterSig, navigate, pageFromUrl]);

  const filtered = useMemo(
    () => applyOverviewFilters(sourceRows, deferredSearch, verifiedOnly, minMarketCap),
    [sourceRows, deferredSearch, verifiedOnly, minMarketCap],
  );
  const sorted = useMemo(() => sortOverviewRows(filtered, sortKey, sortDir), [filtered, sortKey, sortDir]);

  const totalRows = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / TRENDING_PAGE_SIZE));

  useEffect(() => {
    if (pageFromUrl > totalPages) {
      const params = new URLSearchParams(searchParams);
      params.set("page", String(totalPages));
      const q = params.toString();
      navigate({ pathname: "/", search: q ? `?${q}` : "" }, { replace: true });
    }
  }, [navigate, pageFromUrl, searchParams, totalPages]);

  const markets = useMemo(() => {
    const start = (pageFromUrl - 1) * TRENDING_PAGE_SIZE;
    const slice = sorted.slice(start, start + TRENDING_PAGE_SIZE);
    return pinUponlyFirst(slice);
  }, [sorted, pageFromUrl]);

  const isPending = allMarketsQuery.isPending && sourceRows.length === 0;
  const isFetching = allMarketsQuery.isFetching;
  const isError = allMarketsQuery.isError && sourceRows.length === 0;

  const pageItems = useMemo(() => buildPageItems(pageFromUrl, totalPages), [pageFromUrl, totalPages]);
  const canGoNext = pageFromUrl < totalPages;

  const setPage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    const nextParams = new URLSearchParams(searchParams);
    if (clamped <= 1) nextParams.delete("page");
    else nextParams.set("page", String(clamped));
    const q = nextParams.toString();
    navigate({ pathname: "/", search: q ? `?${q}` : "" });
  };

  const rangeStart = (pageFromUrl - 1) * TRENDING_PAGE_SIZE + (markets.length ? 1 : 0);
  const rangeEnd = (pageFromUrl - 1) * TRENDING_PAGE_SIZE + markets.length;

  const onSort = (key: OverviewSortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(defaultDirForSortKey(key));
    }
  };

  const onSortSelect = (value: string) => {
    const key = value as OverviewSortKey;
    setSortKey(key);
    setSortDir(defaultDirForSortKey(key));
  };

  const resetFilters = () => {
    setSearch("");
    setVerifiedOnly(false);
    setMinMarketCapInput("");
  };

  const activeFilterCount = (verifiedOnly ? 1 : 0) + (minMarketCap != null ? 1 : 0);
  const hasActiveFilters = search.trim().length > 0 || activeFilterCount > 0;

  const sortLabel = {
    trending: isZh ? "综合热门" : "Trending",
    priceUsd: isZh ? "价格" : "Price",
    priceChange24hPct: isZh ? "24h Δ" : "24h %",
    marketCapUsd: isZh ? "市值" : "Market cap",
    volume24hUsd: isZh ? "24h 成交量" : "24h volume",
    holders: isZh ? "持有人" : "Holders",
    ageHours: isZh ? "时长" : "Age",
  } as const;

  return (
    <section aria-labelledby="rise-home-screener-heading" className="flex flex-col gap-5">
      <h2 id="rise-home-screener-heading" className="sr-only">
        {isZh ? "RISE 市场总览" : "RISE markets overview"}
      </h2>

      <GlassCard
        padded={false}
        className="overflow-hidden border-border/50 shadow-[0_0_0_1px_hsl(0_0%_100%/0.05)_inset,0_24px_60px_-28px_hsl(0_0%_0%/0.55)]"
      >
        <div className="border-b border-border/45 bg-gradient-to-b from-card/55 to-transparent px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0 space-y-1">
              <p className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-foreground/45" aria-hidden />
                {isZh ? "筛选与排序" : "Filter & sort"}
              </p>
              <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
                {isZh
                  ? "默认按综合热门分排序（成交量、参与度与波动）；可改列排序或筛选。"
                  : "Default sort is composite trending (volume, participation, and move). Change columns or filters anytime."}
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="relative min-w-0 sm:w-[14rem] lg:w-[16rem]">
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/90"
                  aria-hidden
                />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isZh ? "符号、名称或 mint…" : "Symbol, name, or mint…"}
                  className="h-11 rounded-xl border-border/55 bg-background/40 pl-10 pr-10 shadow-inner"
                  aria-label={isZh ? "搜索" : "Search"}
                />
                {search ? (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    aria-label={isZh ? "清空" : "Clear"}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:w-[14rem] sm:flex-none">
                <label className="sr-only" htmlFor="overview-sort">
                  {isZh ? "排序方式" : "Sort by"}
                </label>
                <Select value={sortKey} onValueChange={onSortSelect}>
                  <SelectTrigger id="overview-sort" className="h-11 rounded-xl border-border/55 bg-background/40">
                    <SelectValue placeholder={sortLabel.trending} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trending">{sortLabel.trending}</SelectItem>
                    <SelectItem value="volume24hUsd">{sortLabel.volume24hUsd}</SelectItem>
                    <SelectItem value="marketCapUsd">{sortLabel.marketCapUsd}</SelectItem>
                    <SelectItem value="priceChange24hPct">{sortLabel.priceChange24hPct}</SelectItem>
                    <SelectItem value="holders">{sortLabel.holders}</SelectItem>
                    <SelectItem value="priceUsd">{sortLabel.priceUsd}</SelectItem>
                    <SelectItem value="ageHours">{sortLabel.ageHours}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-11 rounded-xl border-border/55 px-3 text-xs sm:text-sm">
                    <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                    {isZh ? "筛选" : "Filters"}
                    {activeFilterCount > 0 ? (
                      <span className="ml-1 rounded-full bg-uof/20 px-1.5 py-0.5 text-[10px] font-semibold text-uof">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[19rem] space-y-3 rounded-xl border-border/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {isZh ? "快速筛选" : "Quick filters"}
                  </p>
                  <label className="flex cursor-pointer items-center justify-between rounded-lg border border-border/40 bg-muted/[0.12] px-2.5 py-2">
                    <span className="text-xs font-medium text-foreground">{isZh ? "仅已验证" : "Verified only"}</span>
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-current"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                    />
                  </label>
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                      {isZh ? "最小市值（USD）" : "Min market cap (USD)"}
                    </label>
                    <Input
                      type="number"
                      min={0}
                      step="1000"
                      value={minMarketCapInput}
                      onChange={(e) => setMinMarketCapInput(e.target.value)}
                      placeholder={isZh ? "例如 100000" : "e.g. 100000"}
                      className="h-9 rounded-lg"
                    />
                  </div>
                </PopoverContent>
              </Popover>

              {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={resetFilters} className="h-11 rounded-xl px-3 text-xs sm:text-sm">
                  {isZh ? "清除" : "Clear"}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        {isError ? (
          <div className="p-8 sm:p-10">
            <EmptyState
              title={isZh ? "无法加载市场" : "Could not load markets"}
              description={
                (allMarketsQuery.error as Error)?.message ??
                (isZh ? "请检查网络后重试。" : "Check your connection and try again.")
              }
              action={
                <Button size="sm" variant="secondary" onClick={() => allMarketsQuery.refetch()}>
                  {isZh ? "重试" : "Retry"}
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <Table className="text-[0.8125rem] tabular-nums">
                <TableHeader>
                  <TableRow className="border-border/40 bg-muted/[0.12] hover:bg-transparent">
                    <TableHead className="h-11 min-w-[10rem] px-4 text-left text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {isZh ? "代币" : "Pair"}
                    </TableHead>
                    <TableHead className="h-11 px-2">
                      <SortableHeader
                        label={sortLabel.priceUsd}
                        active={sortKey === "priceUsd"}
                        dir={sortDir}
                        onClick={() => onSort("priceUsd")}
                      />
                    </TableHead>
                    <TableHead className="h-11 px-2">
                      <SortableHeader
                        label={sortLabel.priceChange24hPct}
                        active={sortKey === "priceChange24hPct"}
                        dir={sortDir}
                        onClick={() => onSort("priceChange24hPct")}
                      />
                    </TableHead>
                    <TableHead className="h-11 px-2">
                      <SortableHeader
                        label={sortLabel.marketCapUsd}
                        active={sortKey === "marketCapUsd"}
                        dir={sortDir}
                        onClick={() => onSort("marketCapUsd")}
                      />
                    </TableHead>
                    <TableHead className="h-11 px-2">
                      <SortableHeader
                        label={sortLabel.volume24hUsd}
                        active={sortKey === "volume24hUsd"}
                        dir={sortDir}
                        onClick={() => onSort("volume24hUsd")}
                      />
                    </TableHead>
                    <TableHead className="h-11 px-2">
                      <SortableHeader
                        label={sortLabel.holders}
                        active={sortKey === "holders"}
                        dir={sortDir}
                        onClick={() => onSort("holders")}
                      />
                    </TableHead>
                    <TableHead className="h-11 px-2">
                      <SortableHeader
                        label={sortLabel.ageHours}
                        active={sortKey === "ageHours"}
                        dir={sortDir}
                        onClick={() => onSort("ageHours")}
                      />
                    </TableHead>
                    <TableHead className="h-11 px-4 text-right text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {isZh ? "操作" : "Action"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isPending && markets.length === 0
                    ? Array.from({ length: 12 }).map((_, i) => (
                        <TableRow key={`sk-${i}`} className="border-border/30">
                          <TableCell colSpan={8} className="px-4 py-3">
                            <Skeleton className="h-10 w-full rounded-lg" />
                          </TableCell>
                        </TableRow>
                      ))
                    : markets.map((m) => {
                        const isUponlyRow = m.mint === RISE_UPONLY_MINT;
                        return (
                        <TableRow
                          key={m.mint}
                          onClick={() => onSelect(m)}
                          data-uponly-spotlight={isUponlyRow ? true : undefined}
                          className={cn(
                            "group cursor-pointer border-border/30 transition-colors",
                            isUponlyRow
                              ? "bg-uof/[0.1] hover:bg-uof/[0.15] dark:bg-uof/[0.14] dark:hover:bg-uof/[0.19]"
                              : "hover:bg-muted/[0.38]",
                          )}
                        >
                          <TableCell
                            className={cn(
                              "border-l-2 px-4 py-2.5 transition-colors",
                              isUponlyRow
                                ? "border-l-uof/70 group-hover:border-l-uof"
                                : "border-l-transparent group-hover:border-l-uof/55",
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <TokenAvatar imageUrl={m.imageUrl} symbol={m.symbol} size="sm" />
                              <div className="min-w-0">
                                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                                  <span className="truncate font-semibold text-foreground">${m.symbol || "—"}</span>
                                  <VerifiedBadge verified={m.isVerified} />
                                  {isUponlyRow ? (
                                    <Badge
                                      variant="outline"
                                      className="shrink-0 border-uof/50 bg-uof/15 px-2 py-0 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-uof dark:bg-uof/22"
                                    >
                                      {isZh ? "官方" : "Official"}
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="truncate text-[0.7rem] text-muted-foreground">{m.name || shortenMint(m.mint)}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-right font-medium text-foreground">
                            {formatPriceSmart(m.priceUsd)}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-right">
                            <ChangePill pct={m.priceChange24hPct} />
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-right text-foreground">
                            {formatUsd(m.marketCapUsd, { compact: true })}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-right text-foreground">
                            {formatUsd(m.volume24hUsd, { compact: true })}
                          </TableCell>
                          <TableCell className="px-2 py-2.5 text-right text-foreground">{formatInt(m.holders)}</TableCell>
                          <TableCell className="px-2 py-2.5 text-right text-muted-foreground">
                            {formatRelativeAge(m.ageHours)}
                          </TableCell>
                          <TableCell className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <RiseTradeButton mint={m.mint} />
                          </TableCell>
                        </TableRow>
                        );
                      })}
                </TableBody>
              </Table>
            </div>

            <div className="lg:hidden">
              {isPending && markets.length === 0 ? (
                <div className="flex flex-col gap-3 p-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl" />
                  ))}
                </div>
              ) : markets.length === 0 ? (
                <div className="px-4 py-10 sm:px-6">
                  <EmptyState
                    title={isZh ? "没有匹配" : "No matches"}
                    description={isZh ? "尝试调整筛选或搜索。" : "Try adjusting filters or search."}
                  />
                </div>
              ) : (
                <ul className="flex flex-col gap-3 p-4">
                  {markets.map((m) => {
                    const isUponlyRow = m.mint === RISE_UPONLY_MINT;
                    return (
                    <li key={m.mint}>
                      <button
                        type="button"
                        onClick={() => onSelect(m)}
                        data-uponly-spotlight={isUponlyRow ? true : undefined}
                        className={cn(
                          "flex w-full flex-col gap-3 rounded-2xl border p-4 text-left shadow-sm transition-all hover:shadow-md active:scale-[0.99]",
                          isUponlyRow
                            ? "border-uof/45 bg-gradient-to-b from-uof/[0.14] via-card/40 to-card/[0.1] hover:border-uof/55"
                            : "border-border/45 bg-gradient-to-b from-card/45 to-card/[0.12] hover:border-border/70",
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <TokenAvatar imageUrl={m.imageUrl} symbol={m.symbol} size="md" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-foreground">${m.symbol || "—"}</span>
                              <VerifiedBadge verified={m.isVerified} />
                              {isUponlyRow ? (
                                <Badge
                                  variant="outline"
                                  className="shrink-0 border-uof/50 bg-uof/15 px-2 py-0 text-[0.58rem] font-semibold uppercase tracking-[0.08em] text-uof dark:bg-uof/22"
                                >
                                  {isZh ? "官方" : "Official"}
                                </Badge>
                              ) : null}
                            </div>
                            <p className="truncate text-[0.75rem] text-muted-foreground">{m.name || shortenMint(m.mint)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold tabular-nums text-foreground">{formatPriceSmart(m.priceUsd)}</p>
                            <ChangePill pct={m.priceChange24hPct} className="mt-1" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border-t border-border/35 pt-3 text-[0.68rem] text-muted-foreground">
                          <div>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em]">{isZh ? "市值" : "MCap"}</p>
                            <p className="mt-0.5 font-medium text-foreground">{formatUsd(m.marketCapUsd, { compact: true })}</p>
                          </div>
                          <div>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em]">{isZh ? "24h 量" : "Vol 24h"}</p>
                            <p className="mt-0.5 font-medium text-foreground">{formatUsd(m.volume24hUsd, { compact: true })}</p>
                          </div>
                          <div>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em]">{isZh ? "持有人" : "Holders"}</p>
                            <p className="mt-0.5 font-medium text-foreground">{formatInt(m.holders)}</p>
                          </div>
                          <div>
                            <p className="text-[0.6rem] font-semibold uppercase tracking-[0.08em]">{isZh ? "时长" : "Age"}</p>
                            <p className="mt-0.5 font-medium text-foreground">{formatRelativeAge(m.ageHours)}</p>
                          </div>
                        </div>
                      </button>
                    </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-3 border-t border-border/45 bg-muted/[0.12] px-3 py-4 sm:px-6">
              <div className="flex flex-col gap-1 text-[0.7rem] text-muted-foreground sm:text-xs">
                <p>
                  <span className="font-medium text-foreground/90">
                    {isZh ? "第 " : "Page "}
                    {pageFromUrl}
                    <span>
                      {" "}
                      {isZh ? `/ ${formatInt(totalPages)}` : `of ${formatInt(totalPages)}`}
                    </span>
                  </span>
                  <span className="text-muted-foreground/85">
                    {" "}
                    · {formatInt(totalRows)} {isZh ? "条（筛选后）" : "markets (filtered)"}
                  </span>
                </p>
                <p>
                  {isZh ? "显示" : "Showing"}{" "}
                  <span className="font-medium text-foreground/90">
                    {markets.length ? `${formatInt(rangeStart)}–${formatInt(rangeEnd)}` : "0"}
                  </span>
                  {totalRows > 0 ? (
                    <>
                      {" "}
                      {isZh ? "条，共" : "of"} {formatInt(totalRows)}
                    </>
                  ) : null}
                  <span className="text-muted-foreground/85">
                    {" "}
                    · {TRENDING_PAGE_SIZE} {isZh ? "条/页" : "/ page"}
                    {sortKey === "trending"
                      ? isZh
                        ? " · 综合热门分"
                        : " · Trending rank"
                      : ""}
                  </span>
                  {isFetching ? (isZh ? " · 刷新中…" : " · Refreshing...") : ""}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                  {pageItems.map((item, idx) =>
                    item === "gap" ? (
                      <span key={`g-${idx}`} className="px-1.5 text-muted-foreground">
                        …
                      </span>
                    ) : (
                      <Button
                        key={item}
                        type="button"
                        variant={item === pageFromUrl ? "secondary" : "ghost"}
                        size="sm"
                        className={cn(
                          "h-9 min-w-[2.25rem] shrink-0 rounded-lg px-2 text-xs tabular-nums",
                          item === pageFromUrl && "pointer-events-none",
                        )}
                        disabled={isFetching}
                        onClick={() => setPage(item)}
                      >
                        {item}
                      </Button>
                    ),
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pageFromUrl <= 1 || isFetching}
                    onClick={() => setPage(pageFromUrl - 1)}
                    className="h-9 gap-1 rounded-lg px-3 text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> {isZh ? "上一页" : "Prev"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canGoNext || isFetching}
                    onClick={() => setPage(pageFromUrl + 1)}
                    className="h-9 gap-1 rounded-lg px-3 text-xs"
                  >
                    {isZh ? "下一页" : "Next"} <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </GlassCard>
    </section>
  );
}
