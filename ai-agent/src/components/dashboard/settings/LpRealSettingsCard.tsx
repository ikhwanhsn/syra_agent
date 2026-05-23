import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Droplets, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useToast } from "@/hooks/use-toast";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import {
  disableLpReal,
  enableLpReal,
  fetchLpRealState,
  fetchLpRealSummary,
} from "@/lib/lpAgentRealApi";
import { formatSol } from "@/lib/dashboardOverviewAggregates";
import { formatLpUsd } from "@/lib/lpAgentExperimentApi";
import { LpRealAgentToggle } from "@/components/experiment/LpRealAgentToggle";

export function LpRealSettingsCard() {
  const { syraAuthenticated, ensureSyraAuth } = useSyraAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [stopAllOpen, setStopAllOpen] = useState(false);

  const stateQ = useQuery({
    queryKey: ["lp-real", "state"],
    queryFn: fetchLpRealState,
    enabled: syraAuthenticated,
    staleTime: 30_000,
  });
  const summaryQ = useQuery({
    queryKey: ["lp-real", "summary"],
    queryFn: fetchLpRealSummary,
    enabled: syraAuthenticated,
    staleTime: 30_000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (nextEnabled: boolean) => {
      await ensureSyraAuth();
      if (nextEnabled) return enableLpReal();
      return disableLpReal({ closeAll: false });
    },
    onSuccess: (_data, nextEnabled) => {
      void queryClient.invalidateQueries({ queryKey: ["lp-real"] });
      toast({
        title: nextEnabled ? "LP Real Agent enabled" : "LP Real Agent disabled",
      });
    },
    onError: (err: Error) => {
      const msg = err.message || "Request failed";
      const friendly = msg.includes("insufficient_balance")
        ? `Fund the agent wallet with at least ${minBank} SOL before enabling.`
        : msg;
      toast({ title: "Failed to update LP Real Agent", description: friendly, variant: "destructive" });
    },
  });

  const stopAllMutation = useMutation({
    mutationFn: async () => {
      await ensureSyraAuth();
      return disableLpReal({ closeAll: true });
    },
    onSuccess: () => {
      setStopAllOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["lp-real"] });
      toast({ title: "Stop requested", description: "Open positions will be closed on the next resolve tick." });
    },
    onError: (err: Error) => {
      toast({ title: "Stop failed", description: err.message, variant: "destructive" });
    },
  });

  const config = stateQ.data?.config;
  const enabled = Boolean(config?.enabled);
  const minBank = stateQ.data?.minBankSol ?? config?.targetBankSol ?? 10;
  const canEnable = stateQ.data?.canEnable ?? (stateQ.data?.onChainBalanceSol ?? 0) >= minBank;
  const isOperator = stateQ.data?.isOperator ?? false;

  if (!syraAuthenticated) {
    return (
      <Card className={overviewCardShell}>
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Droplets className="h-4 w-4 text-violet-500" aria-hidden />
            LP Real Agent (Meteora DLMM)
          </CardTitle>
          <CardDescription>
            Connect and sign in with your Solana agent wallet to run real on-chain LP.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <Button type="button" variant="outline" className="rounded-xl" onClick={() => void ensureSyraAuth()}>
            Connect wallet to configure
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!stateQ.isLoading && stateQ.data && !isOperator) {
    return (
      <Card className={overviewCardShell}>
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Droplets className="h-4 w-4 text-violet-500" aria-hidden />
            LP Real Agent (Meteora DLMM)
          </CardTitle>
          <CardDescription>Create a Solana agent wallet to run autonomous Meteora LP.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 text-sm text-muted-foreground">
          <p>
            You need an active backend-custodied Solana agent wallet. Create one under Agents, fund it
            with at least {formatSol(minBank)} SOL, then return here to enable the experiment.
          </p>
          <Button type="button" variant="outline" className="rounded-xl" asChild>
            <Link to="/dashboard/lp-experiment#real-agent">View LP experiment</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={overviewCardShell}>
        <CardHeader className="border-b border-border/40 pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Droplets className="h-4 w-4 text-violet-500" aria-hidden />
                LP Real Agent (Meteora DLMM)
              </CardTitle>
              <CardDescription className="mt-1">
                Autonomous Meteora DLMM positions using real SOL from your backend-custodied agent wallet.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="lp-real-enabled" className="text-xs text-muted-foreground">
                {enabled ? "Enabled" : "Disabled"}
              </Label>
              <Switch
                id="lp-real-enabled"
                checked={enabled}
                disabled={
                  !isOperator || toggleMutation.isPending || stateQ.isLoading || (!enabled && !canEnable)
                }
                onCheckedChange={(checked) => {
                  if (checked && !canEnable) {
                    toast({
                      title: "Not enough SOL",
                      description: `Wallet has ${formatSol(stateQ.data?.onChainBalanceSol ?? 0)}. Need at least ${formatSol(minBank)} to enable.`,
                      variant: "destructive",
                    });
                    return;
                  }
                  toggleMutation.mutate(checked);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          {stateQ.isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading LP Real config…
            </div>
          ) : isOperator ? (
            <>
              {config ? (
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Agent address</p>
                    <p className="font-mono text-xs">{config.agentAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">On-chain balance</p>
                    <p className="font-medium tabular-nums">{formatSol(stateQ.data?.onChainBalanceSol ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bank / slot / max</p>
                    <p className="font-medium">
                      {config.targetBankSol} SOL · {config.maxPositionSol} SOL · {config.maxConcurrentPositions}{" "}
                      slots
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Reserve (fees)</p>
                    <p className="font-medium">{config.reserveSolForFees} SOL</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-xs text-muted-foreground">Following strategy</p>
                    {stateQ.data?.currentStrategy ? (
                      <Badge variant="secondary" className="mt-1 font-normal">
                        #{stateQ.data.currentStrategy.id} {stateQ.data.currentStrategy.name} — dynamic best net
                        PnL
                      </Badge>
                    ) : (
                      <p className="text-muted-foreground">Picked on next signal tick</p>
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Realized PnL</p>
                    <p className="font-medium tabular-nums">
                      {formatSol(summaryQ.data?.realizedNetPnlSol ?? 0)} ·{" "}
                      {formatLpUsd(summaryQ.data?.realizedNetPnlUsd ?? 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last ticks</p>
                    <p className="text-xs text-muted-foreground">
                      Signal: {config.lastSignalAt ? new Date(config.lastSignalAt).toLocaleString() : "—"}
                      <br />
                      Resolve: {config.lastResolveAt ? new Date(config.lastResolveAt).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Fund your agent wallet with at least {formatSol(minBank)} SOL, then enable the experiment.
                  Current balance: {formatSol(stateQ.data?.onChainBalanceSol ?? 0)}.
                </p>
              )}

              <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/[0.08] px-3 py-2.5 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <p>
                  Real SOL leaves your agent wallet. Transactions run automatically every ~2 minutes (open)
                  and ~30 seconds (monitor/close). Fund the wallet with at least {formatSol(minBank)} SOL
                  before enabling.
                </p>
              </div>

              <LpRealAgentToggle state={stateQ.data} isLoading={stateQ.isLoading} />

              {!canEnable && !enabled ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Deposit at least {formatSol(minBank)} SOL to the agent wallet to turn the agent on (
                  {formatSol(stateQ.data?.onChainBalanceSol ?? 0)} available).
                </p>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" className="rounded-xl" asChild>
                  <Link to="/dashboard/lp-experiment#real-agent">
                    View live stats
                    <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
                {enabled ? (
                  <Button
                    type="button"
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => setStopAllOpen(true)}
                    disabled={stopAllMutation.isPending}
                  >
                    Stop all & close positions
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={stopAllOpen} onOpenChange={setStopAllOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stop LP Real Agent?</DialogTitle>
            <DialogDescription>
              This disables the agent and queues close transactions for all open Meteora positions. SOL
              returns to your agent wallet after closes confirm on-chain.
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
    </>
  );
}
