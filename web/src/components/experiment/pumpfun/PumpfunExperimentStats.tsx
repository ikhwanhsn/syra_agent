import { Sparkles, Trophy, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  PUMPFUN_EXIT_STRATEGIES,
  PUMPFUN_PERSONALITIES,
} from "@/lib/pumpfunExperimentModel";
import { LpStatTile } from "@/components/experiment/lp/LpStatTile";

export interface PumpfunExperimentStatsProps {
  loading?: boolean;
  avgRetPct: number;
  winners: number;
  totalStrategies: number;
  topStrategyLabel: string | null;
  topRetPct: number | null;
  newTokens: number;
  className?: string;
}

function formatPct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function PumpfunExperimentStats({
  loading = false,
  avgRetPct,
  winners,
  totalStrategies,
  topStrategyLabel,
  topRetPct,
  newTokens,
  className,
}: PumpfunExperimentStatsProps) {
  const avgTone = avgRetPct > 0 ? "positive" : avgRetPct < 0 ? "negative" : "default";

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
        label="New tokens found"
        value={String(newTokens)}
        subValue="Fresh launches spotted today"
        icon={Sparkles}
        tone="accent"
      />
    </section>
  );
}

export function formatStrategyLabel(personalityId: number, exitId: number): string {
  const buy = PUMPFUN_PERSONALITIES[personalityId]?.name ?? "Unknown";
  const sell = PUMPFUN_EXIT_STRATEGIES[exitId]?.name ?? "Unknown";
  return `${buy} · ${sell}`;
}
