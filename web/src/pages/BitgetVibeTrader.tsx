import { useCallback, useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  Bot,
  Download,
  Loader2,
  Play,
  RefreshCw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { WalletNav } from "@/components/chat/WalletNav";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import {
  compileVibeStrategy,
  createVibeSession,
  exportVibeMetricsCsv,
  fetchBitgetVibeConfig,
  fetchVibeSession,
  listVibeSessions,
  tickVibeSession,
  type LoopPhase,
  type StrategySpec,
  type VibeExecutionMode,
  type VibeSessionDetail,
} from "@/lib/bitgetVibeApi";
import { useToast } from "@/hooks/use-toast";

const PHASE_ORDER: LoopPhase[] = [
  "perceive",
  "decide",
  "risk",
  "execute",
  "manage",
  "exit",
];

const EXAMPLE_PROMPT =
  "Scalp BTC on Bitget when RSI drops below 35 on the 1h chart. Take 2% profit and 1% stop loss. Hold up to 48 bars.";

function phaseBadgeClass(phase: LoopPhase): string {
  const map: Record<LoopPhase, string> = {
    perceive: "bg-blue-500/15 text-blue-400",
    decide: "bg-violet-500/15 text-violet-400",
    risk: "bg-amber-500/15 text-amber-400",
    execute: "bg-emerald-500/15 text-emerald-400",
    manage: "bg-slate-500/15 text-slate-300",
    exit: "bg-rose-500/15 text-rose-400",
    skip: "bg-muted text-muted-foreground",
  };
  return map[phase] ?? "bg-muted";
}

function StrategyPreview({ spec }: { spec: StrategySpec }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Token</dt>
      <dd className="font-medium">{spec.token}</dd>
      <dt className="text-muted-foreground">Timeframe</dt>
      <dd>{spec.bar}</dd>
      <dt className="text-muted-foreground">Take profit</dt>
      <dd>{spec.takeProfitPct != null ? `${spec.takeProfitPct}%` : "engine"}</dd>
      <dt className="text-muted-foreground">Stop loss</dt>
      <dd>{spec.stopLossPct != null ? `${spec.stopLossPct}%` : "engine"}</dd>
      {spec.minRsi != null && (
        <>
          <dt className="text-muted-foreground">Min RSI</dt>
          <dd>{spec.minRsi}</dd>
        </>
      )}
      <dt className="col-span-2 text-muted-foreground pt-1">Entry</dt>
      <dd className="col-span-2 text-xs">{spec.entryCondition || spec.name}</dd>
    </dl>
  );
}

function LoopVisualization({ session }: { session: VibeSessionDetail }) {
  const steps = session.lastLoopSteps ?? [];
  const perception = session.lastPerception as {
    price?: number;
    symbol?: string;
    skills?: Record<string, { summary: string }>;
    signalSummary?: { clearSignal?: string; rsi?: number };
  } | null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PHASE_ORDER.map((p) => {
          const hit = steps.some((s) => s.phase === p);
          return (
            <Badge
              key={p}
              variant="outline"
              className={cn("capitalize", hit && phaseBadgeClass(p))}
            >
              {p}
            </Badge>
          );
        })}
      </div>
      {perception && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-border/60 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Perception</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>
                {perception.symbol} @ {perception.price?.toLocaleString()}
              </p>
              <p className="text-muted-foreground mt-1">
                Signal {perception.signalSummary?.clearSignal} · RSI{" "}
                {perception.signalSummary?.rsi ?? "—"}
              </p>
            </CardContent>
          </Card>
          {perception.skills &&
            Object.entries(perception.skills)
              .slice(0, 3)
              .map(([id, sk]) => (
                <Card key={id} className="border-border/60 bg-card/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-mono">{id}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-muted-foreground line-clamp-4">
                    {sk.summary}
                  </CardContent>
                </Card>
              ))}
        </div>
      )}
      <ul className="space-y-2 max-h-48 overflow-y-auto text-sm">
        {steps.length === 0 ? (
          <li className="text-muted-foreground">Run a tick to see the loop.</li>
        ) : (
          steps
            .slice()
            .reverse()
            .map((s, i) => (
              <li key={i} className="flex gap-2 items-start">
                <Badge className={cn("shrink-0 capitalize text-[10px]", phaseBadgeClass(s.phase))}>
                  {s.phase}
                </Badge>
                <span>{s.message}</span>
              </li>
            ))
        )}
      </ul>
    </div>
  );
}

export default function BitgetVibeTrader() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [compiled, setCompiled] = useState<StrategySpec | null>(null);
  const [sessionName, setSessionName] = useState("BTC Vibe Scalper");
  const [mode, setMode] = useState<VibeExecutionMode>("paper");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const configQ = useQuery({
    queryKey: ["bitget-vibe-config"],
    queryFn: fetchBitgetVibeConfig,
  });

  const sessionsQ = useQuery({
    queryKey: ["bitget-vibe-sessions"],
    queryFn: () => listVibeSessions(15),
  });

  const sessionQ = useQuery({
    queryKey: ["bitget-vibe-session", activeSessionId],
    queryFn: () => fetchVibeSession(activeSessionId!),
    enabled: Boolean(activeSessionId),
    refetchInterval: activeSessionId ? 30_000 : false,
  });

  const compileM = useMutation({
    mutationFn: () => compileVibeStrategy(prompt),
    onSuccess: (data) => {
      setCompiled(data.strategySpec);
      toast({ title: "Strategy compiled", description: data.strategySpec.name });
    },
    onError: (e: Error) => toast({ title: "Compile failed", description: e.message, variant: "destructive" }),
  });

  const createM = useMutation({
    mutationFn: () =>
      createVibeSession({
        prompt,
        name: sessionName,
        mode,
        runFirstTick: true,
      }),
    onSuccess: (data) => {
      setActiveSessionId(data.session.id);
      setCompiled(data.session.strategySpec);
      void queryClient.invalidateQueries({ queryKey: ["bitget-vibe-sessions"] });
      toast({ title: "Session started", description: "First loop tick completed." });
    },
    onError: (e: Error) => toast({ title: "Start failed", description: e.message, variant: "destructive" }),
  });

  const tickM = useMutation({
    mutationFn: () => tickVibeSession(activeSessionId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bitget-vibe-session", activeSessionId] });
      void queryClient.invalidateQueries({ queryKey: ["bitget-vibe-sessions"] });
    },
    onError: (e: Error) => toast({ title: "Tick failed", description: e.message, variant: "destructive" }),
  });

  const liveCapable = configQ.data?.liveCapable ?? false;
  const session = sessionQ.data?.session;
  const metrics = sessionQ.data?.metrics;

  const handleExportCsv = useCallback(() => {
    if (!metrics || !session) return;
    const csv = exportVibeMetricsCsv(metrics, session.name);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bitget-vibe-${session.shareSlug ?? session.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, session]);

  const equitySpark = useMemo(() => {
    const pts = metrics?.equityCurve ?? [];
    if (pts.length < 2) return null;
    const min = Math.min(...pts.map((p) => p.equity));
    const max = Math.max(...pts.map((p) => p.equity));
    const range = max - min || 1;
    return pts
      .map((p, i) => {
        const x = (i / (pts.length - 1)) * 100;
        const y = 100 - ((p.equity - min) / range) * 80 - 10;
        return `${x},${y}`;
      })
      .join(" ");
  }, [metrics?.equityCurve]);

  return (
    <TooltipProvider>
      <div
        className={cn(
          DASHBOARD_CONTENT_SHELL,
          PAGE_PADDING_TOP_STANDARD,
          PAGE_SAFE_AREA_BOTTOM_COMPACT,
          "pb-16",
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/overview" aria-label="Back">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Bitget Vibe Trader
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Natural-language strategy → autonomous loop on Bitget Agent Hub (paper by default)
              </p>
            </div>
          </div>
          <WalletNav />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Vibe strategy</CardTitle>
                <CardDescription>Describe your trade in plain English</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="vibe-prompt">Prompt</Label>
                  <Textarea
                    id="vibe-prompt"
                    className="mt-1.5 min-h-[120px]"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="vibe-name">Session name</Label>
                  <Input
                    id="vibe-name"
                    className="mt-1.5"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">Live trading</p>
                    <p className="text-xs text-muted-foreground">
                      {liveCapable ? "Bitget keys detected" : "Paper only — add API keys for live"}
                    </p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span>
                        <Switch
                          checked={mode === "live"}
                          disabled={!liveCapable}
                          onCheckedChange={(on) => setMode(on ? "live" : "paper")}
                        />
                      </span>
                    </TooltipTrigger>
                    {!liveCapable && (
                      <TooltipContent>
                        Set BITGET_API_KEY, BITGET_SECRET_KEY, BITGET_PASSPHRASE on the API server
                      </TooltipContent>
                    )}
                  </Tooltip>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={compileM.isPending}
                    onClick={() => compileM.mutate()}
                  >
                    {compileM.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Bot className="h-4 w-4 mr-2" />
                    )}
                    Preview compile
                  </Button>
                  <Button
                    type="button"
                    disabled={createM.isPending || !prompt.trim()}
                    onClick={() => createM.mutate()}
                  >
                    {createM.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Start session
                  </Button>
                </div>
                {compiled && (
                  <div className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Compiled spec</p>
                    <StrategyPreview spec={compiled} />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent sessions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(sessionsQ.data?.sessions ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sessions yet.</p>
                ) : (
                  sessionsQ.data?.sessions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={cn(
                        "w-full text-left rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted/50",
                        activeSessionId === s.id && "border-primary bg-primary/5",
                      )}
                      onClick={() => setActiveSessionId(s.id)}
                    >
                      <div className="flex justify-between gap-2">
                        <span className="font-medium truncate">{s.name}</span>
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {s.mode}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        WR {s.winRatePct ?? "—"}% · Ret {s.returnPct ?? "—"}%
                      </p>
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!activeSessionId ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-50" />
                  <p>Compile a strategy and start a session to run the trading loop.</p>
                </CardContent>
              </Card>
            ) : sessionQ.isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : session && metrics ? (
              <>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Win rate</p>
                      <p className="text-2xl font-semibold">{metrics.winRatePct ?? "—"}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Return</p>
                      <p className="text-2xl font-semibold">{metrics.returnPct ?? "—"}%</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Equity</p>
                      <p className="text-2xl font-semibold">${metrics.equityUsd.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground">Open</p>
                      <p className="text-2xl font-semibold">{metrics.openPositions}</p>
                    </CardContent>
                  </Card>
                </div>

                {equitySpark && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Equity curve</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <svg viewBox="0 0 100 100" className="w-full h-16 text-primary" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          points={equitySpark}
                        />
                      </svg>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{session.name}</CardTitle>
                      <CardDescription>
                        {session.mode} · {session.tickCount} ticks · slug {session.shareSlug}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExportCsv}
                        disabled={!metrics.recentRuns.length}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export CSV
                      </Button>
                      <Button
                        size="sm"
                        disabled={tickM.isPending}
                        onClick={() => tickM.mutate()}
                      >
                        {tickM.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                        <span className="ml-1 hidden sm:inline">Run tick</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <LoopVisualization session={session} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Trade ledger
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Signal</TableHead>
                          <TableHead className="text-right">P/L</TableHead>
                          <TableHead className="text-right">Notional</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics.recentRuns.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-muted-foreground">
                              No trades yet — run a tick when signal aligns.
                            </TableCell>
                          </TableRow>
                        ) : (
                          metrics.recentRuns.map((r) => (
                            <TableRow key={r._id}>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {r.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{r.symbol}</TableCell>
                              <TableCell>{r.clearSignal}</TableCell>
                              <TableCell className="text-right">
                                {r.simPnlUsd != null ? `$${r.simPnlUsd.toFixed(2)}` : "—"}
                              </TableCell>
                              <TableCell className="text-right">
                                {r.notionalUsd != null ? `$${r.notionalUsd.toFixed(0)}` : "—"}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-8 text-center max-w-2xl mx-auto">
          Built for{" "}
          <a
            href="https://bitget-ai.gitbook.io/hackathon"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            Bitget Builder Base Camp Hackathon S1
          </a>
          · Track 1 Trading Agent · Uses Bitget public market data + Agent Hub skill mapping · Paper
          trading by default
        </p>
      </div>
    </TooltipProvider>
  );
}
