import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, ExternalLink, Loader2, Wallet, Waves } from "lucide-react";
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
import { LpRealAgentToggle } from "@/components/experiment/LpRealAgentToggle";
import { LpPaginationBar } from "@/components/experiment/lp/LpExperimentTableUi";
import { LpStatTile } from "@/components/experiment/lp/LpStatTile";
import { lpTableHead, lpVioletBadge } from "@/components/experiment/lp/lpExperimentStyles";
import { SolAmount } from "@/components/experiment/lp/SolAmount";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fetchLpLabState, formatLpUsd } from "@/lib/lpAgentExperimentApi";
import {
  disableLpReal,
  fetchLpRealLivePositionsCount,
  fetchLpRealPositions,
  fetchLpRealState,
  fetchLpRealSummary,
  type LpRealPosition,
  type LpRealState,
  solscanTxUrl,
} from "@/lib/lpAgentRealApi";
import {
  buildLpPositionTimeline,
  formatPoolPairLabel,
  formatLpLastError,
  formatSolWithUsd,
  isActiveLpRealPosition,
  isOrphanedLiveLpRealPosition,
  lpPositionStatusLabel,
} from "@/lib/lpRealDisplay";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import { overviewAccentBackground, overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { LpSectionHeader } from "@/components/experiment/lp/LpSectionHeader";

const POSITION_PAGE_SIZE = 10;

function pnlClass(value: number | null | undefined): string {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "text-foreground";
  return n > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400";
}

function LpPositionTimeCell({ row }: { row: LpRealPosition }) {
  const timeline = buildLpPositionTimeline(row);
  const openedAt = row.openedAt ?? row.createdAt;

  if (!openedAt) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="min-w-[7rem] space-y-0.5">
      <p className="text-sm font-medium tabular-nums text-foreground">{timeline.holdLabel}</p>
      <p className="text-[11px] leading-snug text-muted-foreground">
        Opened {timeline.openedRelative}
      </p>
      {timeline.closedRelative ? (
        <p className="text-[11px] leading-snug text-muted-foreground">
          Closed {timeline.closedRelative}
        </p>
      ) : null}
    </div>
  );
}

function positionStatusTone(status: string): string {
  if (status === "open" || status === "opening") {
    return "bg-sky-500/12 text-sky-700 ring-1 ring-sky-500/20 dark:text-sky-300";
  }
  if (status === "closed_win") {
    return "bg-emerald-500/12 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300";
  }
  if (status === "closed_loss" || status === "expired" || status === "error") {
    return "bg-red-500/12 text-red-700 ring-1 ring-red-500/20 dark:text-red-300";
  }
  return "bg-muted text-muted-foreground";
}

export function LpRealSection() {
  const { lpAnonymousId, lpAgentAddress, lpAgentSolBalance } = useAgentWallet();
  const { requestSyraAuth } = useSyraAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stopAllOpen, setStopAllOpen] = useState(false);
  const [positionPage, setPositionPage] = useState(1);

  const stateQ = useQuery({
    queryKey: ["lp-real", "state", lpAnonymousId],
    queryFn: () => fetchLpRealState(lpAnonymousId),
    enabled: Boolean(lpAnonymousId),
    refetchInterval: 30_000,
  });
  const summaryQ = useQuery({
    queryKey: ["lp-real", "summary", lpAnonymousId],
    queryFn: () => fetchLpRealSummary(lpAnonymousId),
    enabled: Boolean(lpAnonymousId),
    refetchInterval: 30_000,
  });
  const positionsQ = useQuery({
    queryKey: ["lp-real", "positions", lpAnonymousId, positionPage],
    queryFn: () =>
      fetchLpRealPositions({
        limit: POSITION_PAGE_SIZE,
        offset: (positionPage - 1) * POSITION_PAGE_SIZE,
        anonymousId: lpAnonymousId,
      }),
    enabled: Boolean(lpAnonymousId),
    refetchInterval: 30_000,
  });
  const livePositionsCountQ = useQuery({
    queryKey: ["lp-real", "live-positions-count", lpAnonymousId],
    queryFn: () => fetchLpRealLivePositionsCount(lpAnonymousId),
    enabled: Boolean(lpAnonymousId),
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
      return disableLpReal({ closeAll: true, anonymousId: lpAnonymousId ?? undefined });
    },
    onSuccess: () => {
      setStopAllOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["lp-real"] });
      toast({ title: "Agent stopped", description: "Open positions will close shortly." });
    },
    onError: (err: Error) => {
      const msg = err.message.includes("wallet_sign_in_required")
        ? "Connect your wallet first, then try again."
        : err.message;
      toast({ title: "Could not stop agent", description: msg, variant: "destructive" });
    },
  });

  const config = stateQ.data?.config;
  const agentAddr = config?.agentAddress ?? lpAgentAddress ?? "";
  const minBank = stateQ.data?.minBankSol ?? config?.targetBankSol ?? 10;
  const minEntry =
    stateQ.data?.minWalletToStartSol ??
    (config?.maxPositionSol ?? 1) + (config?.reserveSolForFees ?? 0.05) + 0.15;
  const onChainBalanceSol = Math.max(stateQ.data?.onChainBalanceSol ?? 0, lpAgentSolBalance ?? 0);
  const walletEquitySol = stateQ.data?.walletEquitySol ?? onChainBalanceSol;
  const deployedSol = stateQ.data?.deployedSol ?? 0;
  const totalCapitalSol = stateQ.data?.totalCapitalSol ?? walletEquitySol + deployedSol;
  const totalReturnSol = stateQ.data?.totalReturnSol ?? summaryQ.data?.totalReturnSol ?? 0;
  const enabled = Boolean(config?.enabled);
  const lastErrorMsg = enabled && config?.lastError
    ? formatLpLastError(config.lastError, {
        totalCapitalSol,
        minBankSol: minBank,
        availableSol: stateQ.data?.availableSol,
      })
    : "";
  const hasAgentWallet = Boolean(agentAddr || lpAnonymousId);
  const loading = Boolean(lpAnonymousId) && (stateQ.isLoading || summaryQ.isLoading);
  const failed = stateQ.isError;

  const lpState: LpRealState | undefined = useMemo(() => {
    if (stateQ.data) {
      return {
        ...stateQ.data,
        onChainBalanceSol,
        config: stateQ.data.config ?? (agentAddr ? buildPreviewConfig(agentAddr, minBank) : null),
      };
    }
    if (!agentAddr) return undefined;
    return {
      config: buildPreviewConfig(agentAddr, minBank),
      onChainBalanceSol,
      walletEquitySol: onChainBalanceSol,
      deployedSol: 0,
      totalCapitalSol: onChainBalanceSol,
      capitalBaselineSol: minBank,
      totalReturnSol: 0,
      availableSol: Math.max(0, onChainBalanceSol - 0.05),
      openPositionsCount: 0,
      currentStrategy: null,
      minBankSol: minBank,
      minWalletToStartSol: minEntry,
      canEnable: onChainBalanceSol >= minEntry - 1e-9,
      canTurnOn: onChainBalanceSol >= minEntry - 1e-9,
      canOpenNewPositions:
        onChainBalanceSol >= (config?.maxPositionSol ?? 1) + (config?.reserveSolForFees ?? 0.05) - 1e-9,
      isOperator: true,
    };
  }, [
    stateQ.data,
    agentAddr,
    minBank,
    minEntry,
    onChainBalanceSol,
    config?.maxPositionSol,
    config?.reserveSolForFees,
  ]);

  const canTurnOn = stateQ.data?.canTurnOn ?? lpState?.canTurnOn ?? false;
  const entryShortfall = Math.max(0, minEntry - onChainBalanceSol);
  const minEntryUsd =
    refSolUsd != null && refSolUsd > 0 ? formatLpUsd(minEntry * refSolUsd) : null;

  const positions = positionsQ.data?.positions ?? [];
  const positionTotal = positionsQ.data?.total ?? 0;
  const liveOnCurrentPage = positions.filter(
    (p) => isActiveLpRealPosition(p.status) || isOrphanedLiveLpRealPosition(p),
  ).length;
  const livePositionsCount = livePositionsCountQ.isSuccess
    ? Math.max(0, livePositionsCountQ.data ?? 0)
    : liveOnCurrentPage;
  const hasLivePositions = livePositionsCountQ.isSuccess
    ? livePositionsCount > 0
    : liveOnCurrentPage > 0;
  const positionTotalPages = Math.max(1, Math.ceil(positionTotal / POSITION_PAGE_SIZE));
  const safePositionPage = Math.min(positionPage, positionTotalPages);

  useEffect(() => {
    setPositionPage(1);
  }, [lpAnonymousId]);

  useEffect(() => {
    if (positionPage > positionTotalPages) {
      setPositionPage(positionTotalPages);
    }
  }, [positionPage, positionTotalPages]);

  return (
    <section id="real-agent" className="scroll-mt-8 space-y-4">
      <LpSectionHeader
        kicker="Live mode"
        title="Your LP agent"
        description="Deploy real SOL into Meteora pools. The agent follows the best practice strategy automatically."
      />

      <article className={cn(overviewCardShell, "overflow-hidden rounded-3xl ring-1 ring-violet-500/15")}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{ background: overviewAccentBackground("experiment") }}
          aria-hidden
        />

        <div className="relative border-b border-border/45 px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="min-w-[12rem] flex-1 space-y-3">
              <Badge variant="outline" className={lpVioletBadge}>
                Real funds on Meteora
              </Badge>
              <div className="space-y-1.5 text-sm leading-relaxed">
                <p className="text-foreground/90">
                  Minimum to start:{" "}
                  <span className="font-semibold tabular-nums">{formatSol(minEntry)} SOL</span>
                  {minEntryUsd ? (
                    <span className="text-muted-foreground"> ({minEntryUsd})</span>
                  ) : null}
                </p>
                <p className="text-muted-foreground">Only deploy amounts you can afford to lose.</p>
              </div>
              {!canTurnOn && !enabled && hasAgentWallet && !loading ? (
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Add {formatSolWithUsd(entryShortfall, refSolUsd)} more to get started.
                </p>
              ) : null}
            </div>
            {lpState ? (
              <div className="shrink-0 self-stretch md:self-auto">
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
            Could not load agent. Refresh the page and try again.
          </div>
        ) : null}

        {loading && hasAgentWallet ? (
          <div className="flex items-center gap-2 border-b border-border/40 px-5 py-4 text-sm text-muted-foreground sm:px-8">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Loading wallet…
          </div>
        ) : null}

        {!hasAgentWallet && !loading ? (
          <div className="px-5 py-8 sm:px-8">
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border/60 bg-background/30 px-6 py-8 text-center">
              <Wallet className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden />
              <p className="mt-4 text-sm font-medium text-foreground">Create an agent wallet first</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Fund it with at least {formatSolWithUsd(minEntry, refSolUsd)} to start earning fees.
              </p>
              <Button type="button" variant="outline" size="sm" className="mt-5 rounded-xl" asChild>
                <Link to="/agents">
                  Create wallet
                  <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
        ) : null}

        {hasAgentWallet && agentAddr && !loading ? (
          <div className="relative space-y-6 px-5 py-6 sm:px-8 sm:py-7">
            <div className="grid gap-3 sm:grid-cols-3">
              <LpStatTile
                label="Total capital"
                value={`${formatSol(totalCapitalSol)} SOL`}
                subValue={formatSolWithUsd(totalCapitalSol, refSolUsd)}
                icon={Wallet}
              />
              <LpStatTile
                label="Total return"
                value={`${totalReturnSol >= 0 ? "+" : ""}${formatSol(totalReturnSol)} SOL`}
                subValue={formatSolWithUsd(totalReturnSol, refSolUsd)}
                icon={Waves}
                tone={totalReturnSol > 0 ? "positive" : totalReturnSol < 0 ? "negative" : "default"}
              />
              <LpStatTile
                label="Open positions"
                value={livePositionsCountQ.isLoading ? "…" : String(livePositionsCount)}
                subValue={enabled ? "Agent is running" : "Agent is off"}
                icon={Waves}
                tone="accent"
              />
            </div>

            {lastErrorMsg ? (
              <p className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
                {lastErrorMsg}
              </p>
            ) : null}

            {config?.experimentId ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium text-foreground">Your positions</h3>
                  <div className="flex flex-wrap items-center gap-2">
                    {positionTotal > 0 ? (
                      <span className="text-xs text-muted-foreground tabular-nums">{positionTotal} total</span>
                    ) : null}
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="h-8 rounded-lg text-xs"
                            disabled={!hasLivePositions || stopAllMutation.isPending}
                            onClick={() => setStopAllOpen(true)}
                          >
                            Stop agent and close all
                          </Button>
                        </span>
                      </TooltipTrigger>
                      {!hasLivePositions ? (
                        <TooltipContent side="top" className="max-w-xs rounded-xl px-3 py-2 text-xs">
                          No open positions to close right now.
                        </TooltipContent>
                      ) : null}
                    </Tooltip>
                  </div>
                </div>
                {positionsQ.isLoading && positions.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/30 px-4 py-6 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Loading positions…
                  </div>
                ) : positionTotal === 0 ? (
                  <p className="rounded-2xl border border-dashed border-border/50 bg-background/20 px-4 py-6 text-sm text-muted-foreground">
                    {enabled
                      ? lastErrorMsg ||
                        "No positions yet — the agent will open pools on the next signal tick (~2 min)."
                      : "Turn on the agent to start earning fees."}
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-border/50 bg-background/35">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/40 hover:bg-transparent">
                          <TableHead className={lpTableHead}>Pool</TableHead>
                          <TableHead className={lpTableHead}>Status</TableHead>
                          <TableHead className={lpTableHead}>Time</TableHead>
                          <TableHead className={cn(lpTableHead, "text-right")}>Deposit</TableHead>
                          <TableHead className={cn(lpTableHead, "text-right")}>PnL</TableHead>
                          <TableHead className={lpTableHead}>Tx</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {positions.map((row) => (
                          <TableRow key={row.id} className="border-border/40">
                            <TableCell>
                              <p className="text-sm font-medium text-foreground">{formatPoolPairLabel(row)}</p>
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium capitalize",
                                  positionStatusTone(row.status),
                                )}
                              >
                                {lpPositionStatusLabel(row)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <LpPositionTimeCell row={row} />
                            </TableCell>
                            <TableCell className="text-right">
                              <SolAmount sol={row.depositSol} solUsd={refSolUsd} usdOverride={row.depositUsd} />
                            </TableCell>
                            <TableCell className={cn("text-right", pnlClass(row.realNetPnlSol))}>
                              {row.realNetPnlSol != null ? (
                                <SolAmount
                                  sol={row.realNetPnlSol}
                                  solUsd={refSolUsd}
                                  usdOverride={row.realNetPnlUsd}
                                  usdClassName={pnlClass(row.realNetPnlSol)}
                                />
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              {row.openTxSig ? (
                                <a
                                  href={solscanTxUrl(row.openTxSig)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:underline dark:text-violet-400"
                                >
                                  View
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {positionTotalPages > 1 ? (
                      <LpPaginationBar
                        page={safePositionPage}
                        totalPages={positionTotalPages}
                        totalRowsLabel={`${positionTotal} positions`}
                        onPrev={() => setPositionPage((p) => Math.max(1, p - 1))}
                        onNext={() => setPositionPage((p) => Math.min(positionTotalPages, p + 1))}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      <Dialog open={stopAllOpen} onOpenChange={setStopAllOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Stop your LP agent?</DialogTitle>
            <DialogDescription>
              This turns off the agent and closes all open positions. SOL returns to your wallet after
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
