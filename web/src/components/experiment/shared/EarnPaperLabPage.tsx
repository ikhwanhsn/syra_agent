import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { Button } from "@/components/ui/button";
import {
  DASHBOARD_CONTENT_SHELL,
  PAGE_PADDING_TOP_STANDARD,
  PAGE_SAFE_AREA_BOTTOM_COMPACT,
} from "@/lib/layoutConstants";
import { cn } from "@/lib/utils";

export type PaperAgentRow = {
  strategyId: number;
  strategyName: string;
  wins: number;
  losses: number;
  expired: number;
  decided: number;
  openPositions: number;
  winRate: number | null;
  sumPnlUsd: number;
};

type EarnPaperLabPageProps = {
  title: string;
  subtitle: string;
  queryKey: string;
  walletQuery: string;
  earnProductHint: string;
  fetchState: () => Promise<{
    activeExperimentId: string;
    title: string;
    startedAt: string;
    simConfig: Record<string, number>;
  }>;
  fetchStats: () => Promise<{ experimentId: string; agents: PaperAgentRow[] }>;
  fetchRuns: (opts: { limit: number }) => Promise<{ rows: Array<Record<string, unknown>>; total: number }>;
  fetchStrategies: () => Promise<Array<Record<string, unknown>>>;
};

function fmtUsd(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}$${n.toFixed(2)}`;
}

export function EarnPaperLabPage({
  title,
  subtitle,
  queryKey,
  walletQuery,
  earnProductHint,
  fetchState,
  fetchStats,
  fetchRuns,
  fetchStrategies,
}: EarnPaperLabPageProps) {
  const stateQ = useQuery({
    queryKey: [queryKey, "state"],
    queryFn: fetchState,
    refetchInterval: 60_000,
  });
  const statsQ = useQuery({
    queryKey: [queryKey, "stats", stateQ.data?.activeExperimentId ?? "none"],
    queryFn: fetchStats,
    enabled: stateQ.isFetched,
    refetchInterval: 60_000,
  });
  const runsQ = useQuery({
    queryKey: [queryKey, "runs", stateQ.data?.activeExperimentId ?? "none"],
    queryFn: () => fetchRuns({ limit: 20 }),
    enabled: Boolean(stateQ.data?.activeExperimentId),
    refetchInterval: 45_000,
  });
  const strategiesQ = useQuery({
    queryKey: [queryKey, "strategies"],
    queryFn: fetchStrategies,
    staleTime: 300_000,
  });

  const ranked = useMemo(() => {
    const agents = statsQ.data?.agents ?? [];
    return [...agents].sort((a, b) => (b.sumPnlUsd ?? 0) - (a.sumPnlUsd ?? 0));
  }, [statsQ.data?.agents]);

  const totals = useMemo(() => {
    return ranked.reduce(
      (acc, a) => ({
        decided: acc.decided + (a.decided || 0),
        wins: acc.wins + (a.wins || 0),
        losses: acc.losses + (a.losses || 0),
        pnl: acc.pnl + (a.sumPnlUsd || 0),
        open: acc.open + (a.openPositions || 0),
      }),
      { decided: 0, wins: 0, losses: 0, pnl: 0, open: 0 },
    );
  }, [ranked]);

  const gradReady = totals.decided >= 50 && totals.pnl > 0;

  return (
    <div
      className={cn(
        DASHBOARD_CONTENT_SHELL,
        PAGE_PADDING_TOP_STANDARD,
        PAGE_SAFE_AREA_BOTTOM_COMPACT,
        "space-y-6",
      )}
    >
      <header className="space-y-2">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Paper lab · admin
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/wallet?wallet=${walletQuery}`}>Fund {walletQuery} wallet</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/earn">Earn Yield board</Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Cohort" value={stateQ.data?.activeExperimentId?.slice(0, 18) ?? "—"} />
        <Stat
          label="Decided trades"
          value={String(totals.decided)}
          hint={`${totals.wins}W / ${totals.losses}L · ${totals.open} open`}
        />
        <Stat label="Paper PnL" value={fmtUsd(totals.pnl)} positive={totals.pnl > 0} />
        <Stat
          label="Graduation gate"
          value={gradReady ? "Ready" : "Not yet"}
          hint={earnProductHint}
        />
      </div>

      <section className={cn(overviewCardShell, "space-y-3 p-5")}>
        <h2 className="text-sm font-semibold">Strategy leaderboard</h2>
        {statsQ.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading stats…</p>
        ) : ranked.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No agents yet — wait for the first signal cron tick.
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
                  <th className="pb-2 font-medium">PnL</th>
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
                      {a.winRate != null ? `${(a.winRate * 100).toFixed(0)}%` : "—"}
                    </td>
                    <td className="py-2 pr-3 tabular-nums">{a.openPositions}</td>
                    <td
                      className={cn(
                        "py-2 tabular-nums",
                        a.sumPnlUsd > 0 && "text-emerald-600 dark:text-emerald-400",
                        a.sumPnlUsd < 0 && "text-destructive",
                      )}
                    >
                      {fmtUsd(a.sumPnlUsd)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {strategiesQ.data?.length ?? 0} strategies loaded · graduate to real only after ≥50
          decided trades and positive expectancy.
        </p>
      </section>

      <section className={cn(overviewCardShell, "space-y-3 p-5")}>
        <h2 className="text-sm font-semibold">Recent runs</h2>
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
                  {String(r.strategyName ?? "—")} · {String(r.symbol || r.lstSymbol || r.mint || "—")}
                </span>
                <span className="text-xs uppercase text-muted-foreground">{String(r.status)}</span>
                <span className="tabular-nums text-muted-foreground">
                  {r.simPnlUsd != null ? fmtUsd(Number(r.simPnlUsd)) : "—"}
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
