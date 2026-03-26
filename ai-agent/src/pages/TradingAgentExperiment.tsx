import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  ListFilter,
  Loader2,
  Medal,
  Trophy,
  RefreshCw,
  Play,
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
  TRADING_EXPERIMENT_RUN_STATUSES,
  postTradingExperimentRunCycle,
  postTradingExperimentValidateTick,
  type TradingExperimentAgentStats,
  type TradingExperimentRunRow,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TradingExperimentChartsPanel } from "@/components/experiment/TradingExperimentChartsPanel";

const RUNS_PAGE_SIZE = 20;
const CHART_RUN_SAMPLE = 200;
const RUN_FILTER_ALL = "all";

/** Resolved wins+losses at or above this count use full win-rate ranking. */
const LEADERBOARD_MIN_DECIDED = 5;

type PageView = "lab" | "leaderboard";

function leaderboardTier(a: TradingExperimentAgentStats): 0 | 1 | 2 {
  if (a.decided === 0) return 2;
  if (a.decided < LEADERBOARD_MIN_DECIDED) return 1;
  return 0;
}

function sortAgentsForLeaderboard(list: TradingExperimentAgentStats[]): TradingExperimentAgentStats[] {
  return [...list].sort((x, y) => {
    const tx = leaderboardTier(x);
    const ty = leaderboardTier(y);
    if (tx !== ty) return tx - ty;
    const rx = x.winRate ?? -1;
    const ry = y.winRate ?? -1;
    if (ry !== rx) return ry - rx;
    if (y.wins !== x.wins) return y.wins - x.wins;
    if (y.decided !== x.decided) return y.decided - x.decided;
    return x.agentId - y.agentId;
  });
}

function statusOptionLabel(s: string) {
  return s.replace(/_/g, " ");
}

function formatTime(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

export default function TradingAgentExperiment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDarkMode, setIsDarkMode] = useState(
    () => !document.documentElement.classList.contains("light"),
  );
  const [activeSuite, setActiveSuite] = useState<TradingExperimentSuiteId>("primary");
  const [suiteMeta, setSuiteMeta] = useState<TradingExperimentSuiteMeta[]>([]);
  const [agents, setAgents] = useState<TradingExperimentAgentStats[]>([]);
  const [chartSampleRuns, setChartSampleRuns] = useState<TradingExperimentRunRow[]>([]);
  const [runs, setRuns] = useState<TradingExperimentRunRow[]>([]);
  const [runsTotal, setRunsTotal] = useState(0);
  const [runsPage, setRunsPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState(RUN_FILTER_ALL);
  const [filterAgentId, setFilterAgentId] = useState(RUN_FILTER_ALL);
  const [symbolInput, setSymbolInput] = useState("");
  const [signalInput, setSignalInput] = useState("");
  const [debouncedSymbol, setDebouncedSymbol] = useState("");
  const [debouncedSignal, setDebouncedSignal] = useState("");
  const symbolDebounceFirst = useRef(true);
  const signalDebounceFirst = useRef(true);
  const [pageView, setPageView] = useState<PageView>("lab");
  const [loading, setLoading] = useState(true);
  const [runningCycle, setRunningCycle] = useState(false);
  const [runningValidate, setRunningValidate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cycleMessage, setCycleMessage] = useState<string | null>(null);

  const cronSecret =
    typeof import.meta.env.VITE_TRADING_EXPERIMENT_CRON_SECRET === "string"
      ? import.meta.env.VITE_TRADING_EXPERIMENT_CRON_SECRET
      : undefined;

  useEffect(() => {
    if (symbolDebounceFirst.current) {
      symbolDebounceFirst.current = false;
      setDebouncedSymbol(symbolInput.trim());
      return;
    }
    const h = window.setTimeout(() => {
      setDebouncedSymbol(symbolInput.trim());
      setRunsPage(1);
    }, 400);
    return () => window.clearTimeout(h);
  }, [symbolInput]);

  useEffect(() => {
    if (signalDebounceFirst.current) {
      signalDebounceFirst.current = false;
      setDebouncedSignal(signalInput.trim());
      return;
    }
    const h = window.setTimeout(() => {
      setDebouncedSignal(signalInput.trim());
      setRunsPage(1);
    }, 400);
    return () => window.clearTimeout(h);
  }, [signalInput]);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      if (pageView === "leaderboard") {
        const stats = await fetchTradingExperimentStats(activeSuite);
        setAgents(stats.agents);
      } else {
        const offset = (runsPage - 1) * RUNS_PAGE_SIZE;
        const agentNum =
          filterAgentId !== RUN_FILTER_ALL ? Number(filterAgentId) : undefined;
        const [stats, runData] = await Promise.all([
          fetchTradingExperimentStats(activeSuite),
          fetchTradingExperimentRuns({
            limit: RUNS_PAGE_SIZE,
            offset,
            suite: activeSuite,
            ...(filterStatus !== RUN_FILTER_ALL ? { status: filterStatus } : {}),
            ...(agentNum != null && Number.isInteger(agentNum) ? { agentId: agentNum } : {}),
            ...(debouncedSymbol ? { symbol: debouncedSymbol } : {}),
            ...(debouncedSignal ? { signal: debouncedSignal } : {}),
          }),
        ]);
        setAgents(stats.agents);
        setRuns(runData.runs);
        setRunsTotal(runData.total);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [
    pageView,
    activeSuite,
    runsPage,
    filterStatus,
    filterAgentId,
    debouncedSymbol,
    debouncedSignal,
  ]);

  const rankedAgents = useMemo(() => sortAgentsForLeaderboard(agents), [agents]);

  const hasRunFilters =
    filterStatus !== RUN_FILTER_ALL ||
    filterAgentId !== RUN_FILTER_ALL ||
    debouncedSymbol.length > 0 ||
    debouncedSignal.length > 0;

  const clearRunFilters = () => {
    setFilterStatus(RUN_FILTER_ALL);
    setFilterAgentId(RUN_FILTER_ALL);
    setSymbolInput("");
    setSignalInput("");
    setDebouncedSymbol("");
    setDebouncedSignal("");
    symbolDebounceFirst.current = true;
    signalDebounceFirst.current = true;
    setRunsPage(1);
  };

  useEffect(() => {
    fetchTradingExperimentSuites()
      .then(setSuiteMeta)
      .catch(() => setSuiteMeta([]));
  }, []);

  useEffect(() => {
    const raw = searchParams.get("suite");
    if (raw) {
      setActiveSuite(normalizeExperimentSuite(raw));
    }
  }, [searchParams]);

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

  const activeSuiteDescription = suiteMeta.find((m) => m.id === activeSuite)?.description;

  const resetSuiteFilters = () => {
    setRunsPage(1);
    setFilterStatus(RUN_FILTER_ALL);
    setFilterAgentId(RUN_FILTER_ALL);
    setSymbolInput("");
    setSignalInput("");
    setDebouncedSymbol("");
    setDebouncedSignal("");
    symbolDebounceFirst.current = true;
    signalDebounceFirst.current = true;
  };

  const onSuiteChange = (v: string) => {
    const id = v as TradingExperimentSuiteId;
    setActiveSuite(id);
    setSearchParams({ suite: id });
    resetSuiteFilters();
  };

  const agentProfileHref = (agentId: number) =>
    `/experiment/trading-agent/agent/${agentId}?suite=${encodeURIComponent(activeSuite)}`;

  const onRunCycle = async () => {
    setRunningCycle(true);
    setCycleMessage(null);
    try {
      const out = await postTradingExperimentRunCycle(cronSecret);
      const by =
        out.bySuite && Object.keys(out.bySuite).length > 0
          ? ` (${Object.entries(out.bySuite)
              .map(([k, v]) => `${k}=${v}`)
              .join(", ")})`
          : "";
      setCycleMessage(
        `Validated + sampled: resolved ${out.resolved}, new rows ${out.sampled}${by}${out.errors.length ? ` — ${out.errors.length} error(s)` : ""}`,
      );
      await load();
    } catch (e) {
      setCycleMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRunningCycle(false);
    }
  };

  const onValidateTick = async () => {
    setRunningValidate(true);
    setCycleMessage(null);
    try {
      const out = await postTradingExperimentValidateTick(cronSecret);
      setCycleMessage(
        `1m validation: closed ${out.resolved} / ${out.touched} open${out.errors.length ? ` — ${out.errors.length} error(s)` : ""}`,
      );
      await load();
    } catch (e) {
      setCycleMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setRunningValidate(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between gap-2 sm:gap-4 px-2 py-2 sm:px-4 sm:py-3 border-b border-border bg-background/80 backdrop-blur-xl min-h-[52px] shrink-0 sticky top-0 z-20">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link to="/">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 shrink-0"
                title="Back to chat"
                aria-label="Back to chat"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 min-w-0">
              <FlaskConical className="w-5 h-5 text-primary shrink-0" />
              <h1 className="text-sm font-bold text-foreground truncate">Trading agent experiment</h1>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setIsDarkMode((d) => !d)}
              title={isDarkMode ? "Light mode" : "Dark mode"}
              aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <WalletNav />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Tabs
          value={pageView}
          onValueChange={(v) => setPageView(v as PageView)}
          className="w-full"
        >
          <TabsList className="h-auto min-h-10 flex-wrap gap-1 p-1 w-full sm:w-auto">
            <TabsTrigger value="lab" className="text-xs sm:text-sm gap-1.5">
              <FlaskConical className="h-3.5 w-3.5 opacity-70" aria-hidden />
              Lab
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs sm:text-sm gap-1.5">
              <Trophy className="h-3.5 w-3.5 opacity-70" aria-hidden />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="charts" className="text-xs sm:text-sm gap-1.5">
              <BarChart3 className="h-3.5 w-3.5 opacity-70" aria-hidden />
              Charts
            </TabsTrigger>
          </TabsList>

        {error ? (
          <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

          <TabsContent value="lab" className="mt-6 space-y-10 outline-none">
            <Tabs value={activeSuite} onValueChange={onSuiteChange} className="w-full">
              <TabsList className="h-auto min-h-10 flex-wrap gap-1 p-1">
                <TabsTrigger value="primary" className="text-xs sm:text-sm">
                  {suiteMeta.find((m) => m.id === "primary")?.title ?? "Experiment 1"}
                </TabsTrigger>
                <TabsTrigger value="secondary" className="text-xs sm:text-sm">
                  {suiteMeta.find((m) => m.id === "secondary")?.title ?? "Experiment 2"}
                </TabsTrigger>
              </TabsList>
            </Tabs>

        <section className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Two isolated experiments</strong> (tabs above): separate agent matrices
            and win-rate ledgers. Each uses <strong className="text-foreground">Binance spot OHLC</strong> + the same Syra
            engine as <code className="text-xs bg-muted px-1 rounded">/signal</code> (no x402). The server samples new
            BUYs for <strong className="text-foreground">both</strong> suites on the hourly job;{" "}
            <strong className="text-foreground">TP/SL validation</strong> runs every ~10s on{" "}
            <strong className="text-foreground">1m</strong> klines for <strong className="text-foreground">all</strong>{" "}
            open positions. Win rate = wins / (wins + losses) within the selected tab only.
          </p>
          {activeSuiteDescription ? (
            <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3">{activeSuiteDescription}</p>
          ) : null}
          <div className="flex flex-wrap gap-2 items-center">
            <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Refresh
            </Button>
            <Button size="sm" onClick={onValidateTick} disabled={runningValidate} variant="secondary" className="gap-2">
              {runningValidate ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Validate (1m tick)
            </Button>
            <Button size="sm" onClick={onRunCycle} disabled={runningCycle} className="gap-2">
              {runningCycle ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Full cycle
            </Button>
            {cycleMessage && (
              <span className="text-xs text-muted-foreground max-w-md">{cycleMessage}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Server: <code className="bg-muted px-1 rounded">TRADING_EXPERIMENT_SIGNAL_CRON_MS=3600000</code> (hourly
            samples) and{" "}
            <code className="bg-muted px-1 rounded">TRADING_EXPERIMENT_VALIDATE_CRON_MS=10000</code> (10s 1m TP/SL).
            Legacy: only <code className="bg-muted px-1 rounded">TRADING_EXPERIMENT_CRON_MS</code> runs a combined
            full cycle on that interval (if the two new vars are unset). Secret:{" "}
            <code className="bg-muted px-1 rounded">TRADING_EXPERIMENT_CRON_SECRET</code> → header{" "}
            <code className="bg-muted px-1 rounded">x-trading-experiment-secret</code> on POST{" "}
            <code className="bg-muted px-1 rounded">/validate-tick</code>,{" "}
            <code className="bg-muted px-1 rounded">/signal-tick</code>,{" "}
            <code className="bg-muted px-1 rounded">/run-cycle</code>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-3">Agents & win rate</h2>
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  {activeSuite === "multi_resource" ? <TableHead>CEX</TableHead> : null}
                  <TableHead>Pair</TableHead>
                  <TableHead>Bar</TableHead>
                  <TableHead className="text-right">W</TableHead>
                  <TableHead className="text-right">L</TableHead>
                  <TableHead className="text-right">Win %</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map((a) => (
                  <TableRow key={a.agentId}>
                    <TableCell className="font-mono text-muted-foreground">{a.agentId}</TableCell>
                    <TableCell className="font-medium">
                      <Link
                        to={agentProfileHref(a.agentId)}
                        className="text-primary hover:underline underline-offset-2"
                      >
                        {a.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{a.token}</TableCell>
                    <TableCell className="text-muted-foreground">{a.bar}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.wins}</TableCell>
                    <TableCell className="text-right tabular-nums">{a.losses}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {a.winRatePct != null ? `${a.winRatePct}%` : "—"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{a.openPositions}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <h2 className="text-base font-semibold">Recent runs</h2>
            {!loading && runsTotal > 0 ? (
              <p className="text-sm text-muted-foreground tabular-nums">
                {(runsPage - 1) * RUNS_PAGE_SIZE + 1}–{Math.min(runsPage * RUNS_PAGE_SIZE, runsTotal)} of {runsTotal}
              </p>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ListFilter className="h-4 w-4 text-muted-foreground" aria-hidden />
                Filter runs
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                disabled={!hasRunFilters}
                onClick={clearRunFilters}
              >
                Clear filters
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="run-filter-status" className="text-xs text-muted-foreground">
                  Status
                </Label>
                <Select
                  value={filterStatus}
                  onValueChange={(v) => {
                    setFilterStatus(v);
                    setRunsPage(1);
                  }}
                >
                  <SelectTrigger id="run-filter-status" className="h-9 text-sm">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RUN_FILTER_ALL}>All statuses</SelectItem>
                    {TRADING_EXPERIMENT_RUN_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusOptionLabel(s)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="run-filter-agent" className="text-xs text-muted-foreground">
                  Agent
                </Label>
                <Select
                  value={filterAgentId}
                  onValueChange={(v) => {
                    setFilterAgentId(v);
                    setRunsPage(1);
                  }}
                >
                  <SelectTrigger id="run-filter-agent" className="h-9 text-sm">
                    <SelectValue placeholder="All agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RUN_FILTER_ALL}>All agents</SelectItem>
                    {[...agents]
                      .sort((a, b) => a.agentId - b.agentId)
                      .map((a) => (
                        <SelectItem key={a.agentId} value={String(a.agentId)}>
                          <span className="font-mono">{a.agentId}</span> {a.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="run-filter-symbol" className="text-xs text-muted-foreground">
                  Symbol contains
                </Label>
                <Input
                  id="run-filter-symbol"
                  className="h-9 text-sm"
                  placeholder="e.g. BTCUSDT"
                  value={symbolInput}
                  onChange={(e) => setSymbolInput(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="run-filter-signal" className="text-xs text-muted-foreground">
                  Signal contains
                </Label>
                <Input
                  id="run-filter-signal"
                  className="h-9 text-sm"
                  placeholder="e.g. BUY"
                  value={signalInput}
                  onChange={(e) => setSignalInput(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Agent</TableHead>
                  {activeSuite === "multi_resource" ? <TableHead>CEX</TableHead> : null}
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
                {runs.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={activeSuite === "multi_resource" ? 10 : 9}
                      className="text-center text-muted-foreground py-8"
                    >
                      {hasRunFilters ? (
                        "No runs match these filters. Try clearing filters or changing page."
                      ) : (
                        <>
                          No runs yet. Run a server cycle or enable{" "}
                          <code className="text-xs bg-muted px-1 rounded">TRADING_EXPERIMENT_CRON_MS</code>.
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatTime(r.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm max-w-[140px] sm:max-w-none">
                        <span className="font-mono text-muted-foreground">{r.agentId}</span>{" "}
                        <Link
                          to={agentProfileHref(r.agentId)}
                          className="text-primary hover:underline underline-offset-2 truncate inline-block align-bottom max-w-[100px] sm:max-w-none sm:inline"
                          title={r.agentName}
                        >
                          {r.agentName}
                        </Link>
                      </TableCell>
                      {activeSuite === "multi_resource" ? (
                        <TableCell className="text-xs font-mono text-muted-foreground">{r.cexSource ?? "—"}</TableCell>
                      ) : null}
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
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                        {r.resolution ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {runsTotal > RUNS_PAGE_SIZE || runsPage > 1 ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4">
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
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-6 space-y-8 outline-none">
            <Tabs value={activeSuite} onValueChange={onSuiteChange} className="w-full">
              <TabsList className="h-auto min-h-10 flex-wrap gap-1 p-1">
                <TabsTrigger value="primary" className="text-xs sm:text-sm">
                  {suiteMeta.find((m) => m.id === "primary")?.title ?? "Experiment 1"}
                </TabsTrigger>
                <TabsTrigger value="secondary" className="text-xs sm:text-sm">
                  {suiteMeta.find((m) => m.id === "secondary")?.title ?? "Experiment 2"}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <section className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500 shrink-0" aria-hidden />
                  Who&apos;s ahead
                </h2>
                <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh
                </Button>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                Agents with at least{" "}
                <strong className="text-foreground">{LEADERBOARD_MIN_DECIDED}</strong> resolved outcomes (wins +
                losses) are ranked by <strong className="text-foreground">win rate</strong>, then wins. Others show as
                building a sample or waiting for first trade. Open positions are not counted until closed.
              </p>
              {activeSuiteDescription ? (
                <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3">{activeSuiteDescription}</p>
              ) : null}
            </section>

            {!loading && rankedAgents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-lg">
                No agents loaded for this experiment yet.
              </p>
            ) : null}

            {rankedAgents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-3">
                {rankedAgents.slice(0, 3).map((a, i) => {
                  const tier = leaderboardTier(a);
                  const rank = i + 1;
                  const border =
                    rank === 1
                      ? "border-amber-500/50 bg-amber-500/5"
                      : rank === 2
                        ? "border-slate-400/40 bg-slate-500/5"
                        : "border-amber-800/30 bg-amber-950/10";
                  return (
                    <div
                      key={a.agentId}
                      className={cn(
                        "rounded-xl border p-4 flex flex-col gap-2 min-h-[140px]",
                        border,
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-2xl font-bold tabular-nums text-muted-foreground">#{rank}</span>
                        {rank <= 3 ? (
                          <Medal
                            className={cn(
                              "h-7 w-7 shrink-0",
                              rank === 1 && "text-amber-500",
                              rank === 2 && "text-slate-400",
                              rank === 3 && "text-amber-700 dark:text-amber-600",
                            )}
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <Link
                        to={agentProfileHref(a.agentId)}
                        className="font-semibold leading-tight text-foreground hover:text-primary hover:underline underline-offset-2"
                      >
                        {a.name}
                      </Link>
                      <p className="text-xs text-muted-foreground font-mono">
                        #{a.agentId} · {a.token} · {a.bar}
                      </p>
                      <div className="mt-auto pt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                        <span className="text-lg font-semibold tabular-nums">
                          {a.winRatePct != null ? `${a.winRatePct}%` : "—"}
                        </span>
                        <span className="text-muted-foreground tabular-nums">
                          {a.wins}W / {a.losses}L
                          {a.openPositions > 0 ? ` · ${a.openPositions} open` : ""}
                        </span>
                      </div>
                      {tier === 1 ? (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Building sample</span>
                      ) : null}
                      {tier === 2 ? (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">No closes yet</span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            {rankedAgents.length > 0 ? (
              <div className="rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Rank</TableHead>
                      <TableHead>Agent</TableHead>
                      <TableHead>Pair</TableHead>
                      <TableHead>Bar</TableHead>
                      <TableHead className="text-right">W</TableHead>
                      <TableHead className="text-right">L</TableHead>
                      <TableHead className="text-right">Win %</TableHead>
                      <TableHead className="text-right">Open</TableHead>
                      <TableHead className="text-right">Sample</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankedAgents.map((a, idx) => {
                      const tier = leaderboardTier(a);
                      const tierLabel =
                        tier === 0 ? `${LEADERBOARD_MIN_DECIDED}+` : tier === 1 ? `<${LEADERBOARD_MIN_DECIDED}` : "—";
                      return (
                        <TableRow
                          key={a.agentId}
                          className={cn(
                            idx === 0 && "bg-amber-500/5",
                            idx === 1 && "bg-slate-500/5",
                            idx === 2 && "bg-amber-950/10",
                          )}
                        >
                          <TableCell className="font-semibold tabular-nums text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell>
                            <Link
                              to={agentProfileHref(a.agentId)}
                              className="font-medium text-primary hover:underline underline-offset-2"
                            >
                              {a.name}
                            </Link>
                            <span className="font-mono text-xs text-muted-foreground ml-2">#{a.agentId}</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{a.token}</TableCell>
                          <TableCell className="text-muted-foreground">{a.bar}</TableCell>
                          <TableCell className="text-right tabular-nums">{a.wins}</TableCell>
                          <TableCell className="text-right tabular-nums">{a.losses}</TableCell>
                          <TableCell className="text-right tabular-nums font-medium">
                            {a.winRatePct != null ? `${a.winRatePct}%` : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{a.openPositions}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground tabular-nums">{tierLabel}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </TabsContent>

          <TabsContent value="charts" className="mt-6 space-y-8 outline-none">
            <Tabs value={activeSuite} onValueChange={onSuiteChange} className="w-full">
              <TabsList className="h-auto min-h-10 flex-wrap gap-1 p-1">
                <TabsTrigger value="primary" className="text-xs sm:text-sm">
                  {suiteMeta.find((m) => m.id === "primary")?.title ?? "Experiment 1"}
                </TabsTrigger>
                <TabsTrigger value="secondary" className="text-xs sm:text-sm">
                  {suiteMeta.find((m) => m.id === "secondary")?.title ?? "Experiment 2"}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <section className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary shrink-0" aria-hidden />
                  Visual overview
                </h2>
                <Button variant="outline" size="sm" onClick={() => load()} disabled={loading} className="gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Refresh
                </Button>
              </div>
              {activeSuiteDescription ? (
                <p className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3">{activeSuiteDescription}</p>
              ) : null}
            </section>

            <TradingExperimentChartsPanel
              agents={agents}
              chartRuns={chartSampleRuns}
              loading={loading}
              agentProfileHref={agentProfileHref}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
