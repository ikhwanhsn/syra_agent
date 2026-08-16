import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";
import {
  fetchAyeLabsLabState,
  fetchAyeLabsRuns,
  fetchAyeLabsStats,
  fetchAyeLabsStrategies,
  type AyeLabsAgentStats,
} from "@/lib/ayeLabsApi";
import {
  disableAyeLabsReal,
  enableAyeLabsReal,
  fetchAyeLabsRealPositions,
  fetchAyeLabsRealState,
} from "@/lib/ayeLabsRealApi";

function fmtSol(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "-";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(4)} SOL`;
}

export default function AyeLabsExperiment() {
  const queryClient = useQueryClient();
  const [riskAck, setRiskAck] = useState(false);

  const stateQ = useQuery({
    queryKey: ["ayeLabs", "state"],
    queryFn: fetchAyeLabsLabState,
    refetchInterval: 60_000,
  });
  const statsQ = useQuery({
    queryKey: ["ayeLabs", "stats", stateQ.data?.activeExperimentId ?? "none"],
    queryFn: fetchAyeLabsStats,
    enabled: stateQ.isFetched,
    refetchInterval: 60_000,
  });
  const runsQ = useQuery({
    queryKey: ["ayeLabs", "runs", stateQ.data?.activeExperimentId ?? "none"],
    queryFn: () => fetchAyeLabsRuns({ limit: 20 }),
    enabled: Boolean(stateQ.data?.activeExperimentId),
    refetchInterval: 45_000,
  });
  const strategiesQ = useQuery({
    queryKey: ["ayeLabs", "strategies"],
    queryFn: fetchAyeLabsStrategies,
    staleTime: 300_000,
  });
  const realStateQ = useQuery({
    queryKey: ["ayeLabs", "real-state"],
    queryFn: fetchAyeLabsRealState,
    refetchInterval: 15_000,
  });
  const realPosQ = useQuery({
    queryKey: ["ayeLabs", "real-positions"],
    queryFn: () => fetchAyeLabsRealPositions({ limit: 20 }),
    refetchInterval: 15_000,
  });

  const enableMut = useMutation({
    mutationFn: () =>
      enableAyeLabsReal({
        maxPositionSol: 0.3,
        dryRun: false,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ayeLabs", "real-state"] });
      void queryClient.invalidateQueries({ queryKey: ["ayeLabs", "real-positions"] });
    },
  });
  const disableMut = useMutation({
    mutationFn: () => disableAyeLabsReal({ closeAll: true }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["ayeLabs", "real-state"] });
      void queryClient.invalidateQueries({ queryKey: ["ayeLabs", "real-positions"] });
    },
  });

  const ranked = useMemo(() => {
    const agents = statsQ.data?.agents ?? [];
    return [...agents].sort(
      (a, b) => (b.sumNetPnlSol ?? 0) - (a.sumNetPnlSol ?? 0),
    ) as AyeLabsAgentStats[];
  }, [statsQ.data?.agents]);

  const totals = useMemo(() => {
    return ranked.reduce(
      (acc, a) => ({
        decided: acc.decided + (a.decided || 0),
        wins: acc.wins + (a.wins || 0),
        losses: acc.losses + (a.losses || 0),
        pnl: acc.pnl + (a.sumNetPnlSol || 0),
        open: acc.open + (a.openPositions || 0),
      }),
      { decided: 0, wins: 0, losses: 0, pnl: 0, open: 0 },
    );
  }, [ranked]);

  const grad = realStateQ.data?.paperGraduation;
  const realEnabled = Boolean(realStateQ.data?.enabled);
  const engine = realStateQ.data?.engine;
  const mode = realStateQ.data?.onchain?.mode ?? "capped_real_gate";
  const realized =
    realStateQ.data?.realizedNetPnlSol ?? realStateQ.data?.realizedPnlSol ?? null;
  const gradPnl = grad?.sumNetPnlSol ?? grad?.sumPnlSol ?? null;
  const canEnable = Boolean(realStateQ.data?.canEnable) && riskAck;

  return (
    <div
      className={cn(
        DASHBOARD_CONTENT_SHELL,
        PAGE_PADDING_TOP_STANDARD,
        PAGE_SAFE_AREA_BOTTOM_COMPACT,
        "space-y-6",
      )}
    >
      <div
        className={cn(
          "rounded-lg border px-4 py-3 text-sm",
          realEnabled
            ? "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300"
            : "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
        )}
      >
        <p className="font-semibold tracking-tight">
          {realEnabled ? "Real gate ON · opens pending LP wire" : "Paper lab · real gate capped"}
        </p>
        <p className="mt-1 text-xs opacity-90">
          AyeLabs screens Solana via GMGN V/L radar (liq $5000, smart degen 2), then paper-provides
          liquidity on matched Meteora DLMM pools for up to 12h. Opens require expected fees to cover
          chain costs after the paper fee haircut. Real gate stores caps only in v1. Disable LP/Meridian
          real on the same earn wallet first.
        </p>
      </div>

      <header className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          AyeLabs · GMGN V/L DLMM lab
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">AyeLabs</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Meridian-style paper desk with strategy from gmgn-vl-radar: fee-farming DLMM ranges,
          EV gate before open, and 12-hour holds. Meridian stays separate.
          {stateQ.data?.gmgnConfigured === false
            ? " GMGN_API_KEY missing on the API."
            : stateQ.data?.screening
              ? ` Gates: liq $${Number(stateQ.data.screening.minLiquidityUsd || 5000).toLocaleString()}, smart degen ${String(stateQ.data.screening.minSmartDegen ?? 2)}.`
              : ""}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" asChild>
            <Link to="/wallet?wallet=earn">Fund earn wallet</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/meridian">Meridian desk</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Cohort" value={stateQ.data?.activeExperimentId?.slice(0, 18) ?? "-"} />
        <Stat
          label="Decided trades"
          value={String(totals.decided)}
          hint={`${totals.wins}W / ${totals.losses}L · ${totals.open} open`}
        />
        <Stat label="Paper PnL" value={fmtSol(totals.pnl)} positive={totals.pnl > 0} />
        <Stat
          label="Graduation"
          value={grad?.pass ? "Ready" : "Optional"}
          hint={
            grad
              ? `${grad.decided} decided · ${fmtSol(gradPnl)} (live can skip)`
              : "Earn product: ayelabs_vl_dlmm"
          }
        />
      </div>

      <section className={cn(overviewCardShell, "space-y-3 p-5")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">AyeLabs real gate</h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              Mode: {mode}. Wallet: earn pillar. Caps: ≤{realStateQ.data?.caps?.maxPositionSol ?? 0.5}{" "}
              SOL/pos, ≤{realStateQ.data?.caps?.maxConcurrentPositions ?? 2} concurrent, ~
              {realStateQ.data?.caps?.capSol ?? 1} SOL total guidance. No child engine.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {realEnabled ? (
              <Button
                variant="destructive"
                size="sm"
                disabled={disableMut.isPending}
                onClick={() => disableMut.mutate()}
              >
                {disableMut.isPending ? "Disabling…" : "Disable real gate"}
              </Button>
            ) : (
              <Button
                size="sm"
                disabled={!canEnable || enableMut.isPending}
                onClick={() => enableMut.mutate()}
              >
                {enableMut.isPending ? "Enabling…" : "Enable real gate"}
              </Button>
            )}
          </div>
        </div>

        <label className="flex items-start gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={riskAck}
            onChange={(e) => setRiskAck(e.target.checked)}
          />
          <span>
            I understand enabling the real gate arms capped live trading on my earn wallet once
            LP-exec is wired, and I can lose money. I funded only ~1 SOL.
          </span>
        </label>

        <div className="grid gap-2 rounded-md border border-border/40 bg-muted/10 px-3 py-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
          <p>
            Gate:{" "}
            <span className="font-medium text-foreground">
              {realEnabled ? "enabled" : "disabled"}
            </span>
          </p>
          <p>
            Strategy:{" "}
            <span className="font-medium text-foreground">gmgn-vl-radar</span>
          </p>
          <p>
            Note:{" "}
            <span className="font-medium text-foreground">
              {engine?.note ? "config-only v1" : "paper"}
            </span>
          </p>
          <p>
            Realized:{" "}
            <span className="font-medium text-foreground">{fmtSol(realized)}</span>
          </p>
        </div>

        {(enableMut.error || disableMut.error || engine?.lastSyncError) && (
          <p className="text-xs text-destructive">
            {String(
              (enableMut.error as Error | undefined)?.message ||
                (disableMut.error as Error | undefined)?.message ||
                engine?.lastSyncError ||
                "Action failed",
            )}
          </p>
        )}

        {(realPosQ.data?.positions?.length ?? 0) > 0 ? (
          <ul className="space-y-2">
            {(realPosQ.data?.positions ?? []).slice(0, 8).map((p) => (
              <li
                key={String(p._id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/10 px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {String(p.strategyName ?? "-")} · {String(p.poolName || p.poolAddress || "-")}
                </span>
                <span className="text-xs uppercase text-muted-foreground">{String(p.status)}</span>
                <span className="tabular-nums text-muted-foreground">
                  {p.realNetPnlSol != null
                    ? fmtSol(Number(p.realNetPnlSol))
                    : fmtSol(Number(p.depositSol))}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">
            No live positions yet. After enable, AyeLabs screens and deploys within caps.
          </p>
        )}
      </section>

      <section className={cn(overviewCardShell, "space-y-3 p-5")}>
        <h2 className="text-sm font-semibold">Paper strategy leaderboard</h2>
        {statsQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading stats…</p>
        ) : ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No paper agents yet. Wait for the first AyeLabs signal cron tick (~90s).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="pb-2 pr-3 font-medium">Strategy</th>
                  <th className="pb-2 pr-3 font-medium">W/L</th>
                  <th className="pb-2 pr-3 font-medium">WR</th>
                  <th className="pb-2 pr-3 font-medium">Open</th>
                  <th className="pb-2 font-medium">Net PnL</th>
                </tr>
              </thead>
              <tbody>
                {ranked.map((a) => (
                  <tr key={a.strategyId} className="border-t border-border/40">
                    <td className="py-2 pr-3">
                      <span className="font-medium text-foreground">{a.strategyName}</span>
                      <span className="ml-2 text-xs text-muted-foreground">#{a.strategyId}</span>
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {a.wins}/{a.losses}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">
                      {a.winRate != null ? `${(a.winRate * 100).toFixed(0)}%` : "-"}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{a.openPositions}</td>
                    <td
                      className={cn(
                        "py-2 tabular-nums",
                        a.sumNetPnlSol > 0 && "text-emerald-600 dark:text-emerald-400",
                        a.sumNetPnlSol < 0 && "text-destructive",
                      )}
                    >
                      {fmtSol(a.sumNetPnlSol)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {strategiesQ.data?.length ?? 0} paper strategies · evolution every ~45m (compare surface,
          not the live signer).
        </p>
      </section>

      <section className={cn(overviewCardShell, "space-y-3 p-5")}>
        <h2 className="text-sm font-semibold">Recent paper runs</h2>
        {runsQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading runs…</p>
        ) : (runsQ.data?.rows?.length ?? 0) === 0 ? (
          <p className="text-sm text-muted-foreground">No runs yet.</p>
        ) : (
          <ul className="space-y-2">
            {(runsQ.data?.rows ?? []).map((r) => (
              <li
                key={String(r._id)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/40 bg-muted/10 px-3 py-2 text-sm"
              >
                <span className="font-medium">
                  {String(r.strategyName ?? "-")} ·{" "}
                  {String(r.poolName || r.baseSymbol || r.poolAddress || "-")}
                </span>
                <span className="text-xs uppercase text-muted-foreground">{String(r.status)}</span>
                <span className="tabular-nums text-muted-foreground">
                  {r.simNetPnlSol != null ? fmtSol(Number(r.simNetPnlSol)) : "-"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  positive,
}: {
  label: string;
  value: string;
  hint?: string;
  positive?: boolean;
}) {
  return (
    <div className={cn(overviewCardShell, "p-4")}>
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-lg font-semibold tabular-nums",
          positive ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
