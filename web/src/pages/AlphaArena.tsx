import { useCallback, useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Crown,
  Loader2,
  Play,
  RefreshCw,
  Rocket,
  Shield,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WalletNav } from "@/components/chat/WalletNav";
import { cn } from "@/lib/utils";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import {
  createArenaAgent,
  fetchArenaAgent,
  fetchArenaConfig,
  fetchArenaLeaderboard,
  publishArenaAgent,
  seedArenaAgents,
  subscribeArenaAgent,
  tickArenaAgent,
  type ArenaAgentRow,
  type ArenaStrategySpec,
} from "@/lib/arenaApi";
import { useToast } from "@/hooks/use-toast";

const EXAMPLE_PROMPT =
  "Adaptive BTC perpetual on Bitget: trend-follow when trending, mean-revert when ranging, 2% TP, 1% SL on 1h. Gate entries when Syra on-chain bias is bearish.";

function StrategyPreview({ spec }: { spec: ArenaStrategySpec }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Token</dt>
      <dd className="font-medium">{spec.token}</dd>
      <dt className="text-muted-foreground">Regime</dt>
      <dd className="capitalize">{spec.regime}</dd>
      <dt className="text-muted-foreground">Market</dt>
      <dd>{spec.marketType}</dd>
      <dt className="text-muted-foreground">Timeframe</dt>
      <dd>{spec.bar}</dd>
    </dl>
  );
}

function OverlayCards({ agent }: { agent: ArenaAgentRow }) {
  const o = agent.alphaOverlay;
  const comps = o.components || {};
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/60 bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Syra bias</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{o.bias?.toFixed(2) ?? "—"}</p>
          <p className="text-xs text-muted-foreground capitalize">{o.biasLabel}</p>
          <Badge variant={o.gatePass ? "default" : "destructive"} className="mt-2">
            {o.gatePass ? "Gate open" : "Gate closed"}
          </Badge>
        </CardContent>
      </Card>
      {Object.entries(comps).map(([key, c]) => (
        <Card key={key} className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono capitalize">{key}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">{(c.score * 100).toFixed(0)}%</p>
            <p className="line-clamp-3">{c.summary}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function AlphaArena() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState(EXAMPLE_PROMPT);
  const [agentName, setAgentName] = useState("My Arena Agent");
  const [activeId, setActiveId] = useState<string | null>(null);

  const configQ = useQuery({ queryKey: ["arena-config"], queryFn: fetchArenaConfig });
  const boardQ = useQuery({
    queryKey: ["arena-leaderboard"],
    queryFn: () => fetchArenaLeaderboard(25),
    refetchInterval: 60_000,
  });
  const agentQ = useQuery({
    queryKey: ["arena-agent", activeId],
    queryFn: () => fetchArenaAgent(activeId!),
    enabled: Boolean(activeId),
    refetchInterval: activeId ? 30_000 : false,
  });

  const createM = useMutation({
    mutationFn: () =>
      createArenaAgent({ prompt, name: agentName, runPlaybook: true, runPaperTick: true }),
    onSuccess: (data) => {
      setActiveId(data.agent.id);
      void queryClient.invalidateQueries({ queryKey: ["arena-leaderboard"] });
      toast({ title: "Arena agent spawned", description: data.agent.name });
    },
    onError: (e: Error) =>
      toast({ title: "Spawn failed", description: e.message, variant: "destructive" }),
  });

  const tickM = useMutation({
    mutationFn: () => tickArenaAgent(activeId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["arena-agent", activeId] });
      void queryClient.invalidateQueries({ queryKey: ["arena-leaderboard"] });
    },
    onError: (e: Error) =>
      toast({ title: "Tick failed", description: e.message, variant: "destructive" }),
  });

  const publishM = useMutation({
    mutationFn: () => publishArenaAgent(activeId!, true),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["arena-agent", activeId] });
      toast({ title: "Published", description: "Playbook + optional 8004 registration" });
    },
    onError: (e: Error) =>
      toast({ title: "Publish failed", description: e.message, variant: "destructive" }),
  });

  const subscribeM = useMutation({
    mutationFn: () => subscribeArenaAgent(activeId!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["arena-agent", activeId] });
      toast({ title: "Subscribed", description: "Playbook subscription enabled" });
    },
    onError: (e: Error) =>
      toast({ title: "Subscribe failed", description: e.message, variant: "destructive" }),
  });

  const seedM = useMutation({
    mutationFn: seedArenaAgents,
    onSuccess: (d) => {
      void queryClient.invalidateQueries({ queryKey: ["arena-leaderboard"] });
      toast({ title: "Demo agents seeded", description: `${d.seeded} agents` });
    },
    onError: (e: Error) =>
      toast({ title: "Seed failed", description: e.message, variant: "destructive" }),
  });

  const agent = agentQ.data?.agent;
  const metrics = agent?.playbook?.metrics;
  const vibeMetrics = (agentQ.data?.vibeSession as { metrics?: { returnPct?: number; winRatePct?: number; equityUsd?: number } })?.metrics;

  const shareUrl = useMemo(() => {
    if (!agent?.shareSlug || typeof window === "undefined") return null;
    return `${window.location.origin}/arena?agent=${agent.shareSlug}`;
  }, [agent?.shareSlug]);

  const copyShare = useCallback(() => {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied" });
  }, [shareUrl, toast]);

  return (
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
              <Trophy className="h-6 w-6 text-primary" />
              Syra Alpha Arena
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              NL agents compete · Bitget Playbook backtest · on-chain overlay · 8004 identity
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={seedM.isPending}
            onClick={() => seedM.mutate()}
          >
            {seedM.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4 mr-1" />}
            Seed demos
          </Button>
          <WalletNav />
        </div>
      </div>

      {!configQ.data?.playbookCapable && (
        <Card className="mb-4 border-amber-500/30 bg-amber-500/5">
          <CardContent className="py-3 text-sm">
            <Shield className="h-4 w-4 inline mr-2 text-amber-500" />
            Playbook API key not configured on server — paper loop + overlay still work; backtest uploads
            need <code className="text-xs">PLAYBOOK_API_KEY</code>.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spawn agent</CardTitle>
              <CardDescription>Vibe a strategy — Syra compiles, overlays, backtests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="arena-prompt">Strategy prompt</Label>
                <Textarea
                  id="arena-prompt"
                  className="mt-1.5 min-h-[100px]"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="arena-name">Display name</Label>
                <Input
                  id="arena-name"
                  className="mt-1.5"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                disabled={createM.isPending || !prompt.trim()}
                onClick={() => createM.mutate()}
              >
                {createM.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Enter arena
              </Button>
              {createM.data?.agent?.strategySpec && (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <StrategyPreview spec={createM.data.agent.strategySpec} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[420px] overflow-y-auto">
              {(boardQ.data?.agents ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No agents yet — spawn or seed demos.</p>
              ) : (
                boardQ.data?.agents.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className={cn(
                      "w-full text-left rounded-md border px-3 py-2 text-sm hover:bg-muted/50",
                      activeId === a.id && "border-primary bg-primary/5",
                    )}
                    onClick={() => setActiveId(a.id)}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-medium truncate">
                        #{a.rank} {a.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {a.rankScore?.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      BT {a.backtestReturnPct ?? "—"}% · Paper {a.paperReturnPct ?? "—"}% ·{" "}
                      <Users className="h-3 w-3 inline" /> {a.subscriberCount}
                    </p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!activeId ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Select an agent or spawn a new one to view the full arena profile.</p>
              </CardContent>
            </Card>
          ) : agentQ.isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : agent ? (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Backtest return</p>
                    <p className="text-2xl font-semibold">
                      {metrics?.totalReturnPct != null ? `${metrics.totalReturnPct}%` : "—"}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Sharpe</p>
                    <p className="text-2xl font-semibold">{metrics?.sharpeRatio ?? "—"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Paper return</p>
                    <p className="text-2xl font-semibold">
                      {vibeMetrics?.returnPct ?? agent.paperReturnPct ?? "—"}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Subscribers</p>
                    <p className="text-2xl font-semibold">{agent.subscriberCount}</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>{agent.name}</CardTitle>
                    <CardDescription>
                      {agent.publishStatus} · {agent.strategySpec.regime} · slug {agent.shareSlug}
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={copyShare} disabled={!shareUrl}>
                      Share
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={tickM.isPending}
                      onClick={() => tickM.mutate()}
                    >
                      {tickM.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      disabled={publishM.isPending || agent.publishStatus === "published"}
                      onClick={() => publishM.mutate()}
                    >
                      {publishM.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-1" />
                      )}
                      Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={subscribeM.isPending || !agent.playbook?.versionId}
                      onClick={() => subscribeM.mutate()}
                    >
                      Subscribe
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <StrategyPreview spec={agent.strategySpec} />
                  <OverlayCards agent={agent} />
                  {agent.asset8004?.asset && (
                    <Badge variant="outline" className="font-mono text-xs">
                      8004 {agent.asset8004.asset.slice(0, 8)}…
                    </Badge>
                  )}
                  {agent.playbook?.error && (
                    <p className="text-xs text-destructive">{agent.playbook.error}</p>
                  )}
                  <div className="flex gap-2 text-sm">
                    <Link to="/vibe-trading" className="underline text-muted-foreground">
                      Paper loop (Vibe Trader)
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Playbook evidence</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead className="text-right">Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        ["Status", metrics?.status],
                        ["Max drawdown", metrics?.maxDrawdownPct != null ? `${metrics.maxDrawdownPct}%` : null],
                        ["Win rate", metrics?.winRate != null ? `${(metrics.winRate * 100).toFixed(1)}%` : null],
                        ["Trades", metrics?.totalTrades],
                        ["Draft", agent.playbook?.draftId],
                        ["Version", agent.playbook?.version],
                      ].map(([k, v]) => (
                        <TableRow key={String(k)}>
                          <TableCell>{k}</TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {v ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
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
          Bitget Base Camp Hackathon S1
        </a>
        · Syra Alpha Arena · Bitget Playbook + Agent Hub + 8004
      </p>
    </div>
  );
}
