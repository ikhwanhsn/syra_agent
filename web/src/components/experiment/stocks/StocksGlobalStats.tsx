import { BrainCircuit, Newspaper, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatStocksUsd } from "@/lib/stocksExperimentApi";
import type { StocksOverview } from "@/lib/stocksExperimentApi";
import { LpStatTile } from "@/components/experiment/lp/LpStatTile";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface StocksGlobalStatsProps {
  overview: StocksOverview | undefined;
  loading?: boolean;
  className?: string;
}

export function StocksGlobalStats({ overview, loading, className }: StocksGlobalStatsProps) {
  const pnl = overview?.sumPnlUsd ?? 0;
  const pnlTone = pnl > 0 ? "positive" : pnl < 0 ? "negative" : "default";

  return (
    <section className={cn("space-y-4", className)}>
      <article className={cn(overviewCardShell, "relative overflow-hidden rounded-3xl ring-1 ring-sky-500/12")}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            background:
              "radial-gradient(480px 180px at 0% 0%, hsl(199 89% 48% / 0.12), transparent 58%)",
          }}
          aria-hidden
        />

        <div className="relative grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
          <LpStatTile
            label="Best agent P&L"
            value={loading ? "…" : `${pnl >= 0 ? "+" : ""}${formatStocksUsd(overview?.leaderSumPnlUsd ?? pnl)}`}
            subValue={
              loading || !overview?.leaderStrategyName
                ? "Agents competing on news signals"
                : overview.leaderStrategyName
            }
            icon={TrendingUp}
            tone={pnlTone}
            highlight
          />
          <LpStatTile
            label="Active strategies"
            value={loading ? "…" : String(overview?.strategyCount ?? 0)}
            subValue={loading ? undefined : `${overview?.settledRuns ?? 0} settled trades`}
            icon={BrainCircuit}
            tone="accent"
            highlight
          />
          <LpStatTile
            label="xStocks universe"
            value={loading ? "…" : String(overview?.universeCount ?? 0)}
            subValue={loading ? undefined : "Priced via Jupiter on Solana"}
            icon={Newspaper}
            tone="default"
          />
        </div>
      </article>
    </section>
  );
}
