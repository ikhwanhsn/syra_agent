import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import { useQuery } from "@tanstack/react-query";
import { ListOrdered, Search, Trophy, Waves } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { LpExperimentGlobalStats } from "@/components/experiment/lp/LpExperimentGlobalStats";
import { LpExperimentHero } from "@/components/experiment/lp/LpExperimentHero";
import { LpExperimentLabSummary } from "@/components/experiment/lp/LpExperimentLabSummary";
import { LpSectionHeader } from "@/components/experiment/lp/LpSectionHeader";
import {
  LpPaginationBar,
  LpSortableHead,
  LpTableEmpty,
  LpTableSkeletonRows,
  RunStatusBadge,
} from "@/components/experiment/lp/LpExperimentTableUi";
import { LpRealSection } from "@/components/experiment/LpRealSection";
import { cn } from "@/lib/utils";
import {
  lpFilterBar,
  lpTableHead,
  lpTableRow,
  lpTableShell,
  lpTabsList,
  lpTabsTrigger,
} from "@/components/experiment/lp/lpExperimentStyles";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import {
  fetchLpCandidatePools,
  fetchLpGlobalOverview,
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
  | "wins"
  | "losses"
  | "openPositions"
  | "winRatePct"
  | "avgPnlPct"
  | "sumNetPnlSol";
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

function toggleSort<T extends string>(
  prev: { key: T; dir: SortDirection },
  key: T,
): { key: T; dir: SortDirection } {
  if (prev.key !== key) return { key, dir: "desc" };
  return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
}

export default function LpAgentExperiment({ embedded = false }: { embedded?: boolean }) {
  const [leaderboardSort, setLeaderboardSort] = useState<{ key: LeaderboardSortKey; dir: SortDirection }>({
    key: "sumNetPnlSol",
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
  const [runSymbolDebounced, setRunSymbolDebounced] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setRunSymbolDebounced(runSymbol.trim()), 350);
    return () => window.clearTimeout(t);
  }, [runSymbol]);

  const strategiesQ = useQuery({
    queryKey: ["lp-agent", "strategies"],
    queryFn: fetchLpStrategies,
  });
  const overviewQ = useQuery({
    queryKey: ["lp-agent", "overview"],
    queryFn: fetchLpGlobalOverview,
    refetchInterval: 60_000,
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
    queryKey: ["lp-agent", "runs", activeCohortId ?? "none", runStatus, runSymbolDebounced, runPage],
    queryFn: () =>
      fetchLpRuns({
        limit: RUNS_PAGE_SIZE,
        offset: (runPage - 1) * RUNS_PAGE_SIZE,
        status: runStatus === "all" ? undefined : runStatus,
        symbol: runSymbolDebounced || undefined,
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

  useEffect(() => {
    setRunPage(1);
  }, [runSymbolDebounced]);

  const loading =
    overviewQ.isLoading ||
    strategiesQ.isLoading ||
    statsQ.isLoading ||
    candidatesQ.isLoading ||
    runsQ.isLoading ||
    labStateQ.isLoading;
  const failed =
    overviewQ.isError ||
    strategiesQ.isError ||
    statsQ.isError ||
    candidatesQ.isError ||
    runsQ.isError ||
    labStateQ.isError;

  const refreshAll = useCallback(() => {
    void overviewQ.refetch();
    void strategiesQ.refetch();
    void statsQ.refetch();
    void candidatesQ.refetch();
    void runsQ.refetch();
    void labStateQ.refetch();
  }, [overviewQ, strategiesQ, statsQ, candidatesQ, runsQ, labStateQ]);

  const agentCount = statsQ.data?.agents?.length ?? 0;
  const candidateCount = candidatesQ.data?.length ?? 0;
  const runCount = runsQ.data?.total ?? 0;

  return (
    <>
      <LpExperimentBackdrop />
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
          "relative space-y-8",
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

        <LpExperimentGlobalStats overview={overviewQ.data} loading={overviewQ.isLoading} />

        <LpRealSection />

        <section id="simulation" className="scroll-mt-8 space-y-6">
          <LpSectionHeader
            kicker="Simulation"
            title="Paper trading lab"
            description={[
              overviewQ.data?.simulation.leaderStrategyId != null
                ? `Live agent mirrors cohort leader #${overviewQ.data.simulation.leaderStrategyId} (highest net PnL). `
                : "",
              "Fifteen strategies compete on live Meteora data with no wallet risk.",
              labStateQ.data?.activeExperimentId
                ? ` Active cohort: ${labStateQ.data.simConfig.maxConcurrentPositions} slots × ${labStateQ.data.simConfig.maxPositionSol} SOL each.`
                : " Waiting for the next cohort.",
            ].join("")}
          />

          <LpExperimentLabSummary
            agents={statsQ.data?.agents ?? []}
            recentRuns={runsQ.data?.runs ?? []}
            refSolUsd={refSolUsd}
            loading={loading}
          />

          <LpSectionHeader
            kicker="Full data"
            title="Detailed tables"
            description="Sort columns, filter run history, and drill into any strategy profile."
          />

          <Tabs defaultValue="leaderboard" className="w-full space-y-4">
            <TabsList className={cn(lpTabsList, "grid-cols-3")}>
              <TabsTrigger value="leaderboard" className={cn(lpTabsTrigger, "gap-1.5")}>
                <Trophy className="h-3.5 w-3.5 shrink-0" />
                Leaderboard
                <span className="ml-0.5 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300">
                  {agentCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="candidates" className={cn(lpTabsTrigger, "gap-1.5")}>
                <Waves className="h-3.5 w-3.5 shrink-0" />
                Candidates
                <span className="ml-0.5 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300">
                  {candidateCount}
                </span>
              </TabsTrigger>
              <TabsTrigger value="runs" className={cn(lpTabsTrigger, "gap-1.5")}>
                <ListOrdered className="h-3.5 w-3.5 shrink-0" />
                Runs
                <span className="ml-0.5 rounded-md bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground data-[state=active]:bg-violet-500/10 data-[state=active]:text-violet-700 dark:data-[state=active]:text-violet-300">
                  {runCount}
                </span>
              </TabsTrigger>
            </TabsList>

        <TabsContent value="leaderboard" className="mt-0 space-y-3">
          <p className="px-1 text-sm text-muted-foreground">
            Active cohort — click a column header to sort. Default: net PnL descending.
          </p>
          <div className={lpTableShell}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={lpTableHead}>
                    <LpSortableHead
                      label="Strategy"
                      active={leaderboardSort.key === "strategyName"}
                      direction={leaderboardSort.dir}
                      onClick={() => setLeaderboardSort((prev) => toggleSort(prev, "strategyName"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="Wins"
                      align="right"
                      active={leaderboardSort.key === "wins"}
                      direction={leaderboardSort.dir}
                      onClick={() => setLeaderboardSort((prev) => toggleSort(prev, "wins"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="Losses"
                      align="right"
                      active={leaderboardSort.key === "losses"}
                      direction={leaderboardSort.dir}
                      onClick={() => setLeaderboardSort((prev) => toggleSort(prev, "losses"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="Open"
                      align="right"
                      active={leaderboardSort.key === "openPositions"}
                      direction={leaderboardSort.dir}
                      onClick={() => setLeaderboardSort((prev) => toggleSort(prev, "openPositions"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="Win %"
                      align="right"
                      active={leaderboardSort.key === "winRatePct"}
                      direction={leaderboardSort.dir}
                      onClick={() => setLeaderboardSort((prev) => toggleSort(prev, "winRatePct"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="Avg PnL %"
                      align="right"
                      active={leaderboardSort.key === "avgPnlPct"}
                      direction={leaderboardSort.dir}
                      onClick={() => setLeaderboardSort((prev) => toggleSort(prev, "avgPnlPct"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="Net PnL"
                      align="right"
                      active={leaderboardSort.key === "sumNetPnlSol"}
                      direction={leaderboardSort.dir}
                      onClick={() => setLeaderboardSort((prev) => toggleSort(prev, "sumNetPnlSol"))}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && sortedLeaderboardRows.length === 0 ? (
                  <LpTableSkeletonRows colSpan={7} />
                ) : null}
                {sortedLeaderboardRows.map((row) => (
                  <TableRow key={row.strategyId} className={lpTableRow}>
                    <TableCell className="font-medium">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link
                          to={`/lp-experiment/agent/${row.strategyId}`}
                          className="truncate text-primary hover:underline"
                        >
                          {row.strategyName}
                        </Link>
                        {row.strategyId === 98 ? (
                          <span className="shrink-0 rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-700 dark:text-violet-300">
                            Live mirror
                          </span>
                        ) : null}
                        <AgentBackgroundLiveIndicator openPositions={row.openPositions} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{row.wins}</TableCell>
                    <TableCell className="text-right">{row.losses}</TableCell>
                    <TableCell className="text-right">{row.openPositions}</TableCell>
                    <TableCell className="text-right">
                      {row.winRatePct == null ? "—" : `${row.winRatePct.toFixed(1)}%`}
                    </TableCell>
                    <TableCell className={cn("text-right font-medium", pnlNumberClass(row.avgPnlPct))}>
                      {row.avgPnlPct.toFixed(2)}%
                    </TableCell>
                    <TableCell className={cn("text-right font-medium tabular-nums", pnlNumberClass(row.sumNetPnlSol ?? 0))}>
                      <div>{(row.sumNetPnlSol ?? 0).toFixed(4)} SOL</div>
                      {row.sumNetPnlUsd != null && Number.isFinite(row.sumNetPnlUsd) ? (
                        <div className={cn("text-xs text-muted-foreground", pnlNumberClass(row.sumNetPnlUsd))}>
                          {formatLpUsd(row.sumNetPnlUsd)}
                        </div>
                      ) : refSolUsd != null && refSolUsd > 0 ? (
                        <div className="text-xs text-muted-foreground">
                          {formatLpUsd((row.sumNetPnlSol ?? 0) * refSolUsd)}
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && (statsQ.data?.agents || []).length === 0 ? (
                  <LpTableEmpty
                    colSpan={7}
                    title="No strategies yet"
                    description="Leaderboard fills in after the lab records its first runs."
                  />
                ) : null}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="candidates" className="mt-0 space-y-3">
          <p className="px-1 text-sm text-muted-foreground">Top pools ranked by each strategy&apos;s scoring model.</p>
          <div className={lpTableShell}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={lpTableHead}>
                    <LpSortableHead
                      label="Strategy"
                      active={candidateSort.key === "strategyName"}
                      direction={candidateSort.dir}
                      onClick={() => setCandidateSort((prev) => toggleSort(prev, "strategyName"))}
                    />
                  </TableHead>
                  <TableHead className={lpTableHead}>
                    <LpSortableHead
                      label="Pool"
                      active={candidateSort.key === "poolName"}
                      direction={candidateSort.dir}
                      onClick={() => setCandidateSort((prev) => toggleSort(prev, "poolName"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="Score"
                      align="right"
                      active={candidateSort.key === "score"}
                      direction={candidateSort.dir}
                      onClick={() => setCandidateSort((prev) => toggleSort(prev, "score"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="TVL"
                      align="right"
                      active={candidateSort.key === "tvlUsd"}
                      direction={candidateSort.dir}
                      onClick={() => setCandidateSort((prev) => toggleSort(prev, "tvlUsd"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="24h Vol"
                      align="right"
                      active={candidateSort.key === "volume24hUsd"}
                      direction={candidateSort.dir}
                      onClick={() => setCandidateSort((prev) => toggleSort(prev, "volume24hUsd"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="Fee/TVL"
                      align="right"
                      active={candidateSort.key === "feeTvlRatio"}
                      direction={candidateSort.dir}
                      onClick={() => setCandidateSort((prev) => toggleSort(prev, "feeTvlRatio"))}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && pagedCandidates.length === 0 ? <LpTableSkeletonRows colSpan={6} /> : null}
                {pagedCandidates.map((row) => (
                  <TableRow key={`${row.strategyId}:${row.poolAddress}`} className={lpTableRow}>
                    <TableCell className="font-medium">
                      <Link
                        to={`/lp-experiment/agent/${row.strategyId}`}
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
                  <LpTableEmpty
                    colSpan={6}
                    title="No candidate pools"
                    description="The scanner has not surfaced gated pools for this cycle yet."
                  />
                ) : null}
              </TableBody>
            </Table>
            <LpPaginationBar
              page={safeCandidatePage}
              totalPages={candidateTotalPages}
              totalRowsLabel={`${candidateRows.length} candidates`}
              onPrev={() => setCandidatePage((p) => Math.max(1, p - 1))}
              onNext={() => setCandidatePage((p) => Math.min(candidateTotalPages, p + 1))}
            />
          </div>
        </TabsContent>

        <TabsContent value="runs" className="mt-0 space-y-3">
          <p className="px-1 text-sm text-muted-foreground">
            Filter by status or symbol — search updates automatically as you type.
          </p>
          <div className={lpFilterBar}>
            <Select
              value={runStatus}
              onValueChange={(value) => {
                setRunStatus(value);
                setRunPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[160px] rounded-lg border-border/50 bg-background/70 text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {RUN_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative min-w-[200px] flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                value={runSymbol}
                onChange={(e) => setRunSymbol(e.target.value)}
                placeholder="Symbol or pool name"
                className="h-9 rounded-lg border-border/50 bg-background/70 pl-9 text-sm"
                aria-label="Filter runs by symbol or pool"
              />
            </div>
          </div>
          <div className={lpTableShell}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className={lpTableHead}>
                    <LpSortableHead
                      label="Strategy"
                      active={runSort.key === "strategyName"}
                      direction={runSort.dir}
                      onClick={() => setRunSort((prev) => toggleSort(prev, "strategyName"))}
                    />
                  </TableHead>
                  <TableHead className={lpTableHead}>
                    <LpSortableHead
                      label="Pool"
                      active={runSort.key === "poolName"}
                      direction={runSort.dir}
                      onClick={() => setRunSort((prev) => toggleSort(prev, "poolName"))}
                    />
                  </TableHead>
                  <TableHead className={lpTableHead}>
                    <LpSortableHead
                      label="Status"
                      active={runSort.key === "status"}
                      direction={runSort.dir}
                      onClick={() => setRunSort((prev) => toggleSort(prev, "status"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="PnL %"
                      align="right"
                      active={runSort.key === "simPnlPct"}
                      direction={runSort.dir}
                      onClick={() => setRunSort((prev) => toggleSort(prev, "simPnlPct"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="Net PnL"
                      align="right"
                      active={runSort.key === "simNetPnlSol"}
                      direction={runSort.dir}
                      onClick={() => setRunSort((prev) => toggleSort(prev, "simNetPnlSol"))}
                    />
                  </TableHead>
                  <TableHead className={cn(lpTableHead, "text-right")}>
                    <LpSortableHead
                      label="LP fees"
                      align="right"
                      active={runSort.key === "simFeesEarnedSol"}
                      direction={runSort.dir}
                      onClick={() => setRunSort((prev) => toggleSort(prev, "simFeesEarnedSol"))}
                    />
                  </TableHead>
                  <TableHead className={lpTableHead}>
                    <LpSortableHead
                      label="Created"
                      active={runSort.key === "createdAt"}
                      direction={runSort.dir}
                      onClick={() => setRunSort((prev) => toggleSort(prev, "createdAt"))}
                    />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(runsQ.isFetching || loading) && sortedRuns.length === 0 ? (
                  <LpTableSkeletonRows colSpan={7} />
                ) : null}
                {sortedRuns.map((run) => (
                  <TableRow key={run._id} className={lpTableRow}>
                    <TableCell className="font-medium">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link
                          to={`/lp-experiment/agent/${run.strategyId}`}
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
                {!loading && !runsQ.isFetching && (runsQ.data?.runs || []).length === 0 ? (
                  <LpTableEmpty
                    colSpan={7}
                    title="No runs match"
                    description="Try clearing filters or wait for the next signal cycle."
                  />
                ) : null}
              </TableBody>
            </Table>
            <LpPaginationBar
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
