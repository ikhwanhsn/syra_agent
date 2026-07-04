import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bitcoin, Loader2, Power, PowerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  disableBtcQuantReal,
  enableBtcQuantReal,
  fetchBtcRealState,
  formatBtcUsd,
  type BtcQuantLane,
} from "@/lib/btcQuantApi";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";

type Props = {
  lane?: BtcQuantLane;
  title?: string;
  description?: string;
};

export function BtcQuantRealSection({
  lane = "btc1",
  title = "Real cbBTC agent",
  description,
}: Props) {
  const queryClient = useQueryClient();
  const { syraAuthenticated } = useSyraAuth();
  const { address } = useWalletContext();

  const realQ = useQuery({
    queryKey: ["btc-quant", "real-state", lane],
    queryFn: () => fetchBtcRealState(lane),
    refetchInterval: 60_000,
  });

  const enableM = useMutation({
    mutationFn: () => enableBtcQuantReal({ lane }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["btc-quant"] });
      void queryClient.invalidateQueries({ queryKey: ["btc2-quant"] });
    },
  });

  const disableM = useMutation({
    mutationFn: () => disableBtcQuantReal(lane),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["btc-quant"] });
      void queryClient.invalidateQueries({ queryKey: ["btc2-quant"] });
    },
  });

  const state = realQ.data;
  const busy = enableM.isPending || disableM.isPending;
  const canToggle = Boolean(address && syraAuthenticated) && state?.canEnable;
  const blurb =
    description ??
    (lane === "btc2"
      ? "Mirrors the BTC2 sim leader: USDC → cbBTC via Jupiter from your custodial invest wallet. Set BTC_QUANT_REAL_CRON_ENABLED=true on the API for autonomous ticks."
      : "Mirrors the sim leader: USDC → cbBTC via Jupiter from your custodial invest wallet. Set BTC_QUANT_REAL_CRON_ENABLED=true on the API for autonomous ticks.");

  return (
    <section id="real-agent" className="scroll-mt-8 space-y-4">
      <div>
        <p className={cn(overviewKickerClass, "text-[10px] uppercase tracking-wider")}>Onchain execution</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {blurb}{" "}
          <code className="rounded bg-muted px-1 text-xs">lane={lane}</code>
        </p>
      </div>

      <div className={cn(overviewCardShell, "rounded-3xl p-5 sm:p-6")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Bitcoin className="h-5 w-5 text-amber-500" aria-hidden />
              <Badge
                variant="outline"
                className={cn(
                  "rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase",
                  state?.enabled
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                    : "border-border/50",
                )}
              >
                {state?.enabled ? "Live onchain" : "Disabled"}
              </Badge>
              {state?.cronEnabled ? (
                <Badge variant="secondary" className="rounded-md text-[10px]">
                  Cron on
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-md text-[10px] text-muted-foreground">
                  Cron off
                </Badge>
              )}
            </div>

            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Leader strategy</dt>
                <dd className="font-medium">
                  {state?.leaderStrategyId != null ? `#${state.leaderStrategyId}` : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Max notional</dt>
                <dd className="font-mono font-medium">{formatBtcUsd(state?.maxNotionalUsd ?? 200)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Realized P/L</dt>
                <dd className="font-mono font-medium">{formatBtcUsd(state?.realizedNetPnlUsd ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Open positions</dt>
                <dd className="font-mono font-medium">{state?.openPositions ?? 0}</dd>
              </div>
            </dl>

            {state?.lastError ? (
              <p className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {state.lastError}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {!address || !syraAuthenticated ? (
              <p className="text-xs text-muted-foreground">Connect wallet and sign in to enable real execution.</p>
            ) : null}
            {state?.enabled ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2 rounded-xl"
                disabled={busy || !canToggle}
                onClick={() => disableM.mutate()}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <PowerOff className="h-4 w-4" aria-hidden />
                )}
                Disable real agent
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                className="gap-2 rounded-xl"
                disabled={busy || !canToggle}
                onClick={() => enableM.mutate()}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Power className="h-4 w-4" aria-hidden />
                )}
                Go real (cbBTC)
              </Button>
            )}
            {(enableM.error || disableM.error) && (
              <p className="max-w-xs text-right text-xs text-destructive">
                {(enableM.error ?? disableM.error) instanceof Error
                  ? (enableM.error ?? disableM.error)!.message
                  : "Request failed"}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
