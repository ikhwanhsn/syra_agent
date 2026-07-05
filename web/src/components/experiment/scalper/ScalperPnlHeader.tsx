import { Activity, DollarSign, Percent, Target, Timer, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatScalperPct, formatScalperUsd, type ScalperLedger } from "@/lib/scalperApi";
import { LpStatTile } from "@/components/experiment/lp/LpStatTile";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";

export interface ScalperPnlHeaderProps {
  ledger: ScalperLedger | undefined;
  todayTrades: number;
  todayPnlUsd: number;
  avgHoldMinutes: number | null;
  loading?: boolean;
  className?: string;
}

export function ScalperPnlHeader({
  ledger,
  todayTrades,
  todayPnlUsd,
  avgHoldMinutes,
  loading,
  className,
}: ScalperPnlHeaderProps) {
  const totalPnl = ledger?.totalPnlUsd ?? 0;
  const pnlTone = totalPnl > 0 ? "positive" : totalPnl < 0 ? "negative" : "default";

  return (
    <section className={cn("space-y-4", className)}>
      <article className={cn(overviewCardShell, "relative overflow-hidden rounded-3xl ring-1 ring-amber-500/15")}>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.45]"
          style={{
            background:
              "radial-gradient(480px 180px at 0% 0%, hsl(38 92% 50% / 0.14), transparent 58%)",
          }}
          aria-hidden
        />

        <div className="relative grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 sm:p-5">
          <LpStatTile
            label="Total P&L"
            value={loading ? "…" : `${totalPnl >= 0 ? "+" : ""}${formatScalperUsd(totalPnl)}`}
            subValue={
              loading
                ? undefined
                : `Realized ${formatScalperUsd(ledger?.realizedPnlUsd)} · Unrealized ${formatScalperUsd(ledger?.unrealizedPnlUsd)}`
            }
            icon={TrendingUp}
            tone={pnlTone}
            highlight
          />
          <LpStatTile
            label="Equity"
            value={loading ? "…" : formatScalperUsd(ledger?.equityUsd)}
            subValue={loading ? undefined : formatScalperPct(ledger?.returnPct)}
            icon={DollarSign}
            tone="accent"
            highlight
          />
          <LpStatTile
            label="Win rate"
            value={loading ? "…" : ledger?.winRatePct != null ? `${ledger.winRatePct.toFixed(1)}%` : "—"}
            subValue={
              loading ? undefined : `${ledger?.wins ?? 0}W / ${ledger?.losses ?? 0}L · ${ledger?.totalTrades ?? 0} total`
            }
            icon={Target}
            tone="default"
          />
          <LpStatTile
            label="Open positions"
            value={loading ? "…" : String(ledger?.openPositions ?? 0)}
            subValue={loading ? undefined : `${formatScalperUsd(ledger?.deployedUsd)} deployed`}
            icon={Activity}
            tone="default"
          />
          <LpStatTile
            label="Today"
            value={loading ? "…" : `${todayPnlUsd >= 0 ? "+" : ""}${formatScalperUsd(todayPnlUsd)}`}
            subValue={loading ? undefined : `${todayTrades} trades`}
            icon={Percent}
            tone={todayPnlUsd > 0 ? "positive" : todayPnlUsd < 0 ? "negative" : "default"}
          />
          <LpStatTile
            label="Avg hold"
            value={loading ? "…" : avgHoldMinutes != null ? `${avgHoldMinutes.toFixed(1)}m` : "—"}
            subValue="Short-term scalps"
            icon={Timer}
            tone="default"
          />
        </div>
      </article>
    </section>
  );
}
