import { useDeferredValue, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, Share2, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRiseMarketsAll, useRiseMarketsTop, useRiseOhlcBatch } from "@/lib/RiseDashboardContext";
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
import { MarketSparkline } from "@/components/rise/MarketSparkline";
import {
  computeAlphaScore,
  computeNarrativeTags,
  computeRiskFlags,
  enrichMarket,
  rankByAlpha,
} from "./IntelligenceEngine";
import { ShareTokenDialog } from "./ShareTokenDialog";
import { AlphaCell, NarrativeCell, RiskCell } from "./IntelligenceColumns";
import type { NarrativeTag, RiskFlag, RankedMarket } from "./types";
import { useLanguage } from "@/lib/LanguageContext";
import { DASHBOARD_COPY } from "@/lib/dashboardI18n";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;
/** Full-universe sync walks many upstream pages; wide interval avoids hammering the API. */
const TERMINAL_TABLE_REFETCH_MS = 180_000;
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

function ShareIconButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="h-7 w-7 shrink-0 rounded-md border-border/55 bg-background/40 sm:h-8 sm:w-8"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Share2 className="h-3.5 w-3.5" aria-hidden />
    </Button>
  );
}

type TerminalScreenerProps = {
  onSelect: (market: RiseMarketRow) => void;
};

export function TerminalScreener({ onSelect }: TerminalScreenerProps) {
  const { language } = useLanguage();
  const copy = DASHBOARD_COPY[language];
  const marketsQuery = useRiseMarketsAll(150, { refetchInterval: TERMINAL_TABLE_REFETCH_MS });
  /** Snappy first paint: 100-row top set lands in one round trip while `all` walks paginated pages. */
  const topMarketsQuery = useRiseMarketsTop(100, { refetchInterval: TERMINAL_TABLE_REFETCH_MS });
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasFloorOnly, setHasFloorOnly] = useState(false);
  const [riskFilters, setRiskFilters] = useState<RiskFlag[]>([]);
  const [narrativeFilters, setNarrativeFilters] = useState<NarrativeTag[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("alpha");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [shareTarget, setShareTarget] = useState<RankedMarket | null>(null);

  const baseRows = useMemo(
    () => marketsQuery.data ?? topMarketsQuery.data ?? [],
    [marketsQuery.data, topMarketsQuery.data],
  );
  const enriched = useMemo(() => baseRows.map((market) => enrichMarket(market)), [baseRows]);

  const alphaRankByMint = useMemo(() => {
    const map = new Map<string, number>();
    rankByAlpha(baseRows).slice(0, 10).forEach((m, i) => {
      map.set(m.mint, i + 1);
    });
    return map;
  }, [baseRows]);

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

  const sparklineMints = useMemo(
    () =>
      pageRows
        .map((row) => row.market.marketAddress || row.market.mint)
        .filter((a): a is string => !!a && a.length >= 32),
    [pageRows],
  );
  useRiseOhlcBatch(sparklineMints);

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
    <GlassCard
      padded={false}
      className="border-border/40 shadow-[0_24px_56px_-30px_hsl(0_0%_0%/0.42),inset_0_1px_0_hsl(0_0%_100%/0.05)] dark:shadow-[0_28px_64px_-30px_hsl(0_0%_0%/0.58),inset_0_1px_0_hsl(0_0%_100%/0.04)]"
    >
      <div className="border-b border-border/35 bg-muted/[0.06] px-4 py-4 backdrop-blur-[2px] sm:px-6">
        <div
          className={cn(
            "flex flex-col gap-3 sm:flex-row sm:items-center",
            activeFilterCount > 0 || search ? "sm:justify-between" : "sm:justify-end",
          )}
        >
          {activeFilterCount > 0 || search ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-10 rounded-xl px-3 text-xs text-muted-foreground hover:text-foreground"
                onClick={clearFilters}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                {copy.terminal.clear}
              </Button>
            </div>
          ) : null}

          <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder={copy.terminal.searchPlaceholder}
                className="h-10 rounded-xl border-border/45 bg-background/60 pl-9 shadow-sm transition-shadow placeholder:text-muted-foreground/60 focus-visible:border-ring/40 focus-visible:ring-2 focus-visible:ring-ring/20"
              />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-10 shrink-0 gap-2 rounded-xl border-border/45 bg-background/40 px-3.5 shadow-sm transition-colors hover:bg-muted/20">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  <span>{copy.terminal.filters}</span>
                  {activeFilterCount > 0 ? (
                    <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1.5 text-[0.65rem] tabular-nums">
                      {activeFilterCount}
                    </Badge>
                  ) : null}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-[min(92vw,22rem)] max-h-[min(70vh,28rem)] overflow-y-auto border-border/40 p-4 shadow-2xl"
              >
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={verifiedOnly ? "default" : "outline"}
                        size="sm"
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={() => {
                          setVerifiedOnly((prev) => !prev);
                          setPage(1);
                        }}
                      >
                        {copy.terminal.verified}
                      </Button>
                      <Button
                        variant={hasFloorOnly ? "default" : "outline"}
                        size="sm"
                        className="h-8 rounded-full px-3 text-xs"
                        onClick={() => {
                          setHasFloorOnly((prev) => !prev);
                          setPage(1);
                        }}
                      >
                        {copy.terminal.floorBacked}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">{copy.terminal.riskFlags}</p>
                    <div className="flex flex-wrap gap-1.5">
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

                  <div>
                    <p className="mb-2 text-[0.62rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">{copy.terminal.narratives}</p>
                    <div className="flex flex-wrap gap-1.5">
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
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      <div className="hidden min-h-[34rem] md:block">
        <div className="overflow-x-hidden px-4 py-4 sm:px-6">
          {/*
            Plain <table> (not shadcn Table): the shared Table component wraps with overflow-auto,
            which always shows a horizontal scrollbar gutter when content is tight — bad UX here.
            Full narrative / floor / holders / age live in the row drawer; keep the grid lean.
          */}
          <table className="w-full table-fixed border-collapse text-sm">
            <TableHeader className="bg-muted/[0.05] [&_tr]:border-border/30 [&_tr:hover]:!bg-transparent">
              <TableRow className="border-border/30">
                <TableHead className="h-11 w-8 px-2 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  #
                </TableHead>
                <TableHead className="h-11 w-[18%] px-2 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {copy.terminal.token}
                </TableHead>
                <TableHead className="h-11 px-2 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setSort("alpha")}
                    className="inline-flex max-w-full items-center gap-1 truncate rounded-md px-1 py-0.5 transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    {copy.terminal.alpha} <SortIcon active={sortKey === "alpha"} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="h-11 px-2 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {copy.terminal.price}
                </TableHead>
                <TableHead className="h-11 px-2 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {copy.terminal.h24}
                </TableHead>
                <TableHead className="h-11 min-w-[6rem] px-2 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {language === "zh" ? "走势" : "Trend"}
                </TableHead>
                <TableHead className="h-11 px-2 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setSort("volume24hUsd")}
                    className="inline-flex max-w-full items-center gap-1 truncate rounded-md px-1 py-0.5 transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    {copy.terminal.vol24hLabel} <SortIcon active={sortKey === "volume24hUsd"} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="h-11 px-2 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => setSort("marketCapUsd")}
                    className="inline-flex max-w-full items-center gap-1 truncate rounded-md px-1 py-0.5 transition-colors hover:bg-muted/50 hover:text-foreground"
                  >
                    {copy.terminal.mcapLabel} <SortIcon active={sortKey === "marketCapUsd"} dir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="h-11 px-2 py-2 text-left text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {copy.terminal.risk}
                </TableHead>
                <TableHead className="h-11 min-w-[5.5rem] px-2 py-2 text-right text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {copy.terminal.actions}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {marketsQuery.isPending && pageRows.length === 0
                ? Array.from({ length: 14 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell className="px-2 py-2" colSpan={10}>
                        <Skeleton className="h-8 w-full rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                : pageRows.map((row, idx) => (
                    <TableRow
                      key={row.market.mint}
                      className="cursor-pointer border-border/25 transition-colors duration-150 hover:bg-muted/[0.12]"
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
                      <TableCell className="px-2 py-2">
                        <MarketSparkline
                          address={row.market.marketAddress || row.market.mint}
                          changePct={row.market.priceChange24hPct}
                          width={80}
                          height={24}
                        />
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
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <ShareIconButton label={copy.terminal.share} onClick={() => setShareTarget(row)} />
                          <RiseTradeButton mint={row.market.mint} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </table>
        </div>
      </div>

      <div className="space-y-2.5 px-4 py-4 md:hidden sm:px-6">
        {marketsQuery.isPending && pageRows.length === 0
          ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={`m-${i}`} className="h-24 w-full rounded-xl" />)
          : pageRows.map((row) => (
              <div
                key={row.market.mint}
                className="flex min-h-0 w-full overflow-hidden rounded-xl border border-border/40 bg-background/25 shadow-sm"
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 flex-col gap-2 p-3.5 text-left transition-colors hover:bg-muted/10 active:bg-muted/15"
                  onClick={() => onSelect(row.market)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <TokenAvatar imageUrl={row.market.imageUrl} symbol={row.market.symbol} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">${row.market.symbol || "—"}</p>
                        <p className="truncate text-[0.7rem] text-muted-foreground">{row.market.name || "—"}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold text-foreground">{formatPriceSmart(row.market.priceUsd)}</p>
                      <ChangePill pct={row.market.priceChange24hPct} className="mt-1" />
                    </div>
                  </div>
                  <div className="-mx-1 flex justify-end">
                    <MarketSparkline
                      address={row.market.marketAddress || row.market.mint}
                      changePct={row.market.priceChange24hPct}
                      width={120}
                      height={26}
                      showVerdict
                    />
                  </div>
                  <div className="grid gap-2">
                    <AlphaCell alpha={computeAlphaScore(row.market)} compact />
                    <RiskCell flags={computeRiskFlags(row.market)} />
                    <NarrativeCell tags={computeNarrativeTags(row.market)} />
                  </div>
                </button>
                <div className="flex shrink-0 flex-col items-center border-l border-border/35 bg-muted/[0.04] p-2 pt-3">
                  <ShareIconButton label={copy.terminal.share} onClick={() => setShareTarget(row)} />
                </div>
              </div>
            ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/35 bg-muted/[0.04] px-4 py-3.5 text-xs sm:px-6">
        {marketsQuery.isPending && baseRows.length === 0 ? (
          <Skeleton className="h-4 w-[min(100%,14rem)] rounded-md" aria-hidden />
        ) : (
          <p className="tabular-nums text-muted-foreground">
            {copy.terminal.showing}{" "}
            <span className="font-medium text-foreground">{pageRows.length}</span> {copy.terminal.of}{" "}
            <span className="font-medium text-foreground">{sorted.length}</span> {copy.terminal.markets}
          </p>
        )}
        <div className="flex items-center gap-1 rounded-xl border border-border/35 bg-background/30 p-1 shadow-inner">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-lg px-3"
            disabled={marketsQuery.isPending && baseRows.length === 0 ? true : safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {copy.terminal.prev}
          </Button>
          <span className="min-w-[3.25rem] px-2 text-center font-mono text-[0.7rem] tabular-nums text-muted-foreground">
            {marketsQuery.isPending && baseRows.length === 0 ? "—/—" : `${safePage}/${totalPages}`}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 rounded-lg px-3"
            disabled={marketsQuery.isPending && baseRows.length === 0 ? true : safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            {copy.terminal.next}
          </Button>
        </div>
      </div>

      <ShareTokenDialog
        open={shareTarget !== null}
        onOpenChange={(next) => {
          if (!next) setShareTarget(null);
        }}
        market={shareTarget?.market ?? null}
        alphaRank={shareTarget ? alphaRankByMint.get(shareTarget.market.mint) ?? null : null}
        alpha={shareTarget?.alpha ?? null}
        terminalCopy={copy.terminal}
      />
    </GlassCard>
  );
}
