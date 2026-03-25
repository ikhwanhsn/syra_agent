import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  Loader2,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { WalletNav } from "@/components/chat/WalletNav";
import {
  fetchTradingExperimentRuns,
  fetchTradingExperimentStats,
  fetchTradingExperimentSuites,
  normalizeExperimentSuite,
  type TradingExperimentAgentStats,
  type TradingExperimentRunRow,
  type TradingExperimentStrategy,
  type TradingExperimentSuiteId,
  type TradingExperimentSuiteMeta,
} from "@/lib/tradingExperimentApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const RUNS_PAGE_SIZE = 15;

function formatTime(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

export default function TradingAgentExperimentAgentProfile() {
  const { agentId: agentIdParam } = useParams<{ agentId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const suite = normalizeExperimentSuite(searchParams.get("suite"));

  const parsedAgentId = agentIdParam != null ? parseInt(agentIdParam, 10) : NaN;
  const agentIdValid = Number.isInteger(parsedAgentId) && parsedAgentId >= 0 && parsedAgentId <= 999;

  const [isDarkMode, setIsDarkMode] = useState(
    () => !document.documentElement.classList.contains("light"),
  );
  const [suiteMeta, setSuiteMeta] = useState<TradingExperimentSuiteMeta[]>([]);
  const [strategy, setStrategy] = useState<TradingExperimentStrategy | null>(null);
  const [agent, setAgent] = useState<TradingExperimentAgentStats | null>(null);
  const [runs, setRuns] = useState<TradingExperimentRunRow[]>([]);
  const [runsTotal, setRunsTotal] = useState(0);
  const [runsPage, setRunsPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setSuite = (next: TradingExperimentSuiteId) => {
    setSearchParams({ suite: next });
    setRunsPage(1);
  };

  const load = useCallback(async () => {
    if (!agentIdValid) {
      setLoading(false);
      setError(null);
      setStrategy(null);
      setAgent(null);
      setRuns([]);
      setRunsTotal(0);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const offset = (runsPage - 1) * RUNS_PAGE_SIZE;
      const [stats, runData] = await Promise.all([
        fetchTradingExperimentStats(suite),
        fetchTradingExperimentRuns({
          limit: RUNS_PAGE_SIZE,
          offset,
          suite,
          agentId: parsedAgentId,
        }),
      ]);
      const strat = stats.strategies.find((s) => s.id === parsedAgentId) ?? null;
      const ag = stats.agents.find((a) => a.agentId === parsedAgentId) ?? null;
      if (!strat) {
        setStrategy(null);
        setAgent(null);
        setRuns([]);
        setRunsTotal(0);
        setError(`No agent #${parsedAgentId} in this experiment suite.`);
      } else {
        setStrategy(strat);
        setAgent(ag);
        setRuns(runData.runs);
        setRunsTotal(runData.total);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStrategy(null);
      setAgent(null);
      setRuns([]);
      setRunsTotal(0);
    } finally {
      setLoading(false);
    }
  }, [agentIdValid, parsedAgentId, suite, runsPage]);

  useEffect(() => {
    fetchTradingExperimentSuites()
      .then(setSuiteMeta)
      .catch(() => setSuiteMeta([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
    }
  }, [isDarkMode]);

  const backHref = `/experiment/trading-agent?suite=${encodeURIComponent(suite)}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link to={backHref}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Experiment
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FlaskConical className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-lg font-semibold truncate">
              {strategy ? strategy.name : agentIdValid ? `Agent #${parsedAgentId}` : "Agent profile"}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDarkMode((d) => !d)}
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <WalletNav />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {!agentIdValid ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Invalid agent id in URL.
          </div>
        ) : null}

        <Tabs value={suite} onValueChange={(v) => setSuite(v as TradingExperimentSuiteId)} className="w-full">
          <TabsList className="h-auto min-h-10 flex-wrap gap-1 p-1">
            <TabsTrigger value="primary" className="text-xs sm:text-sm">
              {suiteMeta.find((m) => m.id === "primary")?.title ?? "Experiment 1"}
            </TabsTrigger>
            <TabsTrigger value="secondary" className="text-xs sm:text-sm">
              {suiteMeta.find((m) => m.id === "secondary")?.title ?? "Experiment 2"}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {error && agentIdValid ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {strategy && agent ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-mono">Agent #{parsedAgentId}</p>
                <h2 className="text-2xl font-semibold tracking-tight mt-1">{strategy.name}</h2>
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium text-foreground">{strategy.token}</span> · {strategy.bar} bars ·{" "}
                  {strategy.limit} klines lookback
                  {strategy.source ? (
                    <>
                      {" "}
                      · <span className="font-mono text-xs">{strategy.source}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="gap-2 shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Refresh
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Win rate</p>
                <p className="text-2xl font-semibold tabular-nums mt-1">
                  {agent.winRatePct != null ? `${agent.winRatePct}%` : "—"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Closed wins / (wins + losses)</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Record</p>
                <p className="text-2xl font-semibold tabular-nums mt-1">
                  {agent.wins}W / {agent.losses}L
                </p>
                <p className="text-xs text-muted-foreground mt-1">{agent.decided} resolved outcomes</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Open</p>
                <p className="text-2xl font-semibold tabular-nums mt-1">{agent.openPositions}</p>
                <p className="text-xs text-muted-foreground mt-1">Positions awaiting TP/SL or expiry</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Forward window</p>
                <p className="text-2xl font-semibold tabular-nums mt-1">{strategy.lookAheadBars}</p>
                <p className="text-xs text-muted-foreground mt-1">Max bars checked after signal anchor</p>
              </div>
            </div>

            <section className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
                <BarChart3 className="h-4 w-4 text-muted-foreground" aria-hidden />
                <h3 className="text-sm font-semibold">Strategy configuration</h3>
              </div>
              <dl className="grid sm:grid-cols-2 gap-3 p-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium">{strategy.name}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Token key</dt>
                  <dd className="font-mono">{strategy.token}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Bar interval</dt>
                  <dd className="font-mono">{strategy.bar}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Kline limit</dt>
                  <dd className="tabular-nums">{strategy.limit}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Look-ahead bars</dt>
                  <dd className="tabular-nums">{strategy.lookAheadBars}</dd>
                </div>
                {agent.cexSource ? (
                  <div>
                    <dt className="text-muted-foreground">CEX source</dt>
                    <dd className="font-mono text-xs">{agent.cexSource}</dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </>
        ) : null}

        {loading && agentIdValid && !strategy ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading agent…
          </div>
        ) : null}

        {strategy && agent ? (
          <section className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-base font-semibold">Recent runs</h3>
              {runsTotal > 0 ? (
                <p className="text-sm text-muted-foreground tabular-nums">
                  {(runsPage - 1) * RUNS_PAGE_SIZE + 1}–{Math.min(runsPage * RUNS_PAGE_SIZE, runsTotal)} of{" "}
                  {runsTotal}
                </p>
              ) : null}
            </div>
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Signal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Entry</TableHead>
                    <TableHead className="text-right">SL</TableHead>
                    <TableHead className="text-right">TP1</TableHead>
                    <TableHead>Resolution</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No runs recorded for this agent in this suite yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    runs.map((r) => (
                      <TableRow key={r._id}>
                        <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                          {formatTime(r.createdAt)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.symbol}</TableCell>
                        <TableCell>{r.clearSignal}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "text-xs font-medium px-1.5 py-0.5 rounded",
                              r.status === "win" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
                              r.status === "loss" && "bg-red-500/15 text-red-600 dark:text-red-400",
                              r.status === "open" && "bg-amber-500/15 text-amber-700 dark:text-amber-400",
                              (r.status === "skipped_non_buy" || r.status === "skipped_invalid_levels") &&
                                "bg-muted text-muted-foreground",
                            )}
                          >
                            {r.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {r.entry != null ? r.entry.toFixed(4) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {r.stopLoss != null ? r.stopLoss.toFixed(4) : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-xs">
                          {r.firstTarget != null ? r.firstTarget.toFixed(4) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {r.resolution ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {runsTotal > RUNS_PAGE_SIZE || runsPage > 1 ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Page {runsPage} of {Math.max(1, Math.ceil(runsTotal / RUNS_PAGE_SIZE))}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={loading || runsPage <= 1}
                    onClick={() => setRunsPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    disabled={loading || runsPage * RUNS_PAGE_SIZE >= runsTotal}
                    onClick={() => setRunsPage((p) => p + 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
      </main>
    </div>
  );
}
