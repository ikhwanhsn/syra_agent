import { Target } from "lucide-react";
import { overviewCardShell } from "@/components/dashboard/overview/overviewStyles";
import { cn } from "@/lib/utils";
import type { LabX402VolumeStats } from "@/lib/labsX402Api";
import { formatSimulationUsd } from "@/lib/labsX402Simulation";

interface VolumeProgressCardProps {
  stats: LabX402VolumeStats | undefined;
  isLoading: boolean;
}

export function VolumeProgressCard({ stats, isLoading }: VolumeProgressCardProps) {
  const volumeUsd = stats?.volumeUsd ?? 0;
  const target = stats?.targetVolumeUsd ?? 50;
  const remaining = stats?.remainingUsd ?? target;
  const pct = stats?.progressPct ?? 0;
  const callCount = stats?.callCount ?? 0;
  const dayUtc = stats?.dayUtc;

  return (
    <div className={cn(overviewCardShell, "space-y-4 p-5")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Target className="h-4 w-4 text-primary" aria-hidden />
            Target volume (24h)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Gross successful x402 volume today
            {dayUtc ? ` · ${dayUtc} UTC` : ""}.
          </p>
        </div>
        {isLoading && !stats ? (
          <span className="text-xs text-muted-foreground">Loading…</span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">
          {formatSimulationUsd(volumeUsd)}
        </span>
        <span className="text-sm text-muted-foreground">
          / {formatSimulationUsd(target)}
        </span>
        <span className="ml-auto text-xs font-medium tabular-nums text-muted-foreground">
          {pct.toFixed(1)}%
        </span>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="24h volume progress toward target"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            pct >= 100 ? "bg-emerald-500" : "bg-primary",
          )}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>

      <dl className="grid gap-2 text-xs sm:grid-cols-3">
        <div>
          <dt className="text-muted-foreground">Successful calls</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{callCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Remaining</dt>
          <dd className="mt-0.5 font-medium tabular-nums">{formatSimulationUsd(remaining)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="mt-0.5 font-medium">
            {pct >= 100 ? "Target hit" : remaining > 0 ? "In progress" : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
