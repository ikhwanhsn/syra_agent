import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Loader2, RefreshCw, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import { AgentBackgroundLiveIndicator } from "@/components/experiment/AgentBackgroundLiveIndicator";
import {
  fetchLpCandidatePools,
  fetchLpRuns,
  fetchLpStats,
  fetchLpStrategies,
  type LpRunStatus,
} from "@/lib/lpAgentExperimentApi";

const RUNS_PAGE_SIZE = 20;

function pnlNumberClass(value: number) {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-red-600 dark:text-red-400";
  return "text-foreground";
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

export default function LpAgentExperimentAgentProfile({ embedded = false }: { embedded?: boolean }) {
  const { agentId: agentIdParam } = useParams<{ agentId: string }>();
  const agentId = Number(agentIdParam);
  const agentIdValid = Number.isInteger(agentId) && agentId >= 0 && agentId <= 99;

  const [runsPage, setRunsPage] = useState(1);

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
    queryKey: ["lp-agent", "runs", "detail", agentId, runsPage],
    queryFn: () =>
      fetchLpRuns({
        limit: RUNS_PAGE_SIZE,
        offset: (runsPage - 1) * RUNS_PAGE_SIZE,
        strategyId: agentId,
      }),
    enabled: agentIdValid,
    refetchInterval: 45_000,
  });

  const strategy = useMemo(
    () => (strategiesQ.data || []).find((x) => x.id === agentId) || null,
    [strategiesQ.data, agentId],
  );
  const stats = useMemo(
    () => (statsQ.data?.agents || []).find((x) => x.strategyId === agentId) || null,
    [statsQ.data?.agents, agentId],
  );
  const topCandidates = useMemo(
    () =>
      (candidatesQ.data || [])
        .filter((x) => x.strategyId === agentId)
        .sort((a, b) => b.score - a.score)
        .slice(0, 15),
    [candidatesQ.data, agentId],
  );
  const runsTotalPages = Math.max(1, Math.ceil((runsQ.data?.total || 0) / RUNS_PAGE_SIZE));
  const safeRunsPage = Math.min(runsPage, runsTotalPages);
  const loading = strategiesQ.isLoading || statsQ.isLoading || candidatesQ.isLoading || runsQ.isLoading;
  const failed = strategiesQ.isError || statsQ.isError || candidatesQ.isError || runsQ.isError;

  useEffect(() => {
    if (runsPage > runsTotalPages) {
      setRunsPage(runsTotalPages);
    }
  }, [runsPage, runsTotalPages]);

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
              <Link to="/dashboard/lp-experiment" aria-label="Back to LP experiment">
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <h1 className="text-xl font-semibold tracking-tight">
              {strategy ? strategy.name : agentIdValid ? `LP agent #${agentId}` : "LP agent profile"}
            </h1>
            <AgentBackgroundLiveIndicator openPositions={stats?.openPositions || 0} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Detailed strategy profile, screening logic, candidates, and run-level outcomes.
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

      {!agentIdValid ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Invalid LP agent id in URL.
        </div>
      ) : null}

      {failed ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Failed to load LP agent profile data.
        </div>
      ) : null}

      {loading && !strategy ? (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading agent profile...
        </div>
      ) : null}

      {strategy && stats ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Win rate</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {stats.winRatePct == null ? "—" : `${stats.winRatePct.toFixed(1)}%`}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Record</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {stats.wins}W / {stats.losses}L
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Open</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.openPositions}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg PnL</p>
              <p className={cn("mt-1 text-2xl font-semibold tabular-nums", pnlNumberClass(stats.avgPnlPct))}>
                {stats.avgPnlPct.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg fees</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.avgFeesSol.toFixed(4)} SOL</p>
            </div>
          </div>

          <section className="rounded-xl border border-border/70 bg-card/70 p-4">
            <h2 className="text-sm font-semibold">Strategy configuration</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">LP shape</p>
                <p className="font-medium capitalize">{strategy.lpShape}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Range bins</p>
                <p className="font-medium">
                  {strategy.binsBelow} below / {strategy.binsAbove} above
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Notes</p>
                <p className="font-medium">{strategy.notes || "—"}</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-3">
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Screening overrides</p>
                <pre className="overflow-x-auto text-xs">{JSON.stringify(strategy.screeningOverrides || {}, null, 2)}</pre>
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Signal gate</p>
                <pre className="overflow-x-auto text-xs">{JSON.stringify(strategy.signalGate || {}, null, 2)}</pre>
              </div>
              <div className="rounded-md border border-border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Signal weights / exit</p>
                <pre className="overflow-x-auto text-xs">
                  {JSON.stringify({ signalWeights: strategy.signalWeights || {}, exit: strategy.exit || {} }, null, 2)}
                </pre>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Top candidate pools</h2>
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pool</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">TVL</TableHead>
                    <TableHead className="text-right">24h Vol</TableHead>
                    <TableHead className="text-right">Fee/TVL</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCandidates.map((row) => (
                    <TableRow key={`${row.strategyId}:${row.poolAddress}`}>
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
                  {!loading && topCandidates.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No candidate pools available for this strategy.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold">Run history</h2>
            <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pool</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">PnL %</TableHead>
                    <TableHead className="text-right">Fees (SOL)</TableHead>
                    <TableHead>Resolution</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(runsQ.data?.runs || []).map((run) => (
                    <TableRow key={run._id}>
                      <TableCell>
                        {(run.baseSymbol || "?")}/{run.quoteSymbol || "?"}
                        <span className="ml-2 text-xs text-muted-foreground">· {run.poolName || "Unknown pool"}</span>
                      </TableCell>
                      <TableCell>
                        <RunStatusBadge status={run.status} />
                      </TableCell>
                      <TableCell className={cn("text-right font-medium", pnlNumberClass(run.simPnlPct || 0))}>
                        {(run.simPnlPct || 0).toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-right">{(run.simFeesEarnedSol || 0).toFixed(4)}</TableCell>
                      <TableCell>{run.resolution || "—"}</TableCell>
                      <TableCell>{run.createdAt ? new Date(run.createdAt).toLocaleString() : "—"}</TableCell>
                    </TableRow>
                  ))}
                  {!loading && (runsQ.data?.runs || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        No runs recorded for this strategy yet.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-3 py-2.5 text-xs text-muted-foreground sm:px-4">
                <span>
                  Page {safeRunsPage} / {runsTotalPages} - {runsQ.data?.total || 0} runs
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={safeRunsPage <= 1}
                    onClick={() => setRunsPage((p) => Math.max(1, p - 1))}
                    className="h-8 gap-1.5 px-2.5"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={safeRunsPage >= runsTotalPages}
                    onClick={() => setRunsPage((p) => Math.min(runsTotalPages, p + 1))}
                    className="h-8 gap-1.5 px-2.5"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
