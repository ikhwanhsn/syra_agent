import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Globe, Loader2, Power, PowerOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  disableBtc3Real,
  enableBtc3Real,
  fetchBtc3RealState,
  formatBtc3Usd,
} from "@/lib/btc3RealApi";
import { overviewCardShell, overviewKickerClass } from "@/components/dashboard/overview/overviewStyles";
import { useSyraAuth } from "@/contexts/SyraAuthContext";
import { useWalletContext } from "@/contexts/WalletContext";

export function Btc3RealSection() {
  const queryClient = useQueryClient();
  const { syraAuthenticated } = useSyraAuth();
  const { address } = useWalletContext();

  const realQ = useQuery({
    queryKey: ["btc3-macro", "real-state"],
    queryFn: fetchBtc3RealState,
    refetchInterval: 60_000,
  });

  const enableM = useMutation({
    mutationFn: () => enableBtc3Real({}),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["btc3-macro"] });
    },
  });

  const disableM = useMutation({
    mutationFn: () => disableBtc3Real(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["btc3-macro"] });
    },
  });

  const state = realQ.data;
  const busy = enableM.isPending || disableM.isPending;
  const canToggle = Boolean(address && syraAuthenticated) && state?.canEnable;
  const wallet = state?.walletAllocation;

  return (
    <section id="real-agent" className="scroll-mt-8 space-y-4">
      <div>
        <p className={cn(overviewKickerClass, "text-[10px] uppercase tracking-wider")}>
          Onchain execution
        </p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Real allocation agent</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Rebalances your custodial invest wallet toward the macro target allocation (USDC ↔ cbBTC via
          Jupiter). Runs after each macro pipeline decision when enabled. Set{" "}
          <code className="rounded bg-muted px-1 text-xs">BTC3_REAL_CRON_ENABLED=true</code> for
          standalone ticks.
        </p>
      </div>

      <div className={cn(overviewCardShell, "rounded-3xl p-5 sm:p-6")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Globe className="h-5 w-5 text-sky-500" aria-hidden />
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
                <dt className="text-muted-foreground">Wallet equity</dt>
                <dd className="font-mono font-medium">{formatBtc3Usd(state?.equityUsd)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Max notional / rebalance</dt>
                <dd className="font-mono font-medium">
                  {formatBtc3Usd(state?.maxNotionalUsd ?? 200)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Wallet BTC / USDC</dt>
                <dd className="font-mono font-medium">
                  {wallet
                    ? `${wallet.btcPct.toFixed(1)}% / ${wallet.usdcPct.toFixed(1)}%`
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Executed rebalances</dt>
                <dd className="font-mono font-medium">{state?.executedRebalances ?? 0}</dd>
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
              <p className="text-xs text-muted-foreground">
                Connect wallet and sign in to enable real execution.
              </p>
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
                Go real (allocation)
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
