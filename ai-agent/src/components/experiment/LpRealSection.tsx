import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpRight,
  Copy,
  ExternalLink,
  Layers,
  Loader2,
  ShieldAlert,
  TrendingUp,
  Wallet,
  Waves,
} from "lucide-react";
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
import { LpStatTile } from "@/components/experiment/lp/LpStatTile";
import { SolAmount } from "@/components/experiment/lp/SolAmount";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fetchLpLabState, formatLpUsd } from "@/lib/lpAgentExperimentApi";
import {
  disableLpReal,
  fetchLpRealPositions,
  fetchLpRealState,
  fetchLpRealSummary,
  type LpRealPosition,
  type LpRealState,
  solscanAccountUrl,
  solscanTxUrl,
} from "@/lib/lpAgentRealApi";
import {
  formatLpLastError,
  formatLpPositionError,
  formatSolUsdSub,
  formatSolWithUsd,
  lpStatFromSol,
  splitLpRealPositions,
} from "@/lib/lpRealDisplay";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
} from "@/components/dashboard/overview/overviewStyles";

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
  const { requestSyraAuth } = useSyraAuth();
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
  const labQ = useQuery({
    queryKey: ["lp-agent", "lab-state"],
    queryFn: fetchLpLabState,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
  const refSolUsd = labQ.data?.referenceSolPriceUsd;

  const stopAllMutation = useMutation({
    mutationFn: async () => {
      const auth = await requestSyraAuth();
      if (!auth?.anonymousId) throw new Error("wallet_sign_in_required");
      return disableLpReal({ closeAll: true });
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
  const minEntry =
    stateQ.data?.minWalletToStartSol ??
    (config?.maxPositionSol ?? 1) + (config?.reserveSolForFees ?? 0.05) + 0.15;
  const onChainBalanceSol = Math.max(stateQ.data?.onChainBalanceSol ?? 0, agentSolBalance ?? 0);
  const deployedSol = stateQ.data?.deployedSol ?? 0;
  const totalCapitalSol = stateQ.data?.totalCapitalSol ?? onChainBalanceSol + deployedSol;
  const openPositionsCount = stateQ.data?.openPositionsCount ?? 0;
  const canOpenNewPositions = stateQ.data?.canOpenNewPositions ?? stateQ.data?.canEnable ?? false;
  const canTurnOn = stateQ.data?.canTurnOn ?? (canOpenNewPositions || openPositionsCount > 0);
  const enabled = Boolean(config?.enabled);
  const hasAgentWallet = Boolean(agentAddr || anonymousId);
  const loading = Boolean(anonymousId) && (stateQ.isLoading || summaryQ.isLoading);
  const failed = stateQ.isError;

  const lpState: LpRealState | undefined = useMemo(() => {
    if (stateQ.data) {
      return {
        ...stateQ.data,
        onChainBalanceSol,
        isOperator: true,
        config: stateQ.data.config ?? (agentAddr ? buildPreviewConfig(agentAddr, minBank) : null),
      };
    }
    if (!agentAddr) return undefined;
    return {
      config: buildPreviewConfig(agentAddr, minBank),
      onChainBalanceSol,
      deployedSol: 0,
      totalCapitalSol: onChainBalanceSol,
      availableSol: Math.max(0, onChainBalanceSol - 0.05),
      openPositionsCount: 0,
      currentStrategy: null,
      minBankSol: minBank,
      minWalletToStartSol: minEntry,
      canEnable: onChainBalanceSol >= minEntry - 1e-9,
      canTurnOn: onChainBalanceSol >= minEntry - 1e-9,
      canOpenNewPositions: onChainBalanceSol >= (config?.maxPositionSol ?? 1) + (config?.reserveSolForFees ?? 0.05) - 1e-9,
      isOperator: true,
    };
  }, [stateQ.data, agentAddr, minBank, minEntry, onChainBalanceSol, config?.maxPositionSol, config?.reserveSolForFees]);

  const live = Boolean(enabled && openPositionsCount > 0);
  const monitoringOnly = enabled && openPositionsCount > 0 && !canOpenNewPositions;
  const bankProgressPct = minBank > 0 ? Math.min(100, (totalCapitalSol / minBank) * 100) : 0;
  const realizedPnl = summaryQ.data?.realizedNetPnlSol ?? 0;
  const entryShortfall = Math.max(0, minEntry - onChainBalanceSol);

  const { active: activePositions, failed: failedPositions, other: closedPositions } = useMemo(
    () => splitLpRealPositions(positionsQ.data?.positions ?? []),
    [positionsQ.data?.positions],
  );

  const lastErrorLabel = formatLpLastError(config?.lastError, {
    totalCapitalSol,
    minBankSol: minBank,
    availableSol: stateQ.data?.availableSol,
  });

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

  const statusBadge = enabled && live ? (
    <AgentBackgroundLiveIndicator openPositions={openPositionsCount} />
  ) : enabled && monitoringOnly ? (
    <Badge variant="outline" className="border-amber-500/40 text-[10px] text-amber-800 dark:text-amber-300">
      Monitoring — no new opens
    </Badge>
  ) : enabled ? (
    <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-400">
      Running
    </Badge>
  ) : canTurnOn ? (
    <Badge variant="outline" className="border-violet-500/40 text-[10px] text-violet-700 dark:text-violet-300">
      Ready — {formatSolWithUsd(onChainBalanceSol, refSolUsd)}
    </Badge>
  ) : (
    <Badge variant="secondary" className="text-[10px] uppercase">
      Needs funding
    </Badge>
  );

  return (
    <section id="real-agent" className="scroll-mt-8 space-y-4">
      <div>
        <p className={overviewKickerClass}>Your deployment</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground sm:text-xl">Live LP agent</h2>
      </div>

      <article className={cn(overviewCardShell, "overflow-hidden rounded-3xl ring-1 ring-violet-500/15")}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.6]"
          style={{
            background: `${overviewAccentBackground("experiment")}, radial-gradient(420px 180px at 100% 0%, hsl(262 83% 58% / 0.14), transparent 58%)`,
          }}
          aria-hidden
        />

        <div className="relative border-b border-border/45 px-5 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-lg border-violet-500/35 bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-800 dark:text-violet-200"
                >
                  On-chain · Meteora DLMM
                </Badge>
                {hasAgentWallet ? statusBadge : null}
              </div>

              <p className="max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground">
                Autonomous liquidity on your Syra agent wallet — ~{formatSolWithUsd(minEntry, refSolUsd)} to enter a
                pool,{" "}
                {config?.maxPositionSol ?? 1} SOL per slot, up to {config?.maxConcurrentPositions ?? 10} concurrent.
                Strategy follows the best net-PnL sim each tick. Turning off stops new opens; open positions keep running.
              </p>

              {hasAgentWallet && !loading ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-medium text-muted-foreground">Scale target (optional)</span>
                    <span className="font-mono tabular-nums text-foreground">
                      {formatSolWithUsd(totalCapitalSol, refSolUsd)} / {formatSolWithUsd(minBank, refSolUsd)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted/60">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        totalCapitalSol >= minBank - 1e-9
                          ? "bg-gradient-to-r from-violet-600 to-emerald-500"
                          : "bg-amber-500/80",
                      )}
                      style={{ width: `${bankProgressPct}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {lpState ? (
              <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:min-w-[220px]">
                <LpRealAgentToggle
                  state={lpState}
                  solUsd={refSolUsd}
                  isLoading={loading || stopAllMutation.isPending}
                />
              </div>
            ) : null}
          </div>
        </div>

        {failed ? (
          <div className="border-b border-destructive/20 bg-destructive/[0.06] px-5 py-4 text-sm text-destructive sm:px-8">
            Could not load agent state. Check that the API is running, then refresh the page.
          </div>
        ) : null}

        {loading && hasAgentWallet ? (
          <div className="flex items-center gap-2 border-b border-border/40 px-5 py-4 text-sm text-muted-foreground sm:px-8">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Syncing wallet and positions…
          </div>
        ) : null}

        {!hasAgentWallet && !loading ? (
          <div className="px-5 py-8 sm:px-8">
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border/60 bg-background/30 px-6 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border/50 bg-muted/30">
                <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden />
              </div>
              <p className="mt-4 text-sm font-medium text-foreground">No agent wallet yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Create a custodied Solana agent wallet and fund it with at least ~
                {formatSolWithUsd(minEntry, refSolUsd)} to enter your first pool.
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-5 rounded-xl" asChild>
                <Link to="/dashboard/agents">
                  Create agent wallet
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        ) : null}

        {hasAgentWallet && agentAddr && !loading ? (
          <div className="relative space-y-6 px-5 py-6 sm:px-8 sm:py-7">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <LpStatTile
                label="Total capital"
                {...lpStatFromSol(
                  totalCapitalSol,
                  refSolUsd,
                  `Scale ${formatSolWithUsd(minBank, refSolUsd)}`,
                )}
                icon={Layers}
                tone={canTurnOn || enabled ? "default" : "warning"}
                highlight={!canTurnOn && !enabled}
              />
              <LpStatTile label="Wallet SOL" {...lpStatFromSol(onChainBalanceSol, refSolUsd)} icon={Wallet} />
              <LpStatTile label="Deployed" {...lpStatFromSol(deployedSol, refSolUsd)} icon={Waves} tone="accent" />
              <LpStatTile
                label="Available"
                {...lpStatFromSol(
                  stateQ.data?.availableSol ??
                    Math.max(0, onChainBalanceSol - (config?.reserveSolForFees ?? 0.05)),
                  refSolUsd,
                )}
              />
              <LpStatTile
                label="Realized PnL"
                value={`${formatSol(realizedPnl)} SOL`}
                subValue={
                  summaryQ.data?.realizedNetPnlUsd != null &&
                  Number.isFinite(Number(summaryQ.data.realizedNetPnlUsd))
                    ? formatLpUsd(summaryQ.data.realizedNetPnlUsd)
                    : formatSolUsdSub(realizedPnl, refSolUsd)
                }
                icon={TrendingUp}
                tone={realizedPnl > 0 ? "positive" : realizedPnl < 0 ? "negative" : "default"}
                className="sm:col-span-2 xl:col-span-1"
              />
            </div>

            <div className="grid gap-4 rounded-2xl border border-border/45 bg-background/25 p-4 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className={overviewKickerClass}>Agent address</p>
                <p className="mt-1.5 truncate font-mono text-xs text-foreground">{agentAddr}</p>
              </div>
              <div>
                <p className={overviewKickerClass}>Bank · slot · max</p>
                <p className="mt-1.5 text-sm font-medium tabular-nums">
                  {formatSolWithUsd(config?.targetBankSol ?? minBank, refSolUsd)} bank ·{" "}
                  {formatSolWithUsd(config?.maxPositionSol ?? 1, refSolUsd)} slot ·{" "}
                  {config?.maxConcurrentPositions ?? 10} max
                </p>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <p className={overviewKickerClass}>Strategy</p>
                {stateQ.data?.currentStrategy ? (
                  <Badge variant="secondary" className="mt-1.5 font-normal">
                    #{stateQ.data.currentStrategy.id} {stateQ.data.currentStrategy.name}
                  </Badge>
                ) : (
                  <p className="mt-1.5 text-sm text-muted-foreground">Auto on next signal tick</p>
                )}
              </div>
            </div>

            {!canTurnOn && !enabled ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                Need ~{formatSolWithUsd(minEntry, refSolUsd)} in the agent wallet to turn on — currently{" "}
                {formatSolWithUsd(onChainBalanceSol, refSolUsd)} ({formatSolWithUsd(entryShortfall, refSolUsd)} short).
              </div>
            ) : !enabled && canTurnOn ? (
              <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.06] px-4 py-3 text-sm text-violet-900 dark:text-violet-100">
                Wallet funded for entry. Turn on the agent to start real Meteora LP.
              </div>
            ) : monitoringOnly ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                Monitoring {openPositionsCount} open position{openPositionsCount === 1 ? "" : "s"} — no new slots until
                wallet has room ({formatSolWithUsd(stateQ.data?.availableSol ?? 0, refSolUsd)} available).
              </div>
            ) : enabled && !canOpenNewPositions ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
                Agent is on but will not open new pools until the wallet has ~
                {formatSolWithUsd(minEntry, refSolUsd)} for the next slot (
                {formatSolWithUsd(stateQ.data?.availableSol ?? 0, refSolUsd)} available now).
              </div>
            ) : null}

            {failedPositions.length > 0 && activePositions.length === 0 ? (
              <div className="rounded-xl border border-destructive/25 bg-destructive/[0.06] px-4 py-3 text-sm text-destructive/90 dark:text-red-200">
                The rows below are <strong className="font-medium">failed open attempts</strong>, not live Meteora
                positions — that is why Deployed shows {formatSolWithUsd(0, refSolUsd)}. SOL was not locked in those
                pools (or the tx did not complete). Fund the wallet with ~{formatSolWithUsd(minEntry, refSolUsd)} and the
                agent can try again.
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <code className="rounded-lg border border-border/50 bg-muted/40 px-2 py-1 font-mono text-[11px]">
                {shorten(agentAddr, 6, 6)}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                aria-label="Copy agent address"
                onClick={() => onCopy(agentAddr)}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <a
                href={solscanAccountUrl(agentAddr)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-border/45 bg-background/40 px-2.5 py-1.5 font-medium text-violet-700 transition-colors hover:bg-background/60 dark:text-violet-300"
              >
                Solscan
                <ExternalLink className="h-3 w-3" />
              </a>
              {lastErrorLabel ? (
                <span className="text-destructive" title={config?.lastError ?? undefined}>
                  · {lastErrorLabel}
                </span>
              ) : null}
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/[0.08] to-transparent px-4 py-3.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <p className="text-xs leading-relaxed text-amber-950/90 dark:text-amber-100/90">
                Real SOL leaves your agent wallet. Opens ~every 2 minutes; positions are monitored and closed ~every 30
                seconds while the agent is on.
              </p>
            </div>

            {openPositionsCount > 0 ? (
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
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">Position activity</p>
                  <p className="text-xs text-muted-foreground">
                    W {summaryQ.data?.wins ?? 0} · L {summaryQ.data?.losses ?? 0} · fees{" "}
                    <SolAmount
                      sol={summaryQ.data?.totalFeesClaimedSol ?? 0}
                      solUsd={refSolUsd}
                      inline
                      className="text-xs"
                    />
                  </p>
                </div>

                {activePositions.length > 0 ? (
                  <LpRealPositionTable title="Live on Meteora" rows={activePositions} solUsd={refSolUsd} />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No live Meteora positions{enabled ? " right now" : ""}.
                    {enabled ? " Next open runs on the signal tick when the book is funded." : ""}
                  </p>
                )}

                {failedPositions.length > 0 ? (
                  <LpRealPositionTable
                    title={`Failed open attempts (${failedPositions.length})`}
                    rows={failedPositions}
                    showErrorDetail
                    solUsd={refSolUsd}
                  />
                ) : null}

                {closedPositions.length > 0 ? (
                  <LpRealPositionTable
                    title="Recent closed"
                    rows={closedPositions.slice(0, 5)}
                    solUsd={refSolUsd}
                  />
                ) : null}

                {activePositions.length === 0 &&
                failedPositions.length === 0 &&
                closedPositions.length === 0 &&
                !positionsQ.isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    No activity yet — first open lands on the next signal tick after you turn the agent on.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      <Dialog open={stopAllOpen} onOpenChange={setStopAllOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Stop LP Real Agent?</DialogTitle>
            <DialogDescription>
              Disables the agent and closes all open Meteora positions. SOL returns to your agent wallet after on-chain
              confirmation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="rounded-xl" onClick={() => setStopAllOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-xl"
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

function LpRealPositionTable({
  title,
  rows,
  showErrorDetail = false,
  solUsd,
}: {
  title: string;
  rows: LpRealPosition[];
  showErrorDetail?: boolean;
  solUsd?: number;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/30">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs uppercase tracking-wide">Pool</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wide">Deposit</TableHead>
              <TableHead className="text-right text-xs uppercase tracking-wide">PnL</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Tx</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id} className="border-border/40">
                <TableCell className="max-w-[160px] truncate text-sm font-medium">
                  {row.poolName || row.poolAddress.slice(0, 8)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-0.5">
                    <Badge
                      variant={
                        row.status === "error" && !row.openTxSig
                          ? "destructive"
                          : row.status === "error"
                            ? "outline"
                            : "outline"
                      }
                      className={cn(
                        "text-[10px] capitalize",
                        row.status === "error" &&
                          row.openTxSig &&
                          "border-amber-500/40 text-amber-800 dark:text-amber-300",
                      )}
                    >
                      {row.status === "error" && row.openTxSig ? "closing retry" : row.status.replace(/_/g, " ")}
                    </Badge>
                    {showErrorDetail ? (
                      <span
                        className="max-w-[220px] truncate text-[10px] text-destructive"
                        title={row.errorMessage ?? undefined}
                      >
                        {formatLpPositionError(row.errorMessage, row)}
                      </span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <SolAmount sol={row.depositSol} solUsd={solUsd} usdOverride={row.depositUsd} />
                </TableCell>
                <TableCell className={cn("text-right", pnlClass(row.realNetPnlSol))}>
                  {row.realNetPnlSol != null ? (
                    <SolAmount
                      sol={row.realNetPnlSol}
                      solUsd={solUsd}
                      usdOverride={row.realNetPnlUsd}
                      usdClassName={pnlClass(row.realNetPnlSol)}
                    />
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="space-x-2 text-xs">
                  {row.openTxSig ? (
                    <a
                      href={solscanTxUrl(row.openTxSig)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-violet-600 hover:underline dark:text-violet-400"
                      title="Open transaction on Solscan"
                    >
                      open tx
                    </a>
                  ) : null}
                  {row.closeTxSig ? (
                    <a
                      href={solscanTxUrl(row.closeTxSig)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-violet-600 hover:underline dark:text-violet-400"
                    >
                      close
                    </a>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
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
