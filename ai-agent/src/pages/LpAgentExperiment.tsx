import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  ListOrdered,
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
import { LpExperimentRiskAgreementDialog } from "@/components/experiment/LpExperimentRiskAgreementDialog";
import { LpExperimentBackdrop } from "@/components/experiment/lp/LpExperimentBackdrop";
import { LpExperimentHero } from "@/components/experiment/lp/LpExperimentHero";
import { LpRealSection } from "@/components/experiment/LpRealSection";
import { cn } from "@/lib/utils";
import {
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import {
  fetchLpCandidatePools,
  fetchLpLabState,
  fetchLpRuns,
  fetchLpStats,
  fetchLpStrategies,
  formatLpUsd,
  lpRunNetPnlUsdFromSnapshot,
  type LpRunStatus,
} from "@/lib/lpAgentExperimentApi";

const RUNS_PAGE_SIZE = 25;
const CANDIDATES_PAGE_SIZE = 20;
const RUN_STATUSES: LpRunStatus[] = ["open", "win", "loss", "expired", "skipped", "error"];
type SortDirection = "asc" | "desc";
type LeaderboardSortKey =
  | "strategyName"
  | "lpShape"
  | "wins"
  | "losses"
  | "openPositions"
  | "winRatePct"
  | "avgPnlPct"
  | "avgFeesSol"
  | "cashSol"
  | "sumNetPnlSol"
  | "sumChainFeesSol";
type CandidateSortKey = "strategyName" | "poolName" | "score" | "tvlUsd" | "volume24hUsd" | "feeTvlRatio";
type RunSortKey =
  | "strategyName"
  | "poolName"
  | "status"
  | "simPnlPct"
  | "simFeesEarnedSol"
  | "simNetPnlSol"
  | "createdAt";

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
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/45 bg-background/20 px-4 py-3 text-xs text-muted-foreground sm:px-5">
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
  const labStateQ = useQuery({
    queryKey: ["lp-agent", "lab-state"],
    queryFn: fetchLpLabState,
    refetchInterval: 60_000,
  });
  const activeCohortId = labStateQ.data?.activeExperimentId ?? null;
  const statsQ = useQuery({
    queryKey: ["lp-agent", "stats", activeCohortId ?? "none"],
    queryFn: fetchLpStats,
    enabled: labStateQ.isFetched,
    refetchInterval: 60_000,
  });
  const candidatesQ = useQuery({
    queryKey: ["lp-agent", "candidates"],
    queryFn: fetchLpCandidatePools,
    refetchInterval: 60_000,
  });
  const runsQ = useQuery({
    queryKey: ["lp-agent", "runs", activeCohortId ?? "none", runStatus, runSymbol, runPage],
    queryFn: () =>
      fetchLpRuns({
        limit: RUNS_PAGE_SIZE,
        offset: (runPage - 1) * RUNS_PAGE_SIZE,
        status: runStatus === "all" ? undefined : runStatus,
        symbol: runSymbol.trim() || undefined,
        experimentId: activeCohortId ?? undefined,
      }),
    enabled: labStateQ.isFetched && Boolean(activeCohortId),
    refetchInterval: 45_000,
  });

  const refSolUsd = labStateQ.data?.referenceSolPriceUsd;

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

  const loading =
    strategiesQ.isLoading || statsQ.isLoading || candidatesQ.isLoading || runsQ.isLoading || labStateQ.isLoading;
  const failed = strategiesQ.isError || statsQ.isError || candidatesQ.isError || runsQ.isError || labStateQ.isError;

  const refreshAll = useCallback(() => {
    void strategiesQ.refetch();
    void statsQ.refetch();
    void candidatesQ.refetch();
    void runsQ.refetch();
    void labStateQ.refetch();
  }, [strategiesQ, statsQ, candidatesQ, runsQ, labStateQ]);

  const tableShell = cn(overviewCardShell, "overflow-hidden rounded-3xl ring-1 ring-border/25");

  return (
    <>
      <LpExperimentBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
          "relative space-y-6",
        )}
      >
        <LpExperimentRiskAgreementDialog />

        <LpExperimentHero
          embedded={embedded}
          loading={loading}
          failed={failed}
          openPositions={openPositions}
          onRefresh={refreshAll}
        />

        {labStateQ.data?.activeExperimentId ? (
          <article className={cn(tableShell, "px-5 py-5 sm:px-7 sm:py-6")}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border/45 bg-background/40">
                <FlaskConical className="h-4 w-4 text-muted-foreground" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className={overviewKickerClass}>Active cohort</p>
                <p className="mt-1 text-base font-semibold tracking-tight text-foreground">
                  {labStateQ.data.title || "Simulation cohort"}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="font-mono text-foreground/90">{labStateQ.data.activeExperimentId}</span>
                  {" · "}
                  {labStateQ.data.simConfig.startingBankSol} SOL bank · max{" "}
                  {labStateQ.data.simConfig.maxConcurrentPositions} × {labStateQ.data.simConfig.maxPositionSol} SOL ·
                  fees {labStateQ.data.simConfig.openFeeBps}+{labStateQ.data.simConfig.closeFeeBps} bps per leg
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground/90">
                  Profits compound in cash until the next full slot opens. Path to ~100 SOL depends on drift, fee yield,
                  and chain costs — not guaranteed.
                </p>
              </div>
            </div>
          </article>
        ) : null}

        <LpRealSection />

        <section className="space-y-4">
          <div>
            <p className={overviewKickerClass}>Benchmark</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">Simulation lab</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Strategy cohorts compete on live Meteora pools. The real agent above follows the current leaderboard leader.
            </p>
          </div>

          <Tabs defaultValue="leaderboard" className="w-full space-y-4">
            <TabsList className="grid h-auto w-full grid-cols-3 rounded-2xl border border-border/50 bg-background/35 p-1 backdrop-blur-md">
              <TabsTrigger
                value="leaderboard"
                className="h-10 gap-1.5 rounded-xl text-xs data-[state=active]:bg-background/80 data-[state=active]:shadow-sm sm:text-sm"
              >
                <Trophy className="h-3.5 w-3.5" />
                Leaderboard
              </TabsTrigger>
              <TabsTrigger
                value="candidates"
                className="h-10 gap-1.5 rounded-xl text-xs data-[state=active]:bg-background/80 data-[state=active]:shadow-sm sm:text-sm"
              >
                <Waves className="h-3.5 w-3.5" />
                Candidates
              </TabsTrigger>
              <TabsTrigger
                value="runs"
                className="h-10 gap-1.5 rounded-xl text-xs data-[state=active]:bg-background/80 data-[state=active]:shadow-sm sm:text-sm"
              >
                <ListOrdered className="h-3.5 w-3.5" />
                Runs
              </TabsTrigger>
            </TabsList>

        <TabsContent value="leaderboard" className="mt-0 space-y-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-sm font-medium">Strategy performance board</p>
            <p className="text-xs text-muted-foreground">
              Wins / losses / open are for the active cohort id in the banner above. Net PnL / tx fee USD lines use each
              run’s SOL/USD snapshot at open; cash USD uses the lab reference SOL price.
            </p>
          </div>
          <div className={tableShell}>
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
                    <button
                      type="button"
                      className="ml-auto inline-flex items-center gap-1"
                      onClick={() =>
                        setLeaderboardSort((prev) => ({
                          key: "cashSol",
                          dir: prev.key === "cashSol" && prev.dir === "asc" ? "desc" : "asc",
                        }))
                      }
                    >
                      Cash (SOL) <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      className="ml-auto inline-flex items-center gap-1"
                      onClick={() =>
                        setLeaderboardSort((prev) => ({
                          key: "sumNetPnlSol",
                          dir: prev.key === "sumNetPnlSol" && prev.dir === "asc" ? "desc" : "asc",
                        }))
                      }
                    >
                      Net PnL Σ <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button
                      type="button"
                      className="ml-auto inline-flex items-center gap-1"
                      onClick={() =>
                        setLeaderboardSort((prev) => ({
                          key: "sumChainFeesSol",
                          dir: prev.key === "sumChainFeesSol" && prev.dir === "asc" ? "desc" : "asc",
                        }))
                      }
                    >
                      Tx fees Σ <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setLeaderboardSort((prev) => ({ key: "avgFeesSol", dir: prev.key === "avgFeesSol" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      LP fees (avg) <ArrowUpDown className="h-3.5 w-3.5" />
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
                    <TableCell className="text-right tabular-nums">
                      <div>{(row.cashSol ?? 0).toFixed(3)}</div>
                      {refSolUsd != null && refSolUsd > 0 ? (
                        <div className="text-xs text-muted-foreground">{formatLpUsd((row.cashSol ?? 0) * refSolUsd)}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className={cn("text-right font-medium tabular-nums", pnlNumberClass(row.sumNetPnlSol ?? 0))}>
                      <div>{(row.sumNetPnlSol ?? 0).toFixed(4)}</div>
                      {row.sumNetPnlUsd != null && Number.isFinite(row.sumNetPnlUsd) ? (
                        <div className={cn("text-xs text-muted-foreground", pnlNumberClass(row.sumNetPnlUsd))}>
                          {formatLpUsd(row.sumNetPnlUsd)}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <div>{(row.sumChainFeesSol ?? 0).toFixed(4)}</div>
                      {row.sumChainFeesUsd != null && Number.isFinite(row.sumChainFeesUsd) ? (
                        <div className="text-xs text-muted-foreground">{formatLpUsd(row.sumChainFeesUsd)}</div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">{row.avgFeesSol.toFixed(4)}</TableCell>
                  </TableRow>
                ))}
                {!loading && (statsQ.data?.agents || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center text-muted-foreground">
                      No runs yet.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="candidates" className="mt-0 space-y-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-sm font-medium">Top candidate pools</p>
            <p className="text-xs text-muted-foreground">Highest score pools passing all strategy gates</p>
          </div>
          <div className={tableShell}>
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

        <TabsContent value="runs" className="mt-0 space-y-3">
          <div className="mb-2 flex items-center justify-between gap-2 px-1">
            <p className="text-sm font-medium">Run history</p>
            <p className="text-xs text-muted-foreground">Latest LP runs and outcomes</p>
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
          <div className={tableShell}>
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
                    <button
                      type="button"
                      className="ml-auto inline-flex items-center gap-1"
                      onClick={() => setRunSort((prev) => ({ key: "simNetPnlSol", dir: prev.key === "simNetPnlSol" && prev.dir === "asc" ? "desc" : "asc" }))}
                    >
                      Net PnL (SOL + USD) <ArrowUpDown className="h-3.5 w-3.5" />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button type="button" className="ml-auto inline-flex items-center gap-1" onClick={() => setRunSort((prev) => ({ key: "simFeesEarnedSol", dir: prev.key === "simFeesEarnedSol" && prev.dir === "asc" ? "desc" : "asc" }))}>
                      LP fees (SOL) <ArrowUpDown className="h-3.5 w-3.5" />
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
                    <TableCell className={cn("text-right font-medium tabular-nums", pnlNumberClass(run.simNetPnlSol || 0))}>
                      <div>{(run.simNetPnlSol ?? 0).toFixed(4)}</div>
                      {run.depositSol != null &&
                      run.depositUsd != null &&
                      Number(run.depositSol) > 0 &&
                      Number.isFinite(Number(run.depositUsd)) ? (
                        <div
                          className={cn(
                            "text-xs text-muted-foreground",
                            pnlNumberClass(lpRunNetPnlUsdFromSnapshot(run)),
                          )}
                        >
                          {formatLpUsd(lpRunNetPnlUsdFromSnapshot(run))}
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{(run.simFeesEarnedSol || 0).toFixed(4)}</TableCell>
                    <TableCell>{run.createdAt ? new Date(run.createdAt).toLocaleString() : "—"}</TableCell>
                  </TableRow>
                ))}
                {!loading && (runsQ.data?.runs || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
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
        </section>
      </div>
    </>
  );
}
