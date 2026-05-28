import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Coins,
  Command,
  Database,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { fetchMintDossier, parseAssetLookupInput } from "@/lib/tokensDossierApi";
import { formatCompactUsd, formatPct } from "@/lib/dashboardOverviewAggregates";
import {
  assetDetailPath,
  defaultAssetSortOrder,
  filterAssetRows,
  mean,
  priceLabel,
  sortAssetRows,
  type AssetClass,
  type AssetSortKey,
  type AssetSortOrder,
  type AssetTableRow,
} from "@/lib/assetsHub";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { AssetsCommandPalette } from "@/components/assets/AssetsCommandPalette";
import { AssetsSortableHeader } from "@/components/assets/AssetsSortableHeader";
import { AssetsTableSkeleton } from "@/components/assets/AssetsTableSkeleton";

const ASSET_PRESETS = [
  { ref: "btc", label: "Bitcoin", assetClass: "crypto" as const },
  { ref: "sol", label: "Solana", assetClass: "crypto" as const },
  { ref: "eth", label: "Ethereum", assetClass: "crypto" as const },
  { ref: "bonk", label: "Bonk", assetClass: "crypto" as const },
  { ref: "jup", label: "Jupiter", assetClass: "crypto" as const },
  { ref: "tsla", label: "Tesla", assetClass: "equity" as const },
  { ref: "nvda", label: "NVIDIA", assetClass: "equity" as const },
  { ref: "aapl", label: "Apple", assetClass: "equity" as const },
  { ref: "msft", label: "Microsoft", assetClass: "equity" as const },
  { ref: "amzn", label: "Amazon", assetClass: "equity" as const },
];

function classifyAsset(
  category: string | undefined,
  fallback: AssetClass,
): AssetClass {
  const c = category?.toLowerCase() ?? "";
  if (c.includes("stock") || c.includes("equity")) return "equity";
  return fallback;
}

export default function AssetsPage({ embedded }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [tableQuery, setTableQuery] = useState("");
  const [assetFilter, setAssetFilter] = useState<"all" | AssetClass>("all");
  const [sortKey, setSortKey] = useState<AssetSortKey>("marketCap");
  const [sortOrder, setSortOrder] = useState<AssetSortOrder>("desc");
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const tableRef = useRef<HTMLDivElement>(null);

  const assetsQ = useQuery({
    queryKey: ["assets-hub", "table-v2"],
    queryFn: async (): Promise<AssetTableRow[]> => {
      const settled = await Promise.allSettled(
        ASSET_PRESETS.map(async (preset) => {
          const payload = await fetchMintDossier({ ref: preset.ref });
          const stats = payload.asset?.stats;
          return {
            key: payload.assetId,
            ref: preset.ref,
            name: payload.asset?.name || preset.label,
            symbol: payload.asset?.symbol || preset.ref.toUpperCase(),
            assetClass: classifyAsset(payload.asset?.category, preset.assetClass),
            price: stats?.price ?? payload.asset?.canonicalMarket?.price,
            change24h: stats?.priceChange24hPercent,
            marketCap: stats?.marketCap ?? payload.asset?.canonicalMarket?.marketCap,
            volume24h: stats?.volume24hUSD ?? payload.asset?.canonicalMarket?.volume24hUSD,
            liquidity: stats?.liquidity,
            imageUrl: payload.asset?.imageUrl,
            payload,
          } satisfies AssetTableRow;
        }),
      );
      return settled
        .filter((item): item is PromiseFulfilledResult<AssetTableRow> => item.status === "fulfilled")
        .map((item) => item.value);
    },
    staleTime: 120_000,
  });

  const filteredRows = useMemo(() => {
    const rows = assetsQ.data ?? [];
    return filterAssetRows(rows, { assetClass: assetFilter, query: tableQuery });
  }, [assetsQ.data, assetFilter, tableQuery]);

  const sortedRows = useMemo(
    () => sortAssetRows(filteredRows, sortKey, sortOrder),
    [filteredRows, sortKey, sortOrder],
  );

  const boardStats = useMemo(() => {
    const marketCap = filteredRows.reduce((sum, row) => sum + (row.marketCap ?? 0), 0);
    const volume = filteredRows.reduce((sum, row) => sum + (row.volume24h ?? 0), 0);
    const avgChange = mean(
      filteredRows.map((row) => row.change24h).filter((value): value is number => value != null),
    );
    return { count: filteredRows.length, totalMarketCap: marketCap, totalVolume: volume, avgChange };
  }, [filteredRows]);

  const onSort = useCallback((key: AssetSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
        return prev;
      }
      setSortOrder(defaultAssetSortOrder(key));
      return key;
    });
  }, []);

  const openDetailFromInput = () => {
    const parsed = parseAssetLookupInput(input);
    if (!parsed) return;
    const sp = new URLSearchParams();
    if (parsed.ref) sp.set("ref", parsed.ref);
    if (parsed.assetId) sp.set("assetId", parsed.assetId);
    if (parsed.mint) sp.set("mint", parsed.mint);
    if (parsed.q) sp.set("q", parsed.q);
    navigate(`/assets/lookup?${sp.toString()}`);
  };

  useEffect(() => {
    setFocusedRowIndex(-1);
  }, [sortedRows.length, tableQuery, assetFilter]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (sortedRows.length === 0) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRowIndex((i) => Math.min(i + 1, sortedRows.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedRowIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && focusedRowIndex >= 0) {
        e.preventDefault();
        navigate(assetDetailPath(sortedRows[focusedRowIndex]));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sortedRows, focusedRowIndex, navigate]);

  useEffect(() => {
    if (focusedRowIndex < 0 || !tableRef.current) return;
    const row = tableRef.current.querySelector(`[data-row-index="${focusedRowIndex}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedRowIndex]);

  return (
    <div className={cn("relative min-h-full", embedded && "min-h-0")}>
      <OverviewPageBackdrop />
      <AssetsCommandPalette rows={assetsQ.data ?? []} />

      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM,
          "relative z-[1] pb-14",
        )}
      >
        <header className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className={overviewKickerClass}>Intelligence</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Assets</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
              Institutional-grade market board for crypto and equities. Sort, filter, and jump with{" "}
              <kbd className="rounded border border-border/70 bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">
                ⌘K
              </kbd>
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-2 rounded-full border-border/60 bg-background/60"
              onClick={() => assetsQ.refetch()}
              disabled={assetsQ.isFetching}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", assetsQ.isFetching && "animate-spin")} aria-hidden />
              Refresh
            </Button>
            <Badge variant="outline" className="h-8 gap-1 rounded-full px-3 text-xs font-medium">
              <Command className="h-3.5 w-3.5" aria-hidden />
              ⌘K jump
            </Badge>
            <Badge variant="outline" className="h-8 gap-1 rounded-full px-3 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              Syra dossier
            </Badge>
          </div>
        </header>

        <div className="mb-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {(
            [
              { label: "Universe", value: boardStats.count, format: (n: number) => String(n), sub: "In view" },
              {
                label: "Market cap",
                value: boardStats.totalMarketCap,
                format: formatCompactUsd,
                sub: "Aggregate",
              },
              {
                label: "24h notional",
                value: boardStats.totalVolume,
                format: formatCompactUsd,
                sub: "Volume",
              },
              {
                label: "Breadth",
                value: boardStats.avgChange,
                format: formatPct,
                sub: "Avg 24h",
                delta: true,
              },
            ] as const
          ).map((stat, i) => (
            <Card
              key={stat.label}
              className={cn(
                overviewCardShell,
                "border-border/60 bg-card/70 animate-in fade-in slide-in-from-bottom-3 fill-mode-both",
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardContent className="pt-5">
                <p className={overviewKickerClass}>{stat.label}</p>
                <p className="mt-1 text-2xl font-semibold">
                  <AnimatedMetric
                    value={stat.value}
                    format={stat.format}
                    deltaMode={"delta" in stat && stat.delta}
                  />
                </p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card
          className={cn(
            overviewCardShell,
            "mb-6 border-border/60 bg-card/75 backdrop-blur-sm animate-in fade-in duration-500",
          )}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Search and investigate</CardTitle>
            <CardDescription>
              Open any symbol, mint, or asset id. Table supports inline filter plus{" "}
              <span className="font-mono text-foreground/80">j</span> /{" "}
              <span className="font-mono text-foreground/80">k</span> row navigation.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 lg:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") openDetailFromInput();
                  }}
                  placeholder="Global lookup: btc, tsla, mint…"
                  className="h-11 border-border/70 bg-background/80 pl-10 font-mono shadow-sm"
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <Button type="button" className="h-11 gap-2 shrink-0" disabled={!input.trim()} onClick={openDetailFromInput}>
                <Search className="h-4 w-4" aria-hidden />
                Open dossier
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  value={tableQuery}
                  onChange={(e) => setTableQuery(e.target.value)}
                  placeholder="Filter board…"
                  className="h-9 border-border/60 bg-background/50 pl-9 text-sm"
                  aria-label="Filter assets table"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {(["all", "crypto", "equity"] as const).map((f) => (
                  <Button
                    key={f}
                    type="button"
                    variant={assetFilter === f ? "secondary" : "outline"}
                    size="sm"
                    className="h-9 rounded-full px-3.5"
                    onClick={() => setAssetFilter(f === "all" ? "all" : f)}
                  >
                    {f === "all" ? "All" : f === "crypto" ? "Crypto" : "Stocks"}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(overviewCardShell, "overflow-hidden border-border/60 bg-card/80 backdrop-blur-sm")}>
          <CardHeader className="border-b border-border/45 pb-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Market board</CardTitle>
                <CardDescription>
                  Sticky headers · sortable columns · {sortedRows.length} assets
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="h-7 gap-1 rounded-full border border-border/55 px-2.5 text-[11px]">
                  <BarChart3 className="h-3.5 w-3.5" aria-hidden />
                  Terminal
                </Badge>
                <Badge variant="secondary" className="h-7 gap-1 rounded-full border border-border/55 px-2.5 text-[11px]">
                  <Database className="h-3.5 w-3.5" aria-hidden />
                  Live
                </Badge>
                <Badge variant="secondary" className="h-7 gap-1 rounded-full border border-border/55 px-2.5 text-[11px]">
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  Sort: {sortKey}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {assetsQ.isLoading ? (
              <AssetsTableSkeleton />
            ) : assetsQ.isError ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-destructive">Could not load assets board.</p>
                <Button type="button" variant="outline" className="mt-4 h-9 rounded-xl" onClick={() => assetsQ.refetch()}>
                  Retry
                </Button>
              </div>
            ) : sortedRows.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm font-medium">No assets match</p>
                <p className="mt-1 text-xs text-muted-foreground">Clear filters or use global lookup above.</p>
              </div>
            ) : (
              <div
                ref={tableRef}
                className={cn(
                  "max-h-[min(68vh,680px)] overflow-auto scrollbar-thin",
                  assetsQ.isFetching && !assetsQ.isLoading && "opacity-70 transition-opacity",
                )}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <AssetsSortableHeader
                        label="Asset"
                        sortKey="name"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        className="min-w-[200px]"
                      />
                      <AssetsSortableHeader
                        label="Class"
                        sortKey="assetClass"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                      />
                      <AssetsSortableHeader
                        label="Price"
                        sortKey="price"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        align="right"
                      />
                      <AssetsSortableHeader
                        label="24h"
                        sortKey="change24h"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        align="right"
                      />
                      <AssetsSortableHeader
                        label="Mkt cap"
                        sortKey="marketCap"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        align="right"
                      />
                      <AssetsSortableHeader
                        label="Volume"
                        sortKey="volume24h"
                        activeKey={sortKey}
                        order={sortOrder}
                        onSort={onSort}
                        align="right"
                      />
                      <TableHead className="sticky top-0 z-20 h-11 w-12 border-b border-border/50 bg-card/95 backdrop-blur-md" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRows.map((row, index) => {
                      const href = assetDetailPath(row);
                      const isFocused = index === focusedRowIndex;
                      const classLabel = row.assetClass === "equity" ? "Stock" : "Crypto";
                      return (
                        <TableRow
                          key={row.key}
                          data-row-index={index}
                          className={cn(
                            "group/row cursor-pointer border-border/40 transition-colors duration-150",
                            isFocused
                              ? "bg-primary/[0.08] ring-1 ring-inset ring-primary/25"
                              : "hover:bg-muted/25",
                          )}
                          onClick={() => navigate(href)}
                          onMouseEnter={() => setFocusedRowIndex(index)}
                        >
                          <TableCell className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 shrink-0 rounded-lg border border-border/50">
                                {row.imageUrl ? (
                                  <AvatarImage src={row.imageUrl} alt="" className="object-cover" />
                                ) : null}
                                <AvatarFallback className="rounded-lg bg-muted/40 text-[10px] font-semibold">
                                  {row.symbol.slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <span className="block truncate font-medium">{row.name}</span>
                                <span className="font-mono text-[11px] text-muted-foreground">{row.symbol}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="h-6 gap-1 rounded-full px-2 text-[11px]">
                              {row.assetClass === "equity" ? (
                                <Building2 className="h-3 w-3" aria-hidden />
                              ) : (
                                <Coins className="h-3 w-3" aria-hidden />
                              )}
                              {classLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            <AnimatedMetric value={row.price} format={priceLabel} />
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-right text-sm",
                              row.change24h != null && row.change24h >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : row.change24h != null
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-muted-foreground",
                            )}
                          >
                            <AnimatedMetric
                              value={row.change24h}
                              format={formatPct}
                              deltaMode
                            />
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            <AnimatedMetric value={row.marketCap} format={formatCompactUsd} />
                          </TableCell>
                          <TableCell className="text-right text-sm">
                            <AnimatedMetric value={row.volume24h} format={formatCompactUsd} />
                          </TableCell>
                          <TableCell className="py-3">
                            <Link
                              to={href}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              aria-label={`Open ${row.symbol}`}
                            >
                              <ArrowUpRight className="h-4 w-4 transition-transform group-hover/row:translate-x-0.5 group-hover/row:-translate-y-0.5" />
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            <kbd className="rounded border border-border/60 bg-muted/40 px-1 font-mono">j</kbd> /{" "}
            <kbd className="rounded border border-border/60 bg-muted/40 px-1 font-mono">k</kbd> navigate ·{" "}
            <kbd className="rounded border border-border/60 bg-muted/40 px-1 font-mono">↵</kbd> open
          </span>
          <a
            href="https://docs.tokens.xyz/v1/quickstart"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            Data by Tokens.xyz
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </div>
  );
}
