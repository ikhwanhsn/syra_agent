import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Copy, Droplets, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AgentBackgroundLiveIndicator } from "@/components/experiment/AgentBackgroundLiveIndicator";
import { LpRealAgentToggle } from "@/components/experiment/LpRealAgentToggle";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { formatLpUsd } from "@/lib/lpAgentExperimentApi";
import {
  disableLpReal,
  fetchLpRealPositions,
  fetchLpRealState,
  fetchLpRealSummary,
  type LpRealState,
  solscanAccountUrl,
  solscanTxUrl,
} from "@/lib/lpAgentRealApi";
import { formatSol } from "@/lib/dashboardOverviewAggregates";

function shorten(addr: string, head = 4, tail = 4): string {
  if (!addr || addr.length <= head + tail + 1) return addr || "—";
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

function pnlClass(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "text-foreground";
  return n > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
}

export function LpRealSection() {
  const { anonymousId, agentAddress, agentSolBalance } = useAgentWallet();
  const { ensureSyraAuth } = useSyraAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stopAllOpen, setStopAllOpen] = useState(false);

  const stateQ = useQuery({
    queryKey: ["lp-real", "state", anonymousId],
    queryFn: () => fetchLpRealState(anonymousId),
    enabled: Boolean(anonymousId),
    refetchInterval: 30_000,
  });
  const summaryQ = useQuery({
    queryKey: ["lp-real", "summary", anonymousId],
    queryFn: () => fetchLpRealSummary(anonymousId),
    enabled: Boolean(anonymousId),
    refetchInterval: 30_000,
  });
  const positionsQ = useQuery({
    queryKey: ["lp-real", "positions", anonymousId],
    queryFn: () => fetchLpRealPositions({ limit: 15, anonymousId }),
    enabled: Boolean(anonymousId),
    refetchInterval: 30_000,
  });

  const stopAllMutation = useMutation({
    mutationFn: async () => {
      const auth = await ensureSyraAuth();
      const sessionAnonymousId = auth?.anonymousId ?? anonymousId;
      if (!sessionAnonymousId) throw new Error("wallet_sign_in_required");
      return disableLpReal({ closeAll: true, anonymousId: sessionAnonymousId });
    },
    onSuccess: () => {
      setStopAllOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["lp-real"] });
      toast({ title: "Stop requested", description: "Open positions will close on the next resolve tick." });
    },
    onError: (err: Error) => {
      const msg = err.message.includes("wallet_sign_in_required")
        ? "Connect your wallet with the button in the top bar, then try again."
        : err.message;
      toast({ title: "Stop failed", description: msg, variant: "destructive" });
    },
  });

  const config = stateQ.data?.config;
  const agentAddr = config?.agentAddress ?? agentAddress ?? "";
  const minBank = stateQ.data?.minBankSol ?? config?.targetBankSol ?? 10;
  const onChainBalanceSol = Math.max(stateQ.data?.onChainBalanceSol ?? 0, agentSolBalance ?? 0);
  const canEnable = stateQ.data?.canEnable ?? onChainBalanceSol >= minBank - 1e-9;
  const enabled = Boolean(config?.enabled);
  const hasAgentWallet = Boolean(agentAddr || anonymousId);
  const loading = Boolean(anonymousId) && (stateQ.isLoading || summaryQ.isLoading);
  const failed = stateQ.isError;

  const lpState: LpRealState | undefined = useMemo(() => {
    if (stateQ.data) {
      return {
        ...stateQ.data,
        onChainBalanceSol,
        canEnable,
        isOperator: true,
        config: stateQ.data.config ?? (agentAddr ? buildPreviewConfig(agentAddr, minBank) : null),
      };
    }
    if (!agentAddr) return undefined;
    return {
      config: buildPreviewConfig(agentAddr, minBank),
      onChainBalanceSol,
      deployedSol: 0,
      availableSol: Math.max(0, onChainBalanceSol - 0.05),
      openPositionsCount: 0,
      currentStrategy: null,
      minBankSol: minBank,
      canEnable,
      isOperator: true,
    };
  }, [stateQ.data, agentAddr, minBank, onChainBalanceSol, canEnable]);

  const live = Boolean(enabled && (stateQ.data?.openPositionsCount ?? 0) > 0);

  const metrics = useMemo(
    () => [
      {
        label: "On-chain SOL",
        value: formatSol(onChainBalanceSol),
        warn: !canEnable && !enabled,
      },
      {
        label: "Deployed",
        value: formatSol(stateQ.data?.deployedSol ?? 0),
      },
      {
        label: "Available",
        value: formatSol(
          stateQ.data?.availableSol ??
            Math.max(0, onChainBalanceSol - (config?.reserveSolForFees ?? 0.05)),
        ),
      },
      {
        label: "Realized net PnL",
        value: `${formatSol(summaryQ.data?.realizedNetPnlSol ?? 0)} · ${formatLpUsd(summaryQ.data?.realizedNetPnlUsd ?? 0)}`,
      },
    ],
    [stateQ.data, summaryQ.data, canEnable, enabled, onChainBalanceSol, config?.reserveSolForFees],
  );

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const statusBadge = enabled && live ? (
    <AgentBackgroundLiveIndicator openPositions={stateQ.data?.openPositionsCount ?? 0} />
  ) : enabled ? (
    <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-400">
      Running
    </Badge>
  ) : canEnable ? (
    <Badge variant="outline" className="border-violet-500/40 text-[10px] text-violet-700 dark:text-violet-300">
      Ready — {formatSol(onChainBalanceSol)}
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-[10px] uppercase">
      Needs funding
    </Badge>
  );

  return (
    <section
      id="real-agent"
      className="scroll-mt-6 space-y-4 rounded-xl border border-violet-500/25 bg-gradient-to-br from-violet-500/[0.06] via-card/80 to-card/60 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Droplets className="h-4 w-4 text-violet-500" aria-hidden />
            <h2 className="text-base font-semibold tracking-tight">LP Real Agent</h2>
            <Badge
              variant="outline"
              className="border-violet-500/40 text-[10px] uppercase tracking-wide text-violet-700 dark:text-violet-300"
            >
              Live SOL · Meteora
            </Badge>
            {hasAgentWallet ? statusBadge : null}
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Autonomous Meteora DLMM on your agent wallet — {minBank} SOL bank, 1 SOL per slot (max 10). Follows the
            sim strategy with the highest net PnL each tick.
          </p>
        </div>
        {lpState ? (
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <LpRealAgentToggle state={lpState} isLoading={loading || stopAllMutation.isPending} layout="compact" />
          </div>
        ) : null}
      </div>

      {failed ? (
        <p className="text-sm text-destructive">
          Could not load LP Real state. Check that the API is running, then refresh.
        </p>
      ) : null}

      {loading && hasAgentWallet ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Checking wallet balance…
        </div>
      ) : null}

      {!hasAgentWallet && !loading ? (
        <div className="space-y-3 rounded-lg border border-border/60 bg-background/50 px-4 py-4">
          <p className="text-sm text-muted-foreground">
            Create a backend-custodied Solana agent wallet, fund it with at least {formatSol(minBank)} SOL, then turn
            the agent on below.
          </p>
          <Button type="button" variant="outline" size="sm" className="rounded-xl" asChild>
            <Link to="/dashboard/agents">Create agent wallet</Link>
          </Button>
        </div>
      ) : null}

      {hasAgentWallet && agentAddr && !loading ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className={cn(
                  "rounded-lg border bg-background/60 px-3 py-2.5",
                  "warn" in m && m.warn ? "border-amber-500/40" : "border-border/50",
                )}
              >
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{m.label}</p>
                <p
                  className={cn(
                    "mt-1 text-sm font-semibold tabular-nums",
                    "warn" in m && m.warn && "text-amber-700 dark:text-amber-300",
                  )}
                >
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Agent address</p>
              <p className="font-mono text-xs">{agentAddr}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bank / slot / max</p>
              <p className="font-medium">
                {config?.targetBankSol ?? minBank} SOL · {config?.maxPositionSol ?? 1} SOL ·{" "}
                {config?.maxConcurrentPositions ?? 10} slots
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Following strategy</p>
              {stateQ.data?.currentStrategy ? (
                <Badge variant="secondary" className="mt-1 font-normal">
                  #{stateQ.data.currentStrategy.id} {stateQ.data.currentStrategy.name} — best net PnL
                </Badge>
              ) : (
                <p className="text-muted-foreground">Picked automatically on the next signal tick</p>
              )}
            </div>
          </div>

          {!canEnable && !enabled ? (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Deposit at least {formatSol(minBank)} SOL to your agent wallet to turn on ({formatSol(onChainBalanceSol)}{" "}
              on-chain).
            </p>
          ) : !enabled && canEnable ? (
            <p className="text-xs text-violet-700 dark:text-violet-300">
              Wallet funded — click Turn on agent to start real Meteora LP.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Agent</span>
            <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px]">
              {shorten(agentAddr, 6, 6)}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Copy agent address"
              onClick={() => onCopy(agentAddr)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <a
              href={solscanAccountUrl(agentAddr)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-violet-600 hover:underline dark:text-violet-400"
            >
              Solscan
              <ExternalLink className="h-3 w-3" />
            </a>
            {config?.lastError ? <span className="text-destructive">· {config.lastError}</span> : null}
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] px-3 py-2.5 text-xs text-amber-900 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p>
              Real SOL leaves your agent wallet. Opens ~every 2 minutes; monitor/close ~every 30 seconds while the
              agent is on.
            </p>
          </div>

          {enabled ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-xl"
              disabled={stopAllMutation.isPending}
              onClick={() => setStopAllOpen(true)}
            >
              Stop all & close positions
            </Button>
          ) : null}

          {config?.experimentId ? (
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pool</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Deposit</TableHead>
                    <TableHead className="text-right">Real PnL</TableHead>
                    <TableHead>Tx</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(positionsQ.data?.positions ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                        No real positions yet — first open on the next signal tick after you turn on.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (positionsQ.data?.positions ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="max-w-[140px] truncate text-sm font-medium">
                          {row.poolName || row.poolAddress.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-start gap-0.5">
                            <Badge
                              variant={row.status === "error" ? "destructive" : "outline"}
                              className="text-[10px] capitalize"
                            >
                              {row.status.replace(/_/g, " ")}
                            </Badge>
                            {row.status === "error" && row.errorMessage ? (
                              <span
                                className="max-w-[220px] truncate text-[10px] text-destructive"
                                title={row.errorMessage}
                              >
                                {row.errorMessage}
                              </span>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {formatSol(row.depositSol)}
                        </TableCell>
                        <TableCell className={cn("text-right tabular-nums text-sm", pnlClass(row.realNetPnlSol))}>
                          {row.realNetPnlSol != null ? formatSol(row.realNetPnlSol) : "—"}
                        </TableCell>
                        <TableCell className="space-x-1 text-xs">
                          {row.openTxSig ? (
                            <a
                              href={solscanTxUrl(row.openTxSig)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-600 hover:underline dark:text-violet-400"
                            >
                              open
                            </a>
                          ) : null}
                          {row.closeTxSig ? (
                            <a
                              href={solscanTxUrl(row.closeTxSig)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-violet-600 hover:underline dark:text-violet-400"
                            >
                              close
                            </a>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : null}

          {config?.experimentId ? (
            <p className="text-[11px] text-muted-foreground">
              W/L: {summaryQ.data?.wins ?? 0} / {summaryQ.data?.losses ?? 0} · Open: {summaryQ.data?.openCount ?? 0} ·
              Fees claimed: {formatSol(summaryQ.data?.totalFeesClaimedSol ?? 0)}
            </p>
          ) : null}
        </>
      ) : null}

      <Dialog open={stopAllOpen} onOpenChange={setStopAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop LP Real Agent?</DialogTitle>
            <DialogDescription>
              Disables the agent and closes all open Meteora positions. SOL returns to your agent wallet after
              on-chain confirmation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setStopAllOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={stopAllMutation.isPending}
              onClick={() => stopAllMutation.mutate()}
            >
              {stopAllMutation.isPending ? "Stopping…" : "Stop and close all"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function buildPreviewConfig(agentAddress: string, targetBankSol: number) {
  return {
    agentAddress,
    enabled: false,
    targetBankSol,
    maxPositionSol: 1,
    maxConcurrentPositions: 10,
    reserveSolForFees: 0.05,
    currentStrategyId: null,
    lastSignalAt: null,
    lastResolveAt: null,
    lastError: null,
    experimentId: "",
    closeAllRequested: false,
  };
}
