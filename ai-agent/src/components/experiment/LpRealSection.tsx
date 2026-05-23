import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Copy, Droplets, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";
import { formatLpUsd } from "@/lib/lpAgentExperimentApi";
import {
  fetchLpRealPositions,
  fetchLpRealState,
  fetchLpRealSummary,
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
  const stateQ = useQuery({
    queryKey: ["lp-real", "state"],
    queryFn: fetchLpRealState,
    refetchInterval: 30_000,
  });
  const summaryQ = useQuery({
    queryKey: ["lp-real", "summary"],
    queryFn: fetchLpRealSummary,
    refetchInterval: 30_000,
  });
  const positionsQ = useQuery({
    queryKey: ["lp-real", "positions"],
    queryFn: () => fetchLpRealPositions({ limit: 15 }),
    refetchInterval: 30_000,
  });

  const config = stateQ.data?.config;
  const loading = stateQ.isLoading || summaryQ.isLoading;
  const failed = stateQ.isError;

  const live = Boolean(config?.enabled && (stateQ.data?.openPositionsCount ?? 0) > 0);

  const minBank = stateQ.data?.minBankSol ?? config?.targetBankSol ?? 10;
  const canEnable = stateQ.data?.canEnable ?? (stateQ.data?.onChainBalanceSol ?? 0) >= minBank;

  const metrics = useMemo(
    () => [
      {
        label: "On-chain SOL",
        value: formatSol(stateQ.data?.onChainBalanceSol ?? 0),
        warn: !canEnable && !config?.enabled,
      },
      {
        label: "Deployed",
        value: formatSol(stateQ.data?.deployedSol ?? 0),
      },
      {
        label: "Available",
        value: formatSol(stateQ.data?.availableSol ?? 0),
      },
      {
        label: "Realized net PnL",
        value: `${formatSol(summaryQ.data?.realizedNetPnlSol ?? 0)} · ${formatLpUsd(summaryQ.data?.realizedNetPnlUsd ?? 0)}`,
      },
    ],
    [stateQ.data, summaryQ.data, canEnable, config?.enabled],
  );

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  };

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
            <Badge variant="outline" className="border-violet-500/40 text-[10px] uppercase tracking-wide text-violet-700 dark:text-violet-300">
              Live SOL
            </Badge>
            {config?.enabled && live ? (
              <AgentBackgroundLiveIndicator openPositions={stateQ.data?.openPositionsCount ?? 0} />
            ) : config?.enabled ? (
              <Badge variant="outline" className="border-emerald-500/30 text-[10px] text-emerald-700 dark:text-emerald-400">
                Enabled
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-[10px] uppercase">
                Disabled
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Real Meteora DLMM positions from your agent wallet — 10 SOL bank, 1 SOL per slot, max ten concurrent.
            Follows the sim strategy with highest net PnL each tick.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {stateQ.data?.isOperator ? (
            <LpRealAgentToggle state={stateQ.data} isLoading={loading} layout="compact" />
          ) : null}
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden /> : null}
        </div>
      </div>

      {failed ? (
        <p className="text-sm text-destructive">Could not load LP Real Agent state. Check API and wallet bootstrap.</p>
      ) : null}

      {config ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className={cn(
                  "rounded-lg border bg-background/60 px-3 py-2.5",
                  "warn" in m && m.warn
                    ? "border-amber-500/40"
                    : "border-border/50",
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

          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Following</span>
            {stateQ.data?.currentStrategy ? (
              <Badge variant="secondary" className="font-normal">
                #{stateQ.data.currentStrategy.id} {stateQ.data.currentStrategy.name} (
                {stateQ.data.currentStrategy.lpShape}) · best net PnL
              </Badge>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Agent</span>
            <code className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[11px]">
              {shorten(config.agentAddress, 6, 6)}
            </code>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Copy agent address"
              onClick={() => onCopy(config.agentAddress)}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <a
              href={solscanAccountUrl(config.agentAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-violet-600 hover:underline dark:text-violet-400"
            >
              Solscan
              <ExternalLink className="h-3 w-3" />
            </a>
            {config.lastError ? (
              <span className="text-destructive">· {config.lastError}</span>
            ) : null}
          </div>

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
                      No real positions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  (positionsQ.data?.positions ?? []).map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="max-w-[140px] truncate text-sm font-medium">
                        {row.poolName || row.poolAddress.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {row.status.replace(/_/g, " ")}
                        </Badge>
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

          <p className="text-[11px] text-muted-foreground">
            W/L: {summaryQ.data?.wins ?? 0} / {summaryQ.data?.losses ?? 0} · Open: {summaryQ.data?.openCount ?? 0} ·
            Fees claimed: {formatSol(summaryQ.data?.totalFeesClaimedSol ?? 0)}
          </p>
        </>
      ) : !loading && !failed ? (
        <p className="text-sm text-muted-foreground">
          LP Real Agent is not configured yet. Enable it in Settings once your agent wallet is funded.
        </p>
      ) : null}
    </section>
  );
}
