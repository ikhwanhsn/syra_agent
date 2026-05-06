import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, RefreshCw, Waves } from "lucide-react";
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
const RUN_STATUSES: LpRunStatus[] = ["open", "win", "loss", "expired", "skipped", "error"];

export default function LpAgentExperiment({ embedded = false }: { embedded?: boolean }) {
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
    queryKey: ["lp-agent", "runs", runStatus, runSymbol],
    queryFn: () =>
      fetchLpRuns({
        limit: RUNS_PAGE_SIZE,
        offset: 0,
        status: runStatus === "all" ? undefined : runStatus,
        symbol: runSymbol.trim() || undefined,
      }),
    refetchInterval: 45_000,
  });

  const openPositions = useMemo(
    () => (statsQ.data?.agents || []).reduce((sum, x) => sum + (x.openPositions || 0), 0),
    [statsQ.data?.agents],
  );

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
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="runs">Runs</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-3">
          <div className="rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Strategy</TableHead>
                  <TableHead>LP shape</TableHead>
                  <TableHead className="text-right">Wins</TableHead>
                  <TableHead className="text-right">Losses</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                  <TableHead className="text-right">Win %</TableHead>
                  <TableHead className="text-right">Avg PnL %</TableHead>
                  <TableHead className="text-right">Avg fees (SOL)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(statsQ.data?.agents || []).map((row) => (
                  <TableRow key={row.strategyId}>
                    <TableCell className="font-medium">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{row.strategyName}</span>
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
                    <TableCell className="text-right">{row.avgPnlPct.toFixed(2)}%</TableCell>
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
          <div className="rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Pool</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="text-right">TVL</TableHead>
                  <TableHead className="text-right">24h Vol</TableHead>
                  <TableHead className="text-right">Fee/TVL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(candidatesQ.data || []).slice(0, 60).map((row) => (
                  <TableRow key={`${row.strategyId}:${row.poolAddress}`}>
                    <TableCell className="font-medium">{row.strategyName}</TableCell>
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
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="runs" className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={runStatus}
              onChange={(e) => setRunStatus(e.target.value)}
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
              onChange={(e) => setRunSymbol(e.target.value)}
              placeholder="Filter by symbol or pool"
              className="max-w-xs"
            />
            <Button size="sm" variant="outline" onClick={() => runsQ.refetch()}>
              Apply
            </Button>
          </div>
          <div className="rounded-xl border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Strategy</TableHead>
                  <TableHead>Pool</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">PnL %</TableHead>
                  <TableHead className="text-right">Fees (SOL)</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(runsQ.data?.runs || []).map((run) => (
                  <TableRow key={run._id}>
                    <TableCell className="font-medium">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{run.strategyName}</span>
                        <AgentBackgroundLiveIndicator openPositions={run.status === "open" ? 1 : 0} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {(run.baseSymbol || "?")}/{run.quoteSymbol || "?"}
                    </TableCell>
                    <TableCell>{run.status}</TableCell>
                    <TableCell className="text-right">{(run.simPnlPct || 0).toFixed(2)}%</TableCell>
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
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
