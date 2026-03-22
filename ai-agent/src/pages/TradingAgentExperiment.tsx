import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FlaskConical,
  Loader2,
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
  postTradingExperimentRunCycle,
  postTradingExperimentValidateTick,
  type TradingExperimentAgentStats,
  type TradingExperimentRunRow,
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

function formatTime(iso: string | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

export default function TradingAgentExperiment() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => !document.documentElement.classList.contains("light"),
  );
  const [agents, setAgents] = useState<TradingExperimentAgentStats[]>([]);
  const [runs, setRuns] = useState<TradingExperimentRunRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningCycle, setRunningCycle] = useState(false);
  const [runningValidate, setRunningValidate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cycleMessage, setCycleMessage] = useState<string | null>(null);

  const cronSecret =
    typeof import.meta.env.VITE_TRADING_EXPERIMENT_CRON_SECRET === "string"
      ? import.meta.env.VITE_TRADING_EXPERIMENT_CRON_SECRET
      : undefined;

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [stats, runRows] = await Promise.all([
        fetchTradingExperimentStats(),
        fetchTradingExperimentRuns(80),
      ]);
      setAgents(stats.agents);
      setRuns(runRows);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
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

  const onRunCycle = async () => {
    setRunningCycle(true);
    setCycleMessage(null);
    try {
      const out = await postTradingExperimentRunCycle(cronSecret);
      setCycleMessage(
        `Validated + sampled: resolved ${out.resolved}, new rows ${out.sampled}${out.errors.length ? ` — ${out.errors.length} error(s)` : ""}`,
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
      <header className="border-b border-border sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Chat
            </Button>
          </Link>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FlaskConical className="w-5 h-5 text-primary shrink-0" />
            <h1 className="text-lg font-semibold truncate">Trading agent experiment</h1>
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

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-10">
        <section className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ten strategies use the same <strong className="text-foreground">Binance spot OHLC</strong> + Syra engine
            as <code className="text-xs bg-muted px-1 rounded">/signal</code> (no x402). New BUYs are sampled on a{" "}
            <strong className="text-foreground">slow</strong> cadence (e.g. hourly);{" "}
            <strong className="text-foreground">TP/SL validation</strong> runs on a <strong className="text-foreground">fast</strong>{" "}
            cadence (e.g. every 10s) using <strong className="text-foreground">1m</strong> klines so wicks are not
            missed. Win rate = wins / (wins + losses).
          </p>
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

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <section>
          <h2 className="text-base font-semibold mb-3">Agents & win rate</h2>
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
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
                    <TableCell className="font-medium">{a.name}</TableCell>
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
          <h2 className="text-base font-semibold mb-3">Recent runs</h2>
          <div className="rounded-md border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Agent</TableHead>
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
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No runs yet. Run a server cycle or enable{" "}
                      <code className="text-xs bg-muted px-1 rounded">TRADING_EXPERIMENT_CRON_MS</code>.
                    </TableCell>
                  </TableRow>
                ) : (
                  runs.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {formatTime(r.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="font-mono text-muted-foreground">{r.agentId}</span>{" "}
                        <span className="hidden sm:inline">{r.agentName}</span>
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
                      <TableCell className="text-xs text-muted-foreground max-w-[180px] truncate">
                        {r.resolution ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
    </div>
  );
}
