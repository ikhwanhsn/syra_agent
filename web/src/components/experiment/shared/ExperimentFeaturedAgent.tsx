import { useMemo } from "react";
import { Bot, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  formatExperimentPct,
  formatExperimentSol,
  type EquityHistoryPoint,
} from "@/lib/experimentEquityHistory";
import {
  overviewAccentBackground,
  overviewCardShell,
  overviewKickerClass,
  overviewMetricValueClass,
  type OverviewAccent,
} from "@/components/dashboard/overview/overviewStyles";
import { ExperimentBalanceChart } from "@/components/experiment/shared/ExperimentBalanceChart";

export interface FeaturedAgentTrade {
  id: string;
  symbol: string;
  pnlSol: number;
  reason: string;
  timeLabel: string;
}

export interface ExperimentFeaturedAgentProps {
  platformLabel: string;
  strategyLabel: string;
  buyStyle: string;
  sellStyle: string;
  startSol: number;
  equitySol: number;
  retPct: number;
  closedCount: number;
  openCount: number;
  historyPoints: EquityHistoryPoint[];
  recentTrades: FeaturedAgentTrade[];
  accent?: OverviewAccent;
  accentColorClass?: string;
  chartColor?: string;
  ringClass?: string;
  className?: string;
}

function pnlTone(n: number): string {
  if (n > 0) return "text-emerald-600 dark:text-emerald-400";
  if (n < 0) return "text-red-600 dark:text-red-400";
  return "text-muted-foreground";
}

function ensureChartPoints(
  points: EquityHistoryPoint[],
  startSol: number,
  equitySol: number,
): EquityHistoryPoint[] {
  if (points.length >= 2) return points.slice(-40);
  const now = Date.now();
  return [
    { at: now - 3_600_000, value: startSol, label: "Start" },
    { at: now, value: equitySol, label: "Now" },
  ];
}

export function ExperimentFeaturedAgent({
  platformLabel,
  strategyLabel,
  buyStyle,
  sellStyle,
  startSol,
  equitySol,
  retPct,
  closedCount,
  openCount,
  historyPoints,
  recentTrades,
  accent = "experiment",
  accentColorClass = "text-violet-500",
  chartColor = "hsl(262 83% 58%)",
  ringClass = "ring-violet-500/20",
  className,
}: ExperimentFeaturedAgentProps) {
  const chartData = useMemo(
    () => ensureChartPoints(historyPoints, startSol, equitySol),
    [historyPoints, startSol, equitySol],
  );

  const positive = retPct > 0;
  const negative = retPct < 0;

  return (
    <section
      id="agent-balance-chart"
      className={cn(overviewCardShell, "relative overflow-hidden ring-1", ringClass, className)}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{ background: overviewAccentBackground(accent) }}
        aria-hidden
      />

      <div className="relative space-y-0">
        {/* Chart block — first thing visible on page */}
        <div className="border-b border-border/45 px-4 py-4 sm:px-6 sm:py-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className={overviewKickerClass}>10 SOL paper agent · {platformLabel}</p>
              <p className={cn(overviewMetricValueClass, "mt-1 text-3xl sm:text-[2rem]")}>
                {formatExperimentSol(equitySol)}
              </p>
              <p
                className={cn(
                  "mt-1 flex items-center gap-1.5 font-mono text-sm font-semibold tabular-nums",
                  pnlTone(retPct),
                )}
              >
                {positive ? (
                  <TrendingUp className="h-4 w-4" aria-hidden />
                ) : negative ? (
                  <TrendingDown className="h-4 w-4" aria-hidden />
                ) : null}
                {formatExperimentPct(retPct)} vs {formatExperimentSol(startSol)} start
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-lg border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300"
            >
              <Wallet className="mr-1 inline h-3 w-3" aria-hidden />
              Best strategy · live
            </Badge>
          </div>

          <ExperimentBalanceChart
            data={chartData}
            startSol={startSol}
            color={chartColor}
            height={300}
          />
        </div>

        {/* Agent summary */}
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-start gap-3">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-background/55",
                accentColorClass,
              )}
            >
              <Bot className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold tracking-tight text-foreground">{strategyLabel}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Highest-PnL strategy —{" "}
                <span className="font-medium text-foreground">{buyStyle}</span> buys,{" "}
                <span className="font-medium text-foreground">{sellStyle}</span> sells.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <div className="rounded-xl border border-border/50 bg-background/35 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Bank</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{formatExperimentSol(startSol)}</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/35 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Completed</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">{closedCount} trades</p>
            </div>
            <div className="rounded-xl border border-border/50 bg-background/35 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Open</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums">
                {openCount} position{openCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        {recentTrades.length > 0 ? (
          <div className="border-t border-border/45 px-4 py-4 sm:px-6 sm:py-5">
            <p className="text-sm font-semibold tracking-tight text-foreground">Recent agent trades</p>
            <ul className="mt-3 divide-y divide-border/35 rounded-xl border border-border/45 bg-background/25">
              {recentTrades.slice(0, 3).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{t.symbol}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.reason}</p>
                  </div>
                  <p className={cn("shrink-0 font-mono text-sm font-semibold tabular-nums", pnlTone(t.pnlSol))}>
                    {t.pnlSol >= 0 ? "+" : ""}
                    {t.pnlSol.toFixed(3)} SOL
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
