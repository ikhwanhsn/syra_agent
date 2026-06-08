import { Sparkles, Trophy, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { RISE_EXIT_STRATEGIES, RISE_PERSONALITIES } from "@/lib/riseExperimentModel";
import { LpStatTile } from "@/components/experiment/lp/LpStatTile";

export interface RiseExperimentStatsProps {
  loading?: boolean;
  avgRetPct: number;
  winners: number;
  totalStrategies: number;
  topStrategyLabel: string | null;
  topRetPct: number | null;
  newListings: number;
  borrowAprPct?: number;
  className?: string;
}

function formatPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function RiseExperimentStats({
  loading = false,
  avgRetPct: _avgRetPct,
  winners,
  totalStrategies,
  topStrategyLabel,
  topRetPct,
  newListings,
  borrowAprPct,
  className,
}: RiseExperimentStatsProps) {
  if (loading) {
    return (
      <section className={cn("grid gap-3 sm:grid-cols-3", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[100px] rounded-2xl" />
        ))}
      </section>
    );
  }

  return (
    <section className={cn("grid gap-3 sm:grid-cols-3", className)}>
      <LpStatTile
        label="Best performer"
        value={topRetPct != null ? formatPct(topRetPct) : "—"}
        subValue={topStrategyLabel ?? "Waiting for first trade"}
        icon={Trophy}
        tone={topRetPct != null && topRetPct > 0 ? "positive" : "default"}
        highlight
      />
      <LpStatTile
        label="Strategies winning"
        value={`${winners} of ${totalStrategies}`}
        subValue="Currently in profit right now"
        icon={TrendingUp}
        tone={winners > 0 ? "positive" : "default"}
      />
      <LpStatTile
        label="New listings found"
        value={String(newListings)}
        subValue={
          borrowAprPct != null
            ? `Borrow rate ${borrowAprPct.toFixed(0)}% APR on leverage`
            : "Fresh RISE tokens spotted today"
        }
        icon={Sparkles}
        tone="accent"
      />
    </section>
  );
}

export function formatRiseStrategyLabel(personalityId: number, exitId: number): string {
  const buy = RISE_PERSONALITIES[personalityId]?.name ?? "Unknown";
  const sell = RISE_EXIT_STRATEGIES[exitId]?.name ?? "Unknown";
  return `${buy} · ${sell}`;
}
