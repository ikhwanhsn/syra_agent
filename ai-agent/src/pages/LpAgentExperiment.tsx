import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Loader2,
  RefreshCw,
  Trophy,
  Waves,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AgentBackgroundLiveIndicator } from "@/components/experiment/AgentBackgroundLiveIndicator";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import {
  fetchLpCandidatePools,
  fetchLpRuns,
  fetchLpStats,
  fetchLpStrategies,
  type LpRunStatus,
} from "@/lib/lpAgentExperimentApi";

const RUNS_PAGE_SIZE = 25;
const CANDIDATES_PAGE_SIZE = 20;
const RUN_STATUSES: LpRunStatus[] = ["open", "win", "loss", "expired", "skipped", "error"];
type SortDirection = "asc" | "desc";
type LeaderboardSortKey = "strategyName" | "lpShape" | "wins" | "losses" | "openPositions" | "winRatePct" | "avgPnlPct" | "avgFeesSol";
type CandidateSortKey = "strategyName" | "poolName" | "score" | "tvlUsd" | "volume24hUsd" | "feeTvlRatio";
type RunSortKey = "strategyName" | "poolName" | "status" | "simPnlPct" | "simFeesEarnedSol" | "createdAt";

function compareValues(a: unknown, b: unknown) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const aText = String(a ?? "").toLowerCase();
  const bText = String(b ?? "").toLowerCase();
  return aText.localeCompare(bText);
}

function compareLeaderboardBest(
  a: {
    winRatePct: number | null;
    wins: number;
    avgPnlPct: number;
    losses: number;
  },
  b: {
    winRatePct: number | null;
    wins: number;
    avgPnlPct: number;
    losses: number;
  },
) {
  const aWinRate = a.winRatePct ?? -1;
  const bWinRate = b.winRatePct ?? -1;
  if (bWinRate !== aWinRate) return bWinRate - aWinRate;
  if (b.wins !== a.wins) return b.wins - a.wins;
  if (b.avgPnlPct !== a.avgPnlPct) return b.avgPnlPct - a.avgPnlPct;
  return a.losses - b.losses;
}

function pnlNumberClass(value: number) {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-foreground";
}

function PaginationBar({
  page,
  totalPages,
  totalRowsLabel,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalRowsLabel: string;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground sm:px-4">
      <span>
        Page {page} / {totalPages} - {totalRowsLabel}
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={onPrev} className="h-8 gap-1.5 px-2.5">
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={onNext}
          className="h-8 gap-1.5 px-2.5"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function RunStatusBadge({ status }: { status: LpRunStatus }) {
  const tone =
    status === "win"
      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
      : status === "loss" || status === "error"
        ? "bg-destructive/15 text-destructive"
        : status === "open"
          ? "bg-sky-500/15 text-sky-700 dark:text-sky-300"
          : "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize", tone)}>{status}</span>
  );
}

export default function LpAgentExperiment({ embedded = false }: { embedded?: boolean }) {
  const [leaderboardSort, setLeaderboardSort] = useState<{ key: LeaderboardSortKey; dir: SortDirection }>({
    key: "winRatePct",
    dir: "desc",
  });
  const [candidateSort, setCandidateSort] = useState<{ key: CandidateSortKey; dir: SortDirection }>({
    key: "score",
    dir: "desc",
  });
  const [runSort, setRunSort] = useState<{ key: RunSortKey; dir: SortDirection }>({
    key: "createdAt",
    dir: "desc",
  });
  const [candidatePage, setCandidatePage] = useState(1);
  const [runPage, setRunPage] = useState(1);
  const [runStatus, setRunStatus] = useState<string>("all");
  const [runSymbol, setRunSymbol] = useState("");

  const strategiesQ = useQuery({
    queryKey: ["lp-agent", "strategies"],
    queryFn: fetchLpStrategies,
  });
  const statsQ = useQuery({
    queryKey: ["lp-agent", "stats"],
    queryFn: fetchLpStats,
    refetchInterval: 60_000,
  });
  const candidatesQ = useQuery({
    queryKey: ["lp-agent", "candidates"],
    queryFn: fetchLpCandidatePools,
    refetchInterval: 60_000,
  });
  const runsQ = useQuery({
    queryKey: ["lp-agent", "runs", runStatus, runSymbol, runPage],
    queryFn: () =>
      fetchLpRuns({
        limit: RUNS_PAGE_SIZE,
        offset: (runPage - 1) * RUNS_PAGE_SIZE,
        status: runStatus === "all" ? undefined : runStatus,
        symbol: runSymbol.trim() || undefined,
      }),
    refetchInterval: 45_000,
  });

  const openPositions = useMemo(
    () => (statsQ.data?.agents || []).reduce((sum, x) => sum + (x.openPositions || 0), 0),
    [statsQ.data?.agents],
  );
  const sortedLeaderboardRows = useMemo(() => {
    const rows = [...(statsQ.data?.agents || [])];
    rows.sort((a, b) => {
      if (leaderboardSort.key === "winRatePct" && leaderboardSort.dir === "desc") {
        return compareLeaderboardBest(a, b);
      }
      const order = compareValues(a[leaderboardSort.key], b[leaderboardSort.key]);
      return leaderboardSort.dir === "asc" ? order : -order;
    });
    return rows;
  }, [statsQ.data?.agents, leaderboardSort]);
  const candidateRows = useMemo(() => {
    const rows = [...(candidatesQ.data || [])];
    rows.sort((a, b) => {
      const order = compareValues(a[candidateSort.key], b[candidateSort.key]);
      return candidateSort.dir === "asc" ? order : -order;
    });
    return rows;
  }, [candidatesQ.data, candidateSort]);
  const candidateTotalPages = Math.max(1, Math.ceil(candidateRows.length / CANDIDATES_PAGE_SIZE));
  const safeCandidatePage = Math.min(candidatePage, candidateTotalPages);
  const pagedCandidates = useMemo(() => {
    const start = (safeCandidatePage - 1) * CANDIDATES_PAGE_SIZE;
    return candidateRows.slice(start, start + CANDIDATES_PAGE_SIZE);
  }, [candidateRows, safeCandidatePage]);
  const runTotalPages = Math.max(1, Math.ceil((runsQ.data?.total || 0) / RUNS_PAGE_SIZE));
  const safeRunPage = Math.min(runPage, runTotalPages);
  const sortedRuns = useMemo(() => {
    const rows = [...(runsQ.data?.runs || [])];
    rows.sort((a, b) => {
      const order = compareValues(a[runSort.key], b[runSort.key]);
      return runSort.dir === "asc" ? order : -order;
    });
    return rows;
  }, [runsQ.data?.runs, runSort]);

  useEffect(() => {
    if (candidatePage > candidateTotalPages) {
      setCandidatePage(candidateTotalPages);
    }
  }, [candidatePage, candidateTotalPages]);

  useEffect(() => {
    if (runPage > runTotalPages) {
      setRunPage(runTotalPages);
    }
  }, [runPage, runTotalPages]);

  const loading = strategiesQ.isLoading || statsQ.isLoading || candidatesQ.isLoading || runsQ.isLoading;
  const failed = strategiesQ.isError || statsQ.isError || candidatesQ.isError || runsQ.isError;

  return (
    <div
      className={cn(
        DASHBOARD_CONTENT_SHELL,
        PAGE_PADDING_TOP_STANDARD,
        PAGE_SAFE_AREA_BOTTOM_COMPACT,
        "space-y-4",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {!embedded && (
              <Link to="/dashboard/overview" aria-label="Back to dashboard overview">
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <h1 className="text-xl font-semibold tracking-tight">LP agent experiment</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Meridian-style DLMM strategy lab powered by real Meteora pool data.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            strategiesQ.refetch();
            statsQ.refetch();
            candidatesQ.refetch();
            runsQ.refetch();
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div
        className={cn(
          "relative overflow-hidden rounded-xl border px-4 py-3.5 sm:px-5",
          failed
            ? "border-destructive/40 bg-destructive/[0.08] text-destructive"
            : loading
              ? "border-amber-500/35 bg-muted/50 dark:bg-muted/30"
              : "border-border bg-muted/50 text-foreground dark:bg-muted/30",
        )}
        role="status"
        aria-live="polite"
        aria-label={
          failed ? "LP experiment API error" : loading ? "LP experiment data syncing" : "LP experiment service online"
        }
      >
        {!failed && !loading ? (
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-600"
            aria-hidden
          />
        ) : null}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          {failed ? (
            <>
              <span className="relative mt-0.5 flex h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" aria-hidden />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold">LP experiment API unavailable</p>
                <p className="text-xs leading-relaxed text-destructive/90 sm:text-sm">
                  Use Refresh after checking your connection or API configuration.
                </p>
              </div>
            </>
          ) : loading ? (
            <>
              <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-amber-600 dark:text-amber-400" aria-hidden />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-semibold text-foreground">Syncing LP experiment data…</p>
                <p className="text-xs leading-relaxed text-foreground/70 sm:text-sm">
                  Tables update when the request finishes.
                </p>
              </div>
            </>
          ) : (
            <>
              <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/50 opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.45)]" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">LP experiment live</p>
                  <AgentBackgroundLiveIndicator openPositions={openPositions} />
                </div>
                <p className="text-xs leading-relaxed text-foreground/75 sm:text-sm">
                  Meteora pool feeds and leaderboard refresh automatically. Strategies with open runs show a green{" "}
                  <span className="font-medium text-foreground">Live</span> pill; resolves continue while you use other
                  pages when the experiment API is ticking.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="leaderboard" className="w-full">
        <TabsList className="grid h-auto w-full grid-cols-3 rounded-xl border border-border/70 bg-muted/30 p-1">
          <TabsTrigger value="leaderboard" className="h-9 gap-1.5 rounded-lg text-xs sm:text-sm">
            <Trophy className="h-3.5 w-3.5" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="candidates" className="h-9 gap-1.5 rounded-lg text-xs sm:text-sm">
            <Waves className="h-3.5 w-3.5" />
            Candidates
          </TabsTrigger>
          <TabsTrigger value="runs" className="h-9 gap-1.5 rounded-lg text-xs sm:text-sm">
            <ListOrdered className="h-3.5 w-3.5" />
            Runs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-sm font-medium">Strategy performance board</p>
            <p className="text-xs text-muted-foreground">Ranked by win rate and wins</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => setLeaderboardSort((prev) => ({ key: "strategyName", dir: prev.key === "strategyName" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Strategy <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => setLeaderboardSort((prev) => ({ key: "lpShape", dir: prev.key === "lpShape" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      LP shape <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setLeaderboardSort((prev) => ({ key: "wins", dir: prev.key === "wins" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Wins <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setLeaderboardSort((prev) => ({ key: "losses", dir: prev.key === "losses" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Losses <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setLeaderboardSort((prev) => ({ key: "openPositions", dir: prev.key === "openPositions" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Open <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setLeaderboardSort((prev) => ({ key: "winRatePct", dir: prev.key === "winRatePct" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Win % <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setLeaderboardSort((prev) => ({ key: "avgPnlPct", dir: prev.key === "avgPnlPct" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Avg PnL % <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setLeaderboardSort((prev) => ({ key: "avgFeesSol", dir: prev.key === "avgFeesSol" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Avg fees (SOL) <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLeaderboardRows.map((row) => (
                  <TableRow key={row.strategyId}>
                    <TableCell className="font-medium">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link
                          to={`/dashboard/lp-experiment/agent/${row.strategyId}`}
                          className="truncate text-primary hover:underline"
                        >
                          {row.strategyName}
                        </Link>
                        <AgentBackgroundLiveIndicator openPositions={row.openPositions} />
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{row.lpShape}</TableCell>
                    <TableCell className="text-right">{row.wins}</TableCell>
                    <TableCell className="text-right">{row.losses}</TableCell>
                    <TableCell className="text-right">{row.openPositions}</TableCell>
                    <TableCell className="text-right">
                      {row.winRatePct == null ? "—" : `${row.winRatePct.toFixed(1)}%`}
                    </TableCell>
                    <TableCell className={cn("text-right font-medium", pnlNumberClass(row.avgPnlPct))}>
                      {row.avgPnlPct.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">{row.avgFeesSol.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
                {!loading && (statsQ.data?.agents || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No runs yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="candidates" className="mt-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-sm font-medium">Top candidate pools</p>
            <p className="text-xs text-muted-foreground">Highest score pools passing all strategy gates</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => setCandidateSort((prev) => ({ key: "strategyName", dir: prev.key === "strategyName" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Strategy <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => setCandidateSort((prev) => ({ key: "poolName", dir: prev.key === "poolName" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Pool <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setCandidateSort((prev) => ({ key: "score", dir: prev.key === "score" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Score <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setCandidateSort((prev) => ({ key: "tvlUsd", dir: prev.key === "tvlUsd" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      TVL <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setCandidateSort((prev) => ({ key: "volume24hUsd", dir: prev.key === "volume24hUsd" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      24h Vol <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setCandidateSort((prev) => ({ key: "feeTvlRatio", dir: prev.key === "feeTvlRatio" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Fee/TVL <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedCandidates.map((row) => (
                  <TableRow key={`${row.strategyId}:${row.poolAddress}`}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/dashboard/lp-experiment/agent/${row.strategyId}`}
                        className="text-primary hover:underline"
                      >
                        {row.strategyName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Waves className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>
                          {row.baseSymbol || "?"}/{row.quoteSymbol || "?"}
                        </span>
                        <span className="text-muted-foreground">· {row.poolName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{row.score.toFixed(3)}</TableCell>
                    <TableCell className="text-right">${(row.tvlUsd || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">${(row.volume24hUsd || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{((row.feeTvlRatio || 0) * 100).toFixed(2)}%</TableCell>
                  </TableRow>
                ))}
                {!loading && pagedCandidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No candidates found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            <PaginationBar
              page={safeCandidatePage}
              totalPages={candidateTotalPages}
              totalRowsLabel={`${candidateRows.length} candidates`}
              onPrev={() => setCandidatePage((p) => Math.max(1, p - 1))}
              onNext={() => setCandidatePage((p) => Math.min(candidateTotalPages, p + 1))}
            />
          </div>
        </TabsContent>

        <TabsContent value="runs" className="mt-3 space-y-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-sm font-medium">Run history</p>
            <p className="text-xs text-muted-foreground">Latest simulated LP runs and outcomes</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={runStatus}
              onChange={(e) => {
                setRunStatus(e.target.value);
                setRunPage(1);
              }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">All statuses</option>
              {RUN_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Input
              value={runSymbol}
              onChange={(e) => {
                setRunSymbol(e.target.value);
                setRunPage(1);
              }}
              placeholder="Filter by symbol or pool"
              className="max-w-xs"
            />
            <Button size="sm" variant="outline" onClick={() => runsQ.refetch()}>
              Apply
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70 backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => setRunSort((prev) => ({ key: "strategyName", dir: prev.key === "strategyName" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Strategy <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => setRunSort((prev) => ({ key: "poolName", dir: prev.key === "poolName" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Pool <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => setRunSort((prev) => ({ key: "status", dir: prev.key === "status" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Status <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setRunSort((prev) => ({ key: "simPnlPct", dir: prev.key === "simPnlPct" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      PnL % <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setRunSort((prev) => ({ key: "simFeesEarnedSol", dir: prev.key === "simFeesEarnedSol" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Fees (SOL) <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button type="button" className="inline-flex items-center gap-1" onClick={() => setRunSort((prev) => ({ key: "createdAt", dir: prev.key === "createdAt" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      Created <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRuns.map((run) => (
                  <TableRow key={run._id}>
                    <TableCell className="font-medium">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link
                          to={`/dashboard/lp-experiment/agent/${run.strategyId}`}
                          className="truncate text-primary hover:underline"
                        >
                          {run.strategyName}
                        </Link>
                        <AgentBackgroundLiveIndicator openPositions={run.status === "open" ? 1 : 0} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {(run.baseSymbol || "?")}/{run.quoteSymbol || "?"}
                    </TableCell>
                    <TableCell>
                      <RunStatusBadge status={run.status} />
                    </TableCell>
                    <TableCell className={cn("text-right font-medium", pnlNumberClass(run.simPnlPct || 0))}>
                      {(run.simPnlPct || 0).toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right">{(run.simFeesEarnedSol || 0).toFixed(4)}</TableCell>
                    <TableCell>{run.createdAt ? new Date(run.createdAt).toLocaleString() : "—"}</TableCell>
                  </TableRow>
                ))}
                {!loading && (runsQ.data?.runs || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No runs found.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
            <PaginationBar
              page={safeRunPage}
              totalPages={runTotalPages}
              totalRowsLabel={`${runsQ.data?.total || 0} runs`}
              onPrev={() => setRunPage((p) => Math.max(1, p - 1))}
              onNext={() => setRunPage((p) => Math.min(runTotalPages, p + 1))}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
