import { useCallback, useMemo, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { OverviewPageBackdrop } from "@/components/dashboard/overview/OverviewPageBackdrop";
import { AlphaTechTable, AlphaTechTableSkeleton } from "@/components/alphatech/AlphaTechTable";
import { PremiumTablePagination } from "@/components/experiment/PremiumTablePagination";
import { useWalletContext } from "@/contexts/WalletContext";
import { isAdminWallet } from "@/constants/adminWallet";
import {
  alphaTechScreenerSummary,
  useAlphaTechScreener,
} from "@/hooks/useAlphaTechScreener";
import {
  filterAlphaTechRows,
  sortAlphaTechRows,
  type AlphaTechSortKey,
  type AlphaTechSortOrder,
} from "@/lib/alphaTechScreenerApi";
import { formatCompactUsd } from "@/lib/dashboardOverviewAggregates";
import { useTablePagination } from "@/hooks/useTablePagination";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 100;

type MatchFilter = "all" | "matched" | "unmatched";

const FILTER_TABS: { id: MatchFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "matched", label: "Matched" },
  { id: "unmatched", label: "Unmatched" },
];

function defaultSortOrder(key: AlphaTechSortKey): AlphaTechSortOrder {
  return key === "teamName" || key === "symbol" ? "asc" : "desc";
}

export default function AlphaTechPage() {
  const { address, connected } = useWalletContext();
  const allowed = isAdminWallet(connected, address);
  const screenerQ = useAlphaTechScreener(allowed);

  const [query, setQuery] = useState("");
  const [matchFilter, setMatchFilter] = useState<MatchFilter>("all");
  const [sortKey, setSortKey] = useState<AlphaTechSortKey>("liquidityUsd");
  const [sortOrder, setSortOrder] = useState<AlphaTechSortOrder>("desc");

  const filteredRows = useMemo(() => {
    const rows = screenerQ.data ?? [];
    return filterAlphaTechRows(rows, query, matchFilter);
  }, [screenerQ.data, query, matchFilter]);

  const sortedRows = useMemo(
    () => sortAlphaTechRows(filteredRows, sortKey, sortOrder),
    [filteredRows, sortKey, sortOrder],
  );

  const pagination = useTablePagination(sortedRows, PAGE_SIZE);
  const summary = alphaTechScreenerSummary(screenerQ.data);

  const onSort = useCallback((key: AlphaTechSortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
        return prev;
      }
      setSortOrder(defaultSortOrder(key));
      return key;
    });
  }, []);

  return (
    <div className="relative min-h-full">
      <OverviewPageBackdrop />

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
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">AlphaTech</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {screenerQ.isLoading
                ? "Resolving tokens on DexScreener (Solana)…"
                : `${summary.matchedCount} of ${summary.total} teams matched · verify via DexScreener links`}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={() => void screenerQ.refetch()}
            disabled={screenerQ.isFetching}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", screenerQ.isFetching && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        </header>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Matched</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {summary.matchedCount}
                <span className="text-base font-normal text-muted-foreground"> / {summary.total}</span>
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total liquidity</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {formatCompactUsd(summary.totalLiquidity)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60 bg-card/50">
            <CardContent className="p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Vol 24h (matched)</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {formatCompactUsd(summary.totalVolume)}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team, symbol, or address…"
              className="h-10 pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                size="sm"
                variant={matchFilter === tab.id ? "default" : "outline"}
                className="h-9"
                onClick={() => setMatchFilter(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        {screenerQ.isLoading ? (
          <AlphaTechTableSkeleton rows={PAGE_SIZE} />
        ) : screenerQ.isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
            Failed to load screener data. Try refreshing.
          </div>
        ) : (
          <>
            <AlphaTechTable
              rows={pagination.slice}
              sortKey={sortKey}
              sortOrder={sortOrder}
              onSort={onSort}
            />
            <PremiumTablePagination
              className="mt-4"
              page={pagination.page}
              totalItems={pagination.totalItems}
              pageSize={PAGE_SIZE}
              onPageChange={pagination.setPage}
              itemLabel="teams"
            />
          </>
        )}
      </div>
    </div>
  );
}
