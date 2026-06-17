import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  LayoutGrid,
  AlertCircle,
  MoreHorizontal,
  Trophy,
} from "lucide-react";

import { ThemeProvider } from "@/contexts/ThemeContext";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApplicationModal from "@/components/ApplicationModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallback, useState, type ReactNode } from "react";
import { S3LABS_ARENA_PROJECTS } from "@/lib/s3labs-arena-projects";
import {
  bestPairByMint,
  fetchSolanaTokenPairs,
  type DexScreenerPair,
} from "@/lib/dexscreener";
import { cn } from "@/lib/utils";
import MeteorEffect from "@/components/MeteorEffect";
import MouseEffects from "@/components/MouseEffects";
import { useTheme } from "@/contexts/ThemeContext";

const MINTS = S3LABS_ARENA_PROJECTS.map((p) => p.mint);

/** Rows per page for the Arena table. */
const ARENA_PAGE_SIZE = 10;

function getVisiblePageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const set = new Set<number>();
  set.add(1);
  set.add(total);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) set.add(i);
  }
  const sorted = [...set].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev > 0 && p - prev > 1) out.push("ellipsis");
    out.push(p);
    prev = p;
  }
  return out;
}

function formatUsd(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: n < 1 ? 6 : 2,
  }).format(n);
}

function formatCompactUsd(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function formatPct(n: number | undefined): string {
  if (n === undefined || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function truncateMint(mint: string): string {
  if (mint.length <= 12) return mint;
  return `${mint.slice(0, 4)}…${mint.slice(-4)}`;
}

function LeaderboardRankCell({ rank }: { rank: number }) {
  const tier = rank <= 3 ? rank : 0;
  return (
    <div className="flex items-center justify-center py-0.5">
      <span
        className={cn(
          "inline-flex items-center justify-center gap-1 min-w-[2.5rem] h-10 px-2 rounded-xl font-bold tabular-nums text-sm transition-colors",
          tier === 1 &&
            "bg-gradient-to-b from-amber-400/90 to-amber-600/85 text-amber-950 shadow-[0_0_24px_rgba(245,158,11,0.35)] border border-amber-300/60 dark:from-amber-500/35 dark:to-amber-700/50 dark:text-amber-50 dark:border-amber-400/35 dark:shadow-[0_0_28px_rgba(245,158,11,0.18)]",
          tier === 2 &&
            "bg-gradient-to-b from-slate-200/95 to-slate-400/85 text-slate-900 border border-slate-300/70 dark:from-slate-500/30 dark:to-slate-700/55 dark:text-slate-100 dark:border-slate-400/25",
          tier === 3 &&
            "bg-gradient-to-b from-orange-300/90 to-amber-800/75 text-orange-950 border border-orange-500/45 dark:from-orange-600/35 dark:to-amber-900/55 dark:text-orange-50 dark:border-orange-500/30",
          tier === 0 && "text-muted-foreground font-semibold bg-muted/40 border border-border/50",
        )}
      >
        {tier === 1 ? <Trophy className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden /> : null}
        {rank}
      </span>
    </div>
  );
}

function leaderboardRowClass(rank: number): string {
  if (rank === 1) {
    return "bg-gradient-to-r from-amber-500/[0.07] via-primary/[0.04] to-transparent dark:from-amber-400/[0.09] dark:via-primary/[0.05] hover:from-amber-500/[0.1]";
  }
  if (rank === 2) {
    return "bg-gradient-to-r from-slate-400/[0.08] via-transparent to-transparent dark:from-slate-400/[0.06] hover:from-slate-400/[0.11]";
  }
  if (rank === 3) {
    return "bg-gradient-to-r from-orange-600/[0.07] via-transparent to-transparent dark:from-orange-500/[0.07] hover:from-orange-600/[0.1]";
  }
  return "hover:bg-muted/35";
}

type ArenaRowData = {
  project: (typeof S3LABS_ARENA_PROJECTS)[number];
  pair: DexScreenerPair | null;
};

type ArenaSortKey =
  | "project"
  | "price"
  | "change24"
  | "volume24"
  | "liquidity"
  | "marketCap"
  | "dex"
  | "links";

const MINT_ORDER = new Map(S3LABS_ARENA_PROJECTS.map((p, i) => [p.mint, i]));

function projectSortLabel(row: ArenaRowData): string {
  return (row.pair?.baseToken.name ?? row.project.name).toLowerCase();
}

function getSortValue(row: ArenaRowData, key: ArenaSortKey): number | string | null {
  switch (key) {
    case "project":
      return projectSortLabel(row);
    case "price": {
      const n = row.pair ? Number.parseFloat(row.pair.priceUsd) : Number.NaN;
      return Number.isFinite(n) ? n : null;
    }
    case "change24": {
      const n = row.pair?.priceChange?.h24;
      return typeof n === "number" && !Number.isNaN(n) ? n : null;
    }
    case "volume24": {
      const n = row.pair?.volume?.h24;
      return typeof n === "number" && !Number.isNaN(n) ? n : null;
    }
    case "liquidity": {
      const n = row.pair?.liquidity?.usd;
      return typeof n === "number" && !Number.isNaN(n) ? n : null;
    }
    case "marketCap": {
      const n = row.pair?.marketCap;
      return typeof n === "number" && !Number.isNaN(n) ? n : null;
    }
    case "dex":
      return row.pair?.dexId ? row.pair.dexId.toLowerCase() : null;
    case "links":
      return row.pair?.url ? 1 : 0;
    default:
      return null;
  }
}

function tiebreakMint(a: ArenaRowData, b: ArenaRowData): number {
  return (MINT_ORDER.get(a.project.mint) ?? 0) - (MINT_ORDER.get(b.project.mint) ?? 0);
}

function compareRows(a: ArenaRowData, b: ArenaRowData, key: ArenaSortKey, dir: "asc" | "desc"): number {
  const va = getSortValue(a, key);
  const vb = getSortValue(b, key);

  if (key === "project") {
    const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: "base" });
    if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
    return tiebreakMint(a, b);
  }

  if (key === "dex") {
    const aMissing = va === null;
    const bMissing = vb === null;
    if (aMissing && bMissing) return tiebreakMint(a, b);
    if (aMissing) return 1;
    if (bMissing) return -1;
    const cmp = String(va).localeCompare(String(vb), undefined, { sensitivity: "base" });
    if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
    return tiebreakMint(a, b);
  }

  if (key === "links") {
    const cmp = Number(va) - Number(vb);
    if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
    return tiebreakMint(a, b);
  }

  const na = va as number | null;
  const nb = vb as number | null;
  const aMissing = na === null;
  const bMissing = nb === null;
  if (aMissing && bMissing) return tiebreakMint(a, b);
  if (aMissing) return 1;
  if (bMissing) return -1;
  const cmp = na! - nb!;
  if (cmp !== 0) return dir === "asc" ? cmp : -cmp;
  return tiebreakMint(a, b);
}

function sortArenaRows(rows: ArenaRowData[], key: ArenaSortKey, dir: "asc" | "desc"): ArenaRowData[] {
  return [...rows].sort((a, b) => compareRows(a, b, key, dir));
}

function defaultSortDir(key: ArenaSortKey): "asc" | "desc" {
  if (key === "project" || key === "dex") return "asc";
  return "desc";
}

function SortableTableHead({
  columnKey,
  sortKey,
  sortDir,
  onSort,
  className,
  buttonClassName,
  sortLabel,
  children,
}: {
  columnKey: ArenaSortKey;
  sortKey: ArenaSortKey;
  sortDir: "asc" | "desc";
  onSort: (key: ArenaSortKey) => void;
  className?: string;
  buttonClassName?: string;
  /** Accessible name for the sort control (plain text). */
  sortLabel: string;
  children: ReactNode;
}) {
  const active = sortKey === columnKey;
  return (
    <TableHead
      className={className}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1.5 font-medium text-muted-foreground hover:text-foreground transition-colors select-none -mx-2 px-2 py-1.5 rounded-md hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          active && "text-foreground",
          buttonClassName,
        )}
        onClick={() => onSort(columnKey)}
        aria-label={
          active
            ? `${sortLabel}, sorted ${sortDir === "asc" ? "ascending" : "descending"}, click to reverse`
            : `${sortLabel}, sort column`
        }
      >
        <span>{children}</span>
        {active ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-45" aria-hidden />
        )}
      </button>
    </TableHead>
  );
}

function ArenaTablePagination({
  page,
  totalPages,
  totalCount,
  onPageChange,
  t,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  t: (id: string, en: string) => string;
}) {
  const from = totalCount === 0 ? 0 : (page - 1) * ARENA_PAGE_SIZE + 1;
  const to = Math.min(page * ARENA_PAGE_SIZE, totalCount);
  const visible = getVisiblePageNumbers(page, totalPages);

  return (
    <div
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border/60 bg-muted/15 px-3 py-4 sm:px-4"
      role="navigation"
      aria-label={"Table pagination"}
    >
      <p className="text-sm text-muted-foreground tabular-nums text-center sm:text-left order-2 sm:order-1">
        {totalCount === 0
          ? "No rows"
          : `Showing ${from}–${to} of ${totalCount}`}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-1 order-1 sm:order-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1 px-2.5"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={"Previous page"}
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{"Prev"}</span>
        </Button>
        <div className="flex items-center gap-0.5 mx-1">
          {visible.map((item, idx) =>
            item === "ellipsis" ? (
              <span
                key={`ellipsis-${idx}`}
                className="flex h-9 w-9 items-center justify-center text-muted-foreground"
                aria-hidden
              >
                <MoreHorizontal className="h-4 w-4" />
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === page ? "default" : "ghost"}
                size="icon"
                className={cn("h-9 w-9", item === page && "pointer-events-none")}
                onClick={() => onPageChange(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
              >
                {item}
              </Button>
            ),
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1 px-2.5"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label={"Next page"}
        >
          <span className="hidden sm:inline">{"Next"}</span>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

const ArenaPageContent = () => {
  const { theme } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: ArenaSortKey; dir: "asc" | "desc" }>({
    key: "marketCap",
    dir: "desc",
  });
  const handleSort = useCallback((key: ArenaSortKey) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: defaultSortDir(key) },
    );
  }, []);

  const {
    data: pairs = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["dexscreener", "s3labs-arena", ...MINTS],
    queryFn: () => fetchSolanaTokenPairs(MINTS),
    staleTime: 60_000,
  });

  const pairByMint = useMemo(() => bestPairByMint(pairs), [pairs]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [sort.key, sort.dir]);

  const rows = useMemo(() => {
    const base: ArenaRowData[] = S3LABS_ARENA_PROJECTS.map((project) => ({
      project,
      pair: pairByMint.get(project.mint) ?? null,
    }));
    return sortArenaRows(base, sort.key, sort.dir);
  }, [pairByMint, sort.key, sort.dir]);

  const totalCount = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ARENA_PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * ARENA_PAGE_SIZE;
    return rows.slice(start, start + ARENA_PAGE_SIZE);
  }, [rows, safePage]);

  return (
    <div
      className={cn(
        "relative min-h-screen",
        theme === "light" ? "landing-light-bg" : "bg-background",
      )}
    >
      <MeteorEffect />
      <MouseEffects />
      <div className="relative z-10">
        <Header onApplyClick={() => setIsModalOpen(true)} />
        <main className="pt-20 lg:pt-24">
          <div className="border-b border-border bg-muted/20">
            <div className="container py-12 lg:py-16">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                {"Back to home"}
              </Link>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                      <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                      S3Labs
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      <Trophy className="w-3.5 h-3.5" aria-hidden />
                      {"Leaderboard"}
                    </span>
                  </div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
                    <span className="text-gradient">Arena</span>
                    <span className="text-foreground"> — </span>
                    <span className="text-foreground">
                      {"Ecosystem"}
                    </span>
                  </h1>
                  <p className="text-muted-foreground text-lg max-w-2xl">
                    {"S3Labs project rankings by market metrics — sort any column. Live data from DexScreener."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {dataUpdatedAt > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {"Updated"}{" "}
                      {new Intl.DateTimeFormat(undefined, {
                        timeStyle: "short",
                        dateStyle: "short",
                      }).format(new Date(dataUpdatedAt))}
                    </span>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => void refetch()}
                    disabled={isFetching}
                  >
                    <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
                    {"Refresh"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="container py-12 lg:py-20">
            {isError && (
              <div
                className="mb-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                role="alert"
              >
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">
                      {"Could not load market data"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {error instanceof Error ? error.message : "Please try again."}
                    </p>
                  </div>
                </div>
                <Button variant="outline" onClick={() => void refetch()}>
                  {"Retry"}
                </Button>
              </div>
            )}

            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-[var(--shadow-glow)] overflow-hidden grid-pattern ring-1 ring-primary/10">
              <div className="p-1 sm:p-2">
                <div className="rounded-xl border border-border/60 bg-background/60 overflow-hidden shadow-inner">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/60 bg-muted/30">
                        <TableHead className="w-[4.5rem] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          #
                        </TableHead>
                        <SortableTableHead
                          columnKey="project"
                          sortKey={sort.key}
                          sortDir={sort.dir}
                          onSort={handleSort}
                          className="min-w-[200px]"
                          sortLabel={"Sort by Project"}
                        >
                          {"Project"}
                        </SortableTableHead>
                        <SortableTableHead
                          columnKey="price"
                          sortKey={sort.key}
                          sortDir={sort.dir}
                          onSort={handleSort}
                          className="whitespace-nowrap"
                          sortLabel={"Sort by Price"}
                        >
                          {"Price"}
                        </SortableTableHead>
                        <SortableTableHead
                          columnKey="change24"
                          sortKey={sort.key}
                          sortDir={sort.dir}
                          onSort={handleSort}
                          className="whitespace-nowrap"
                          sortLabel={"Sort by 24h change"}
                        >
                          24h
                        </SortableTableHead>
                        <SortableTableHead
                          columnKey="volume24"
                          sortKey={sort.key}
                          sortDir={sort.dir}
                          onSort={handleSort}
                          className="whitespace-nowrap hidden md:table-cell"
                          sortLabel={"Sort by 24h volume"}
                        >
                          Vol 24h
                        </SortableTableHead>
                        <SortableTableHead
                          columnKey="liquidity"
                          sortKey={sort.key}
                          sortDir={sort.dir}
                          onSort={handleSort}
                          className="whitespace-nowrap hidden lg:table-cell"
                          sortLabel={"Sort by Liquidity"}
                        >
                          {"Liquidity"}
                        </SortableTableHead>
                        <SortableTableHead
                          columnKey="marketCap"
                          sortKey={sort.key}
                          sortDir={sort.dir}
                          onSort={handleSort}
                          className="whitespace-nowrap hidden xl:table-cell"
                          sortLabel={"Sort by Market cap"}
                        >
                          MCap
                        </SortableTableHead>
                        <SortableTableHead
                          columnKey="dex"
                          sortKey={sort.key}
                          sortDir={sort.dir}
                          onSort={handleSort}
                          className="whitespace-nowrap hidden sm:table-cell"
                          sortLabel={"Sort by DEX"}
                        >
                          DEX
                        </SortableTableHead>
                        <SortableTableHead
                          columnKey="links"
                          sortKey={sort.key}
                          sortDir={sort.dir}
                          onSort={handleSort}
                          className="text-right min-w-[120px]"
                          buttonClassName="w-full justify-end"
                          sortLabel={"Sort by Links"}
                        >
                          {"Links"}
                        </SortableTableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading
                        ? Array.from({ length: S3LABS_ARENA_PROJECTS.length }).map((_, i) => (
                            <TableRow key={`sk-${i}`} className="border-border/60">
                              <TableCell className="w-[4.5rem]">
                                <Skeleton className="h-10 w-10 rounded-xl mx-auto" />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Skeleton className="h-10 w-10 rounded-xl" />
                                  <div className="space-y-2">
                                    <Skeleton className="h-4 w-28" />
                                    <Skeleton className="h-3 w-40" />
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-20" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-14" />
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                <Skeleton className="h-4 w-16" />
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <Skeleton className="h-4 w-16" />
                              </TableCell>
                              <TableCell className="hidden xl:table-cell">
                                <Skeleton className="h-4 w-16" />
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <Skeleton className="h-6 w-16 rounded-full" />
                              </TableCell>
                              <TableCell className="text-right">
                                <Skeleton className="h-8 w-20 ml-auto rounded-md" />
                              </TableCell>
                            </TableRow>
                          ))
                        : paginatedRows.map(({ project, pair }, index) => (
                            <ArenaRow
                              key={project.mint}
                              rank={(safePage - 1) * ARENA_PAGE_SIZE + index + 1}
                              project={project}
                              pair={pair}
                            />
                          ))}
                    </TableBody>
                  </Table>
                  {!isLoading && (
                    <ArenaTablePagination
                      page={safePage}
                      totalPages={totalPages}
                      totalCount={totalCount}
                      onPageChange={setPage}
                      t={t}
                    />
                  )}
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto">
              {"Data provided by DexScreener. Prices and metrics change frequently; not financial advice."}
            </p>
          </div>
        </main>
        <Footer />
        <ApplicationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </div>
    </div>
  );
};

function ArenaRow({
  rank,
  project,
  pair,
}: {
  rank: number;
  project: { name: string; mint: string };
  pair: DexScreenerPair | null;
}) {
  const change24 = pair?.priceChange?.h24;
  const up = change24 !== undefined && change24 > 0;
  const down = change24 !== undefined && change24 < 0;
  const priceUsd = pair ? Number.parseFloat(pair.priceUsd) : NaN;

  const displayName = pair?.baseToken.name ?? project.name;
  const displaySymbol = pair?.baseToken.symbol ?? "—";
  const imageUrl = pair?.info?.imageUrl;

  const detailHref = `/arenass/${encodeURIComponent(project.mint)}`;

  return (
    <TableRow
      className={cn(
        "border-border/60 group transition-colors",
        leaderboardRowClass(rank),
        rank > 3 && "hover:bg-muted/25",
      )}
    >
      <TableCell className="w-[4.5rem] align-middle">
        <LeaderboardRankCell rank={rank} />
      </TableCell>
      <TableCell className="max-w-[280px]">
        <Link
          to={detailHref}
          className="flex items-center gap-2 min-w-0 -m-2 p-2 rounded-xl hover:bg-muted/60 transition-colors group/detail focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={"Project details"}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="h-10 w-10 rounded-xl object-cover ring-1 ring-border shrink-0 bg-muted"
                loading="lazy"
              />
            ) : (
              <div
                className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0 ring-1 ring-border"
                aria-hidden
              >
                {project.name.slice(0, 1)}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-semibold text-foreground truncate group-hover/detail:text-primary transition-colors">
                {displayName}
              </div>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="font-mono">{displaySymbol}</span>
                <span className="text-border">·</span>
                <span className="font-mono" title={project.mint}>
                  {truncateMint(project.mint)}
                </span>
              </div>
            </div>
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 group-hover/detail:opacity-70 transition-opacity"
            aria-hidden
          />
        </Link>
      </TableCell>
      <TableCell className="font-mono text-sm whitespace-nowrap">
        {Number.isFinite(priceUsd) ? formatUsd(priceUsd) : "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {change24 === undefined ? (
          <span className="text-muted-foreground">—</span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-sm font-medium tabular-nums",
              up && "text-emerald-600 dark:text-emerald-400",
              down && "text-red-600 dark:text-red-400",
              !up && !down && "text-muted-foreground",
            )}
          >
            {up && <TrendingUp className="w-3.5 h-3.5" />}
            {down && <TrendingDown className="w-3.5 h-3.5" />}
            {formatPct(change24)}
          </span>
        )}
      </TableCell>
      <TableCell className="hidden md:table-cell font-mono text-sm tabular-nums whitespace-nowrap">
        {pair ? formatCompactUsd(pair.volume?.h24) : "—"}
      </TableCell>
      <TableCell className="hidden lg:table-cell font-mono text-sm tabular-nums whitespace-nowrap">
        {pair ? formatCompactUsd(pair.liquidity?.usd) : "—"}
      </TableCell>
      <TableCell className="hidden xl:table-cell font-mono text-sm tabular-nums whitespace-nowrap">
        {pair ? formatCompactUsd(pair.marketCap) : "—"}
      </TableCell>
      <TableCell className="hidden sm:table-cell">
        {pair ? (
          <Badge variant="secondary" className="font-normal capitalize">
            {pair.dexId}
          </Badge>
        ) : (
          "—"
        )}
      </TableCell>
      <TableCell className="text-right">
        {pair?.url ? (
          <Button variant="outline" size="sm" className="gap-1.5" asChild>
            <a href={pair.url} target="_blank" rel="noopener noreferrer">
              DexScreener
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">
            {"Data not available"}
          </span>
        )}
      </TableCell>
    </TableRow>
  );
}

const Arena = () => (
  <ThemeProvider>
    <ArenaPageContent />
    </ThemeProvider>
);

export default Arena;
