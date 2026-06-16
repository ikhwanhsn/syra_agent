import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "@/lib/navigation";
import { ExternalLink, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { assetLookupPath } from "@/lib/assetsSearchApi";
import { parseAssetLookupInput } from "@/lib/tokensDossierApi";
import { useAssetsHubRows } from "@/hooks/useAssetsHubRows";
import { useTablePagination } from "@/hooks/useTablePagination";
import { formatCompactUsd, formatPct } from "@/lib/dashboardOverviewAggregates";
import {
  assetDetailPath,
  defaultAssetSortOrder,
  filterAssetRows,
  priceLabel,
  sortAssetRows,
  type AssetClass,
  type AssetSortKey,
  type AssetSortOrder,
} from "@/lib/assetsHub";
import { AnimatedMetric } from "@/components/assets/AnimatedMetric";
import { AssetsCommandPalette } from "@/components/assets/AssetsCommandPalette";
import { AssetsSortableHeader } from "@/components/assets/AssetsSortableHeader";
import { AssetsTableSkeleton } from "@/components/assets/AssetsTableSkeleton";
import { PremiumTablePagination } from "@/components/experiment/PremiumTablePagination";

const ASSETS_PAGE_SIZE = 10;

const FILTER_TABS: { id: "all" | AssetClass; label: string }[] = [
  { id: "all", label: "All" },
  { id: "crypto", label: "Crypto" },
  { id: "equity", label: "Stocks" },
];

export default function AssetsPage({ embedded }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q")?.trim() ?? "");
  const [assetFilter, setAssetFilter] = useState<"all" | AssetClass>("all");
  const [sortKey, setSortKey] = useState<AssetSortKey>("marketCap");
  const [sortOrder, setSortOrder] = useState<AssetSortOrder>("desc");
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const tableRef = useRef<HTMLDivElement>(null);

  const assetsQ = useAssetsHubRows();

  useEffect(() => {
    const q = searchParams.get("q")?.trim();
    if (q) setQuery(q);
  }, [searchParams]);

  const filteredRows = useMemo(() => {
    const rows = assetsQ.data ?? [];
    return filterAssetRows(rows, { assetClass: assetFilter, query });
  }, [assetsQ.data, assetFilter, query]);

  const sortedRows = useMemo(
    () => sortAssetRows(filteredRows, sortKey, sortOrder),
    [filteredRows, sortKey, sortOrder],
  );

  const pagination = useTablePagination(sortedRows, ASSETS_PAGE_SIZE);
  const pageRows = pagination.slice;

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

  const submitQuery = () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const parsed = parseAssetLookupInput(trimmed);
    if (parsed && (parsed.mint || parsed.assetId || trimmed.includes("/") || trimmed.includes("."))) {
      navigate(assetLookupPath(trimmed));
      return;
    }

    const exact = sortedRows.find(
      (row) =>
        row.symbol.toLowerCase() === trimmed.toLowerCase() ||
        row.ref.toLowerCase() === trimmed.toLowerCase() ||
        row.payload.assetId.toLowerCase() === trimmed.toLowerCase(),
    );
    if (exact) {
      navigate(assetDetailPath(exact));
    }
  };

  useEffect(() => {
    setFocusedRowIndex(-1);
  }, [pageRows.length, query, assetFilter, pagination.page]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (pageRows.length === 0) return;

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedRowIndex((i) => Math.min(i + 1, pageRows.length - 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedRowIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && focusedRowIndex >= 0) {
        e.preventDefault();
        navigate(assetDetailPath(pageRows[focusedRowIndex]));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [pageRows, focusedRowIndex, navigate]);

  useEffect(() => {
    if (focusedRowIndex < 0 || !tableRef.current) return;
    const row = tableRef.current.querySelector(`[data-row-index="${focusedRowIndex}"]`);
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusedRowIndex]);

  useEffect(() => {
    tableRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [pagination.page]);

  return (
    <div className={cn("relative min-h-full", embedded && "min-h-0")}>
      <OverviewPageBackdrop />
      <AssetsCommandPalette rows={assetsQ.data ?? []} />

      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM,
          "relative z-[1] pb-10",
        )}
      >
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Assets</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {assetsQ.isLoading
                ? "Loading market data…"
                : `${pagination.totalItems.toLocaleString()} assets from Tokens.xyz`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={() => assetsQ.refetch()}
            disabled={assetsQ.isFetching}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", assetsQ.isFetching && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        </header>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitQuery();
              }}
              placeholder="Search symbol, name, or mint…"
              className="h-10 bg-background/80 pl-10"
              autoComplete="off"
              spellCheck={false}
              aria-label="Search assets"
            />
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border/60 bg-muted/30 p-1">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAssetFilter(tab.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  assetFilter === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Card className={cn(overviewCardShell, "overflow-hidden border-border/60 bg-card/80")}>
          <CardContent className="p-0">
            {assetsQ.isLoading ? (
              <AssetsTableSkeleton rows={ASSETS_PAGE_SIZE} />
            ) : assetsQ.isError ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm font-medium text-destructive">Could not load assets.</p>
                <Button type="button" variant="outline" className="mt-4 h-9" onClick={() => assetsQ.refetch()}>
                  Retry
                </Button>
              </div>
            ) : sortedRows.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <p className="text-sm font-medium">No assets match</p>
                <p className="mt-1 text-xs text-muted-foreground">Try a different search or filter.</p>
              </div>
            ) : (
              <>
                <div
                  ref={tableRef}
                  className={cn(
                    "overflow-x-auto",
                    assetsQ.isFetching && !assetsQ.isLoading && "opacity-70 transition-opacity",
                  )}
                >
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <AssetsSortableHeader
                          label="Asset"
                          sortKey="name"
                          activeKey={sortKey}
                          order={sortOrder}
                          onSort={onSort}
                          className="min-w-[180px] pl-4"
                        />
                        <AssetsSortableHeader
                          label="Type"
                          sortKey="assetClass"
                          activeKey={sortKey}
                          order={sortOrder}
                          onSort={onSort}
                          className="hidden sm:table-cell"
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
                          className="hidden md:table-cell"
                        />
                        <AssetsSortableHeader
                          label="Volume"
                          sortKey="volume24h"
                          activeKey={sortKey}
                          order={sortOrder}
                          onSort={onSort}
                          align="right"
                          className="hidden lg:table-cell pr-4"
                        />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pageRows.map((row, index) => {
                        const isFocused = index === focusedRowIndex;
                        return (
                          <TableRow
                            key={row.key}
                            data-row-index={index}
                            className={cn(
                              "cursor-pointer border-border/40 transition-colors",
                              isFocused ? "bg-muted/50" : "hover:bg-muted/30",
                            )}
                            onClick={() => navigate(assetDetailPath(row))}
                            onMouseEnter={() => setFocusedRowIndex(index)}
                          >
                            <TableCell className="py-2.5 pl-4">
                              <div className="flex items-center gap-2.5">
                                <Avatar className="h-8 w-8 shrink-0 rounded-md border border-border/40">
                                  {row.imageUrl ? (
                                    <AvatarImage src={row.imageUrl} alt="" className="object-cover" />
                                  ) : null}
                                  <AvatarFallback className="rounded-md bg-muted/50 text-[10px] font-medium">
                                    {row.symbol.slice(0, 2)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <span className="block truncate text-sm font-medium">{row.name}</span>
                                  <span className="text-xs text-muted-foreground">{row.symbol}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                              {row.assetClass === "equity" ? "Stock" : "Crypto"}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">
                              <AnimatedMetric value={row.price} format={priceLabel} />
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-right text-sm tabular-nums",
                                row.change24h != null && row.change24h >= 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : row.change24h != null
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-muted-foreground",
                              )}
                            >
                              <AnimatedMetric value={row.change24h} format={formatPct} deltaMode />
                            </TableCell>
                            <TableCell className="hidden text-right text-sm tabular-nums md:table-cell">
                              <AnimatedMetric value={row.marketCap} format={formatCompactUsd} />
                            </TableCell>
                            <TableCell className="hidden text-right text-sm tabular-nums lg:table-cell pr-4">
                              <AnimatedMetric value={row.volume24h} format={formatCompactUsd} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <PremiumTablePagination
                  page={pagination.page}
                  pageSize={pagination.pageSize}
                  totalItems={pagination.totalItems}
                  onPageChange={pagination.setPage}
                  onPageSizeChange={pagination.setPageSize}
                  pageSizeOptions={[10, 20, 50]}
                  loading={assetsQ.isFetching && !assetsQ.isLoading}
                  itemLabel="assets"
                />
              </>
            )}
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <a
            href="https://docs.tokens.xyz/v1/quickstart"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            Data by Tokens.xyz
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        </p>
      </div>
    </div>
  );
}
