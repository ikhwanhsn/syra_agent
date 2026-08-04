import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { useAgentWallet } from "@/contexts/AgentWalletContext";
import { cn } from "@/lib/utils";
import { formatRobinhoodLpUsd } from "@/lib/robinhoodLpExperimentApi";
import {
  createOutcomeMandate,
  disableOutcomeMandate,
  enableOutcomeMandate,
  fetchOutcomeMandateStatus,
  fetchRobinhoodLpEvGateStatus,
  listOutcomeMandates,
  type RobinhoodLpLivePosition,
} from "@/lib/outcomesApi";

const PRODUCT_ID = "robinhood_lp_autopilot";
const PLACEHOLDER_EVM = "0x0000000000000000000000000000000000000001";

function Badge({
  tone,
  children,
}: {
  tone: "green" | "amber" | "red" | "muted";
  children: ReactNode;
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "amber"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
        : tone === "red"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border/60 bg-muted/40 text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

function EvGatePanel({
  loading,
  error,
  data,
}: {
  loading: boolean;
  error: Error | null;
  data: Awaited<ReturnType<typeof fetchRobinhoodLpEvGateStatus>> | undefined;
}) {
  if (loading) {
    return (
      <div className={cn(overviewCardShell, "rounded-2xl px-4 py-4")}>
        <div className="h-4 w-32 animate-pulse rounded bg-muted/50" />
        <div className="mt-3 h-8 w-full animate-pulse rounded bg-muted/40" />
      </div>
    );
  }
  if (error) {
    return (
      <div className={cn(overviewCardShell, "rounded-2xl border-destructive/30 px-4 py-4")}>
        <p className="text-sm font-medium text-destructive">EV gate unavailable</p>
        <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
        <p className="mt-2 text-xs text-muted-foreground">Refresh the page or check API health.</p>
      </div>
    );
  }

  const unlocked = Boolean(data?.realExecutionUnlocked || data?.qualified);
  const leader = data?.simLeader;
  const gate = data?.gate;

  return (
    <div className={cn(overviewCardShell, "rounded-2xl px-4 py-4")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            EV gate
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {unlocked ? "PnL gate is green" : "Waiting for sim proof"}
          </p>
        </div>
        <Badge tone={unlocked ? "green" : "amber"}>
          {unlocked ? "Unlocked" : "Locked"}
        </Badge>
      </div>
      <dl className="mt-3 grid gap-2 sm:grid-cols-3">
        <div>
          <dt className="text-[10px] uppercase text-muted-foreground">Decided</dt>
          <dd className="text-sm tabular-nums text-foreground">
            {leader?.decided ?? 0}
            {gate?.minDecided != null ? (
              <span className="text-muted-foreground"> / {String(gate.minDecided)}</span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-muted-foreground">Win rate</dt>
          <dd className="text-sm tabular-nums text-foreground">
            {leader?.winRate != null ? `${(Number(leader.winRate) * 100).toFixed(0)}%` : "n/a"}
            {gate?.minWinRate != null ? (
              <span className="text-muted-foreground">
                {" "}
                (need {(Number(gate.minWinRate) * 100).toFixed(0)}%)
              </span>
            ) : null}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase text-muted-foreground">Sum net PnL</dt>
          <dd className="text-sm tabular-nums text-foreground">
            {formatRobinhoodLpUsd(Number(leader?.sumNetPnlUsd ?? 0))}
          </dd>
        </div>
      </dl>
      {!unlocked ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Live agent stays locked until the paper leader clears decided, win-rate, and positive net
          PnL thresholds, and the live pool universe check passes.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Sim evidence is good enough to enable the pilot. Caps stay tiny ($25 bank, $5/position)
          and dry-run stays on until an operator turns it off after a security review.
        </p>
      )}
    </div>
  );
}

function PositionsTable({
  positions,
  loading,
}: {
  positions: RobinhoodLpLivePosition[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl bg-muted/40" />
        ))}
      </div>
    );
  }
  if (!positions.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 px-4 py-6 text-center">
        <p className="text-sm font-medium text-foreground">No live positions yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          When the agent opens a position, it will show here with PnL and Blockscout links.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border/50">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border/50 bg-muted/30 text-[10px] uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Pool</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Deposit</th>
            <th className="px-3 py-2 font-medium">PnL</th>
            <th className="px-3 py-2 font-medium">Tx</th>
          </tr>
        </thead>
        <tbody>
          {positions.map((p) => (
            <tr key={p.positionId} className="border-b border-border/40 last:border-0">
              <td className="px-3 py-2.5">
                <p className="font-medium text-foreground">{p.poolName || "Pool"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {p.dryRun ? "dry-run" : p.tokenId ? `NFT #${p.tokenId}` : p.positionId.slice(0, 12)}
                </p>
              </td>
              <td className="px-3 py-2.5">
                <Badge
                  tone={
                    p.status === "error"
                      ? "red"
                      : p.status === "open" || p.status === "opening"
                        ? "green"
                        : "muted"
                  }
                >
                  {p.status || "unknown"}
                </Badge>
                {p.error ? (
                  <p className="mt-1 max-w-[180px] truncate text-[10px] text-destructive">{p.error}</p>
                ) : null}
              </td>
              <td className="px-3 py-2.5 tabular-nums">
                {formatRobinhoodLpUsd(Number(p.depositUsd ?? 0))}
              </td>
              <td className="px-3 py-2.5 tabular-nums">
                {formatRobinhoodLpUsd(Number(p.realizedPnlUsd ?? 0))}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex flex-col gap-1 text-xs">
                  {p.openExplorerUrl ? (
                    <a
                      href={p.openExplorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      Open tx
                    </a>
                  ) : p.openTxHash ? (
                    <span className="text-muted-foreground">{String(p.openTxHash).slice(0, 14)}…</span>
                  ) : (
                    <span className="text-muted-foreground">n/a</span>
                  )}
                  {p.closeExplorerUrl ? (
                    <a
                      href={p.closeExplorerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      Close tx
                    </a>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RobinhoodLpLiveAgentPanel() {
  const { anonymousId, agentAddress, ready } = useAgentWallet();
  const queryClient = useQueryClient();
  const [confirmLive, setConfirmLive] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const evQ = useQuery({
    queryKey: ["outcomes", "ev-gate", "robinhood-lp"],
    queryFn: fetchRobinhoodLpEvGateStatus,
    refetchInterval: 60_000,
  });

  const mandatesQ = useQuery({
    queryKey: ["outcomes", "mandates", PRODUCT_ID, anonymousId ?? "none"],
    queryFn: () => listOutcomeMandates(anonymousId!, { productId: PRODUCT_ID }),
    enabled: Boolean(anonymousId),
    refetchInterval: 45_000,
  });

  const mandate = useMemo(() => {
    const list = (mandatesQ.data as { mandates?: Array<{ mandateId: string; status?: string }> })
      ?.mandates;
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.find((m) => m.status === "active") ?? list[0];
  }, [mandatesQ.data]);

  const statusQ = useQuery({
    queryKey: ["outcomes", "mandate-status", mandate?.mandateId ?? "none"],
    queryFn: () => fetchOutcomeMandateStatus(mandate!.mandateId),
    enabled: Boolean(mandate?.mandateId),
    refetchInterval: 30_000,
  });

  const productStatus = (statusQ.data as {
    productStatus?: {
      config?: {
        enabled?: boolean;
        dryRun?: boolean;
        agentAddress?: string;
        lastError?: string | null;
      };
      positions?: RobinhoodLpLivePosition[];
      safety?: {
        pilotEnabled?: boolean;
        dryRunDefault?: boolean;
        killSwitch?: boolean;
        maxPositionUsd?: number;
        maxBankUsd?: number;
      };
      evGateUnlocked?: boolean;
    };
  })?.productStatus;

  const config = productStatus?.config;
  const safety = productStatus?.safety;
  const positions = productStatus?.positions ?? [];
  const unlocked = Boolean(evQ.data?.realExecutionUnlocked || evQ.data?.qualified);
  const killSwitch = Boolean(safety?.killSwitch);
  const pilotEnabled = Boolean(safety?.pilotEnabled);
  const dryRun = config?.dryRun !== false;
  const agentOn = Boolean(config?.enabled);

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["outcomes"] });
  }, [queryClient]);

  const startMutation = useMutation({
    mutationFn: async () => {
      if (!anonymousId) throw new Error("Connect an agent wallet first.");
      if (!unlocked) throw new Error("EV gate is still locked.");
      if (killSwitch) throw new Error("Kill switch is active.");
      let mandateId = mandate?.mandateId;
      if (!mandateId) {
        const created = (await createOutcomeMandate({
          anonymousId,
          productId: PRODUCT_ID,
          chain: "robinhood",
          agentAddress: agentAddress?.startsWith("0x") ? agentAddress : PLACEHOLDER_EVM,
          maxManagedCapitalUsd: 25,
          perTxCapUsd: 5,
        })) as { mandateId: string };
        mandateId = created.mandateId;
      }
      return enableOutcomeMandate(mandateId);
    },
    onSuccess: () => {
      setActionError(null);
      setConfirmLive(false);
      invalidate();
    },
    onError: (e: Error) => setActionError(e.message),
  });

  const stopMutation = useMutation({
    mutationFn: async () => {
      if (!mandate?.mandateId) throw new Error("No mandate to stop.");
      return disableOutcomeMandate(mandate.mandateId);
    },
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (e: Error) => setActionError(e.message),
  });

  // Dry-run starts after EV gate clears; live funds still need the operator pilot flag.
  const canStart =
    ready &&
    Boolean(anonymousId) &&
    unlocked &&
    !killSwitch &&
    !agentOn &&
    (dryRun || pilotEnabled);
  const busy = startMutation.isPending || stopMutation.isPending;

  return (
    <section id="live-agent" className="scroll-mt-8 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Live agent
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Robinhood LP Autopilot</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            When paper PnL clears the EV gate, you can start a capped Uniswap v3 agent on Robinhood
            Chain. Default is dry-run. Real funds only move after dry-run is explicitly disabled.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dryRun ? <Badge tone="amber">Dry-run</Badge> : <Badge tone="red">Live funds</Badge>}
          {killSwitch ? <Badge tone="red">Kill switch</Badge> : null}
          {agentOn ? <Badge tone="green">Enabled</Badge> : <Badge tone="muted">Stopped</Badge>}
        </div>
      </div>

      <EvGatePanel
        loading={evQ.isLoading}
        error={evQ.isError ? (evQ.error as Error) : null}
        data={evQ.data}
      />

      <div className={cn(overviewCardShell, "space-y-4 rounded-2xl px-4 py-4")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl space-y-2 text-xs text-muted-foreground">
            <p>
              Caps: bank {formatRobinhoodLpUsd(Number(safety?.maxBankUsd ?? 25))}, position{" "}
              {formatRobinhoodLpUsd(Number(safety?.maxPositionUsd ?? 5))}, max 2 concurrent.
            </p>
            <p>
              Starting the agent enables the outcome mandate. It will open at most one position per
              tick when gates pass. Stopping disables new opens; open positions are not force-closed
              from this button.
            </p>
            {!dryRun ? (
              <p className="font-medium text-amber-200">
                Consequence: dry-run is off. Enabling spends real ETH gas and deploys up to the
                position cap into Uniswap v3. Only proceed after a dedicated security review.
              </p>
            ) : (
              <p>
                Consequence: with dry-run on, positions are recorded only. No mainnet transfers occur
                until an operator sets ROBINHOOD_LP_REAL_DRY_RUN=false.
              </p>
            )}
            {config?.agentAddress ? (
              <p className="font-mono text-[11px] text-foreground/80">
                Signer: {config.agentAddress}
              </p>
            ) : null}
            {config?.lastError ? (
              <p className="text-destructive">Last error: {config.lastError}</p>
            ) : null}
          </div>

          <div className="flex flex-col items-stretch gap-2 sm:min-w-[200px]">
            {!agentOn ? (
              <>
                {!confirmLive ? (
                  <button
                    type="button"
                    disabled={!canStart || busy}
                    onClick={() => setConfirmLive(true)}
                    className={cn(
                      "min-h-11 rounded-xl px-4 text-sm font-semibold transition",
                      canStart
                        ? "bg-primary text-primary-foreground hover:opacity-90"
                        : "cursor-not-allowed bg-muted text-muted-foreground",
                    )}
                  >
                    Start live agent
                  </button>
                ) : (
                  <div className="space-y-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                    <p className="text-xs text-amber-100">
                      Confirm enable? Caps apply. Dry-run badge above shows whether real funds move.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => startMutation.mutate()}
                        className="min-h-10 flex-1 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground"
                      >
                        {busy ? "Starting…" : "Confirm start"}
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setConfirmLive(false)}
                        className="min-h-10 rounded-lg border border-border px-3 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => stopMutation.mutate()}
                className="min-h-11 rounded-xl border border-destructive/40 bg-destructive/10 px-4 text-sm font-semibold text-destructive hover:bg-destructive/20"
              >
                {busy ? "Stopping…" : "Stop live agent"}
              </button>
            )}
            {!ready || !anonymousId ? (
              <p className="text-[11px] text-muted-foreground">Connect your Syra agent wallet to control the pilot.</p>
            ) : null}
            {!unlocked ? (
              <p className="text-[11px] text-muted-foreground">Start stays disabled until the EV gate turns green.</p>
            ) : null}
            {killSwitch ? (
              <p className="text-[11px] text-destructive">Operator kill switch is on. Starts are blocked.</p>
            ) : null}
            {safety && !dryRun && !pilotEnabled ? (
              <p className="text-[11px] text-muted-foreground">
                Live funds need ROBINHOOD_LP_REAL_PILOT_ENABLED=true. Dry-run can start without it.
              </p>
            ) : null}
            {actionError ? <p className="text-[11px] text-destructive">{actionError}</p> : null}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Positions
          </p>
          <PositionsTable
            positions={positions}
            loading={Boolean(mandate?.mandateId) && statusQ.isLoading}
          />
          {statusQ.isError ? (
            <p className="mt-2 text-xs text-destructive">
              Could not load positions: {(statusQ.error as Error).message}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
